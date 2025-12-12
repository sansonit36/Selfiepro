import { supabase } from './supabaseClient';
import { User, Generation, Transaction, UserProfile } from '../types';

export const authService = {
  signup: async (email: string, password: string, name: string, country: string): Promise<User> => {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Signup failed");

    // 2. Create Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: authData.user.id, 
          full_name: name, 
          country: country,
          credits: 0 
        }
      ]);

    if (profileError) {
       // Optional: Clean up auth user if profile creation fails
       throw new Error("Failed to create user profile: " + profileError.message);
    }

    return {
      id: authData.user.id,
      name,
      email,
      isLoggedIn: true,
      credits: 0
    };
  },

  login: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("Login failed");

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;

    return {
      id: data.user.id,
      name: profile.full_name,
      email: data.user.email || '',
      isLoggedIn: true,
      credits: profile.credits
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  getCurrentSession: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profile) return null;

    return {
      id: session.user.id,
      name: profile.full_name,
      email: session.user.email || '',
      isLoggedIn: true,
      credits: profile.credits
    };
  }
};

export const dbService = {
  // Check if a transaction is a duplicate (ID match OR Metadata match)
  checkDuplicateTransaction: async (txId: string, sender: string, timestamp: string): Promise<{ isDuplicate: boolean; reason?: string }> => {
    // 1. Check strict ID match
    const { data: idMatch } = await supabase
      .from('transactions')
      .select('id')
      .eq('transaction_id', txId)
      .single();

    if (idMatch) {
      return { isDuplicate: true, reason: `Duplicate screenshot.` };
    }

    // 2. Check Metadata match (Sender + Exact Time) -> Indicates edited ID
    if (sender !== "UNKNOWN" && timestamp !== "UNKNOWN") {
        const { data: metaMatch } = await supabase
            .from('transactions')
            .select('id')
            .eq('sender_name', sender)
            .eq('timestamp', timestamp)
            .single();
        
        if (metaMatch) {
            return { isDuplicate: true, reason: `A transaction with this exact timestamp and sender exists. This receipt appears to be edited.` };
        }
    }

    return { isDuplicate: false };
  },

  saveTransaction: async (transaction: { id: string; sender: string; timestamp: string; amount: number }, userEmail: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from('transactions')
      .insert([
        {
            user_id: user.id,
            transaction_id: transaction.id,
            sender_name: transaction.sender,
            timestamp: transaction.timestamp,
            amount: transaction.amount
        }
      ]);
    
    if (error) throw error;
  },

  getUserTransactions: async (): Promise<Transaction[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
    return data as Transaction[];
  },

  addCredits: async (amount: number): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    
    const newCredits = (profile?.credits || 0) + amount;

    const { error } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id);

    if (error) throw error;
    return newCredits;
  },

  deductCredits: async (amount: number): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    
    if (!profile || profile.credits < amount) {
        throw new Error("Insufficient credits");
    }

    const newCredits = profile.credits - amount;

    const { error } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id);

    if (error) throw error;
    return newCredits;
  },

  // --- GALLERY FEATURES ---

  uploadGeneration: async (base64Data: string, template: string): Promise<Generation> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Convert Base64 to Blob
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // 2. Upload to Storage
    const fileName = `${user.id}/${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('generated_images')
      .upload(fileName, blob);

    if (uploadError) throw uploadError;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('generated_images')
      .getPublicUrl(fileName);

    // 4. Save Record
    const { data: generation, error: dbError } = await supabase
      .from('generations')
      .insert([{
        user_id: user.id,
        image_url: publicUrl,
        template: template
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return generation;
  },

  getHistory: async (): Promise<Generation[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Filter logic: Only show images from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .gt('created_at', twentyFourHoursAgo) // Apply 24h filter
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching history:", error);
        return [];
    }
    return data;
  },

  cleanupHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Clean up old records from DB
    await supabase
        .from('generations')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', twentyFourHoursAgo);
  }
};

export const adminService = {
    // Note: These queries will only work if RLS Policies on Supabase allow the 'admin' user to read all rows
    getAllUsers: async (): Promise<UserProfile[]> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as UserProfile[];
    },

    getAllTransactions: async (): Promise<Transaction[]> => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, profiles(full_name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        // Flatten the joined profile name if needed, but for now return as is
        return data as unknown as Transaction[];
    },

    updateUserCredits: async (userId: string, newCredits: number) => {
        const { error } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);
        
        if (error) throw error;
    }
};

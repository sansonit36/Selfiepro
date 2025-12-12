import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, Plan } from '../types';
import { adminService, authService } from '../services/backend';
import Button from './Button';

interface AdminPanelProps {
  onLogout: () => void;
  plans: Plan[];
  onUpdatePlans: (plans: Plan[]) => void;
}

type Tab = 'dashboard' | 'users' | 'transactions' | 'pricing' | 'setup';

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, plans, onUpdatePlans }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
      totalUsers: 0,
      totalRevenue: 0,
      totalTransactions: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
          const [usersData, txData] = await Promise.all([
              adminService.getAllUsers(),
              adminService.getAllTransactions()
          ]);
          setUsers(usersData);
          setTransactions(txData);
          
          // Calculate Stats
          const revenue = txData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
          setStats({
              totalUsers: usersData.length,
              totalTransactions: txData.length,
              totalRevenue: revenue
          });

      } catch (e: any) {
          console.error("Admin fetch error", e);
          setErrorMsg(e.message || "Failed to fetch data. Please check System Setup.");
      } finally {
          setLoading(false);
      }
  };

  const handleUpdateCredits = async (userId: string, currentCredits: number) => {
      const amountStr = prompt("Enter new credit balance:", currentCredits.toString());
      if (amountStr === null) return;
      
      const newAmount = parseInt(amountStr);
      if (isNaN(newAmount)) {
          alert("Invalid number");
          return;
      }

      try {
          await adminService.updateUserCredits(userId, newAmount);
          // Optimistic update
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: newAmount } : u));
      } catch (e: any) {
          console.error(e);
          alert(`Failed to update credits. ${e.message}`);
      }
  };

  const handlePriceUpdate = (planId: string, field: 'price' | 'credits', value: string) => {
      const numValue = parseInt(value);
      if (isNaN(numValue)) return;
      
      const updatedPlans = plans.map(p => 
          p.id === planId ? { ...p, [field]: numValue } : p
      );
      onUpdatePlans(updatedPlans);
  };

  const filteredUsers = users.filter(u => 
      (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (u.id || '').includes(searchTerm)
  );

  const filteredTransactions = transactions.filter(t => 
    t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.sender_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 text-white flex flex-col">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight">Admin<span className="text-indigo-400">Panel</span></h1>
                <p className="text-xs text-slate-400 mt-1">SelfiePro Management</p>
            </div>
            
            <nav className="flex-1 px-4 space-y-2">
                <button 
                    onClick={() => setActiveTab('dashboard')} 
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
                >
                    Dashboard
                </button>
                <button 
                    onClick={() => setActiveTab('users')} 
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
                >
                    Users & Credits
                </button>
                <button 
                    onClick={() => setActiveTab('transactions')} 
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'transactions' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
                >
                    Transactions
                </button>
                <button 
                    onClick={() => setActiveTab('pricing')} 
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'pricing' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
                >
                    Edit Pricing
                </button>
                <button 
                    onClick={() => setActiveTab('setup')} 
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'setup' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
                >
                    System Setup
                </button>
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button onClick={onLogout} className="text-sm text-slate-400 hover:text-white flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                </button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto h-screen">
            <header className="bg-white shadow-sm h-16 flex items-center px-8 justify-between">
                <h2 className="text-lg font-semibold text-gray-800 capitalize">{activeTab}</h2>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-sm text-gray-600">Admin Active</span>
                </div>
            </header>

            <main className="p-8">
                {errorMsg && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    {errorMsg}
                                </p>
                                {errorMsg.includes('relationship') || errorMsg.includes('policy') || errorMsg.includes('column') ? (
                                    <p className="text-xs text-red-600 mt-1">
                                        👉 The database structure is incomplete. Go to <strong>System Setup</strong> and run the updated script.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* DASHBOARD */}
                        {activeTab === 'dashboard' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-gray-500 text-sm font-medium">Total Revenue (PKR)</h3>
                                    <p className="text-3xl font-bold text-green-600 mt-2">Rs. {stats.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-gray-500 text-sm font-medium">Verified Transactions</h3>
                                    <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalTransactions}</p>
                                </div>
                                
                                <div className="col-span-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                                    <div className="flex gap-4">
                                        <Button onClick={() => fetchData()} variant="secondary" className="text-sm">Refresh Data</Button>
                                    </div>
                                    {users.length <= 1 && (
                                        <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-xl">
                                            <strong>Note:</strong> You only see {users.length} user(s). If there should be more, please verify the <strong>System Setup</strong> policies are applied.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* USERS */}
                        {activeTab === 'users' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex justify-between">
                                    <input 
                                        type="text" 
                                        placeholder="Search by Name or ID..." 
                                        className="px-4 py-2 border rounded-lg w-64 text-sm"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <Button onClick={() => fetchData()} variant="secondary" className="text-xs px-3 py-2">Refresh</Button>
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Country</th>
                                            <th className="px-6 py-3">Credits</th>
                                            <th className="px-6 py-3">Created At</th>
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No users found.</td></tr>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">{user.full_name}</div>
                                                        <div className="text-xs text-gray-400 font-mono">{user.id}</div>
                                                    </td>
                                                    <td className="px-6 py-4">{user.country}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold">{user.credits}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 flex gap-2">
                                                        <button 
                                                            onClick={() => handleUpdateCredits(user.id, user.credits)}
                                                            className="text-indigo-600 hover:underline font-medium"
                                                        >
                                                            Edit Credits
                                                        </button>
                                                        <span className="text-gray-300">|</span>
                                                        <button 
                                                            onClick={() => alert("To change password: requires Admin API access via Supabase Edge Function.")}
                                                            className="text-gray-500 hover:text-gray-700"
                                                        >
                                                            Password
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* TRANSACTIONS */}
                        {activeTab === 'transactions' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <input 
                                        type="text" 
                                        placeholder="Search Receipt ID..." 
                                        className="px-4 py-2 border rounded-lg w-64 text-sm"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Receipt ID</th>
                                            <th className="px-6 py-3">Sender</th>
                                            <th className="px-6 py-3">Amount</th>
                                            <th className="px-6 py-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredTransactions.length === 0 ? (
                                            <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No transactions found.</td></tr>
                                        ) : (
                                            filteredTransactions.map(tx => (
                                                <tr key={tx.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-mono font-medium">{tx.transaction_id}</td>
                                                    <td className="px-6 py-4">{tx.sender_name}</td>
                                                    <td className="px-6 py-4 text-green-600 font-bold">Rs. {tx.amount}</td>
                                                    <td className="px-6 py-4 text-gray-500">{new Date(tx.created_at).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* PRICING */}
                        {activeTab === 'pricing' && (
                            <div className="max-w-4xl">
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Note:</strong> Changes here are local to the application state. To persist these across server restarts, database integration for settings is required.
                                    </p>
                                </div>
                                <div className="grid gap-6">
                                    {plans.map(plan => (
                                        <div key={plan.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 capitalize">{plan.name} Plan</h3>
                                                <span className="text-xs text-gray-400 uppercase tracking-wide">{plan.id}</span>
                                            </div>
                                            <div className="flex gap-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Price (PKR)</label>
                                                    <input 
                                                        type="number" 
                                                        className="border rounded px-3 py-2 w-32" 
                                                        value={plan.price}
                                                        onChange={(e) => handlePriceUpdate(plan.id, 'price', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Credits</label>
                                                    <input 
                                                        type="number" 
                                                        className="border rounded px-3 py-2 w-24" 
                                                        value={plan.credits}
                                                        onChange={(e) => handlePriceUpdate(plan.id, 'credits', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SYSTEM SETUP (SQL HELP) */}
                        {activeTab === 'setup' && (
                            <div className="max-w-4xl">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-xl text-gray-900 mb-4">Complete Database Setup</h3>
                                    <p className="text-gray-600 mb-6">
                                        Run this script in the <strong>Supabase SQL Editor</strong>. <br/>
                                        It fixes "Failed to update credits" by granting Admins full access.
                                    </p>
                                    
                                    <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto mb-6 relative group">
                                        <button 
                                          onClick={() => {
                                            navigator.clipboard.writeText(`
-- 1. ADD MISSING COLUMNS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'credits') THEN
        ALTER TABLE public.profiles ADD COLUMN credits INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
        ALTER TABLE public.profiles ADD COLUMN country TEXT;
    END IF;
END $$;

-- 2. SETUP TABLES
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_id TEXT NOT NULL,
  sender_name TEXT,
  timestamp TEXT,
  amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  image_url TEXT,
  template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. FORCE FOREIGN KEY RELATIONSHIPS
DO $$
BEGIN
  ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
  ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id);
EXCEPTION WHEN others THEN NULL;
END $$;

-- 4. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- 5. AGGRESSIVE CLEANUP OF OLD POLICIES
DROP POLICY IF EXISTS "Users see own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin sees all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin updates all profiles" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON profiles;
DROP POLICY IF EXISTS "Users view own profiles" ON profiles;
DROP POLICY IF EXISTS "Users update own profiles" ON profiles;
DROP POLICY IF EXISTS "Users insert own profiles" ON profiles;

DROP POLICY IF EXISTS "Users see own transactions" ON transactions;
DROP POLICY IF EXISTS "Users insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Admin sees all transactions" ON transactions;
DROP POLICY IF EXISTS "Admin Full Access Transactions" ON transactions;
DROP POLICY IF EXISTS "Users view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users insert own transactions" ON transactions;

DROP POLICY IF EXISTS "Users see own generations" ON generations;
DROP POLICY IF EXISTS "Users insert own generations" ON generations;
DROP POLICY IF EXISTS "Admin Full Access Generations" ON generations;
DROP POLICY IF EXISTS "Users view own generations" ON generations;
DROP POLICY IF EXISTS "Users insert own generations" ON generations;

-- 6. CREATE ROBUST POLICIES

-- ADMIN: FULL ACCESS (ALL OPERATIONS)
CREATE POLICY "Admin Full Access Profiles" ON profiles FOR ALL USING (
  lower(auth.jwt() ->> 'email') = 'admin@selfiepro.com'
);

CREATE POLICY "Admin Full Access Transactions" ON transactions FOR ALL USING (
  lower(auth.jwt() ->> 'email') = 'admin@selfiepro.com'
);

CREATE POLICY "Admin Full Access Generations" ON generations FOR ALL USING (
  lower(auth.jwt() ->> 'email') = 'admin@selfiepro.com'
);

-- USERS: OWN DATA ONLY
CREATE POLICY "Users view own profiles" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profiles" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own generations" ON generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own generations" ON generations FOR INSERT WITH CHECK (auth.uid() = user_id);
`);
                                            alert("SQL Copied to Clipboard!");
                                          }}
                                          className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg opacity-100 transition-opacity"
                                        >
                                          Copy SQL
                                        </button>
                                        <code className="text-xs text-green-400 font-mono whitespace-pre block">
{`-- ... (Table Setup) ...

-- 5. CLEANUP OLD POLICIES
DROP POLICY IF EXISTS "Users see own profile" ON profiles;
DROP POLICY IF EXISTS "Admin updates all profiles" ON profiles;
-- ... (Drops all previous attempts)

-- 6. CREATE ROBUST POLICIES

-- ADMIN (Master Access)
CREATE POLICY "Admin Full Access Profiles" ON profiles FOR ALL USING (
  lower(auth.jwt() ->> 'email') = 'admin@selfiepro.com'
);

-- USERS (Own Data Only)
CREATE POLICY "Users view own profiles" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profiles" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- (Repeated for Transactions & Generations)`}
                                        </code>
                                    </div>
                                    
                                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm">
                                        <strong>Instructions:</strong>
                                        <ol className="list-decimal ml-5 mt-2 space-y-1">
                                            <li>Go to your Supabase Dashboard &gt; SQL Editor.</li>
                                            <li>Click "New Query".</li>
                                            <li>Paste the code above.</li>
                                            <li>Click "Run" in the bottom right.</li>
                                            <li>Come back here and click "Refresh Data" on the Dashboard.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    </div>
  );
};

export default AdminPanel;
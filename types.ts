export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64: string; // Pure base64 without data prefix
  mimeType: string;
}

export interface GenerationState {
  isLoading: boolean;
  resultImage: string | null; // Base64 data URL
  error: string | null;
}

export type SceneTemplate = 
  | 'Pakistani House Event'
  | 'Dhaba'
  | 'Rooftop'
  | 'Street'
  | 'Mall'
  | 'New York'
  | 'Switzerland'
  | 'Movie Set'
  | 'Press Conference'
  | 'Random Encounter'
  | 'Award Show'
  | 'Concert Backstage';

export interface User {
  name: string;
  email: string;
  isLoggedIn: boolean;
  credits: number;
}

export interface Plan {
  id: 'basic' | 'standard' | 'pro';
  name: string;
  price: number;
  credits: number;
}

export interface PaymentMethod {
  name: string;
  accountName: string;
  accountNumber: string;
  color: string;
}

export interface Generation {
  id: string;
  image_url: string;
  template: string;
  created_at: string;
}

export interface Transaction {
  id: string; // Internal DB UUID
  transaction_id: string; // Receipt ID (e.g. TID123456)
  amount: number;
  created_at: string;
  sender_name: string;
}
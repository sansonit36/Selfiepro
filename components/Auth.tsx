import React, { useState } from 'react';
import Button from './Button';

interface AuthProps {
  onLoginSuccess: (email: string, name?: string) => void;
  onNavigateBack: () => void;
  initialMode?: 'login' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onNavigateBack, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New fields for signup
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(isLogin) {
        // Login Logic
        if(email && password) {
            onLoginSuccess(email);
        }
    } else {
        // Signup Logic
        if(email && password && name && country) {
            onLoginSuccess(email, name);
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{isLogin ? 'Welcome Back' : 'Join SelfiePro'}</h2>
            <p className="text-gray-500 mt-2">{isLogin ? 'Enter your details to access your account' : 'Start your journey to internet fame'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Signup specific fields */}
          {!isLogin && (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Ali Khan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                    >
                        <option value="" disabled>Select your country</option>
                        <option value="Pakistan">Pakistan</option>
                        <option value="India">India</option>
                        <option value="USA">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="UAE">UAE</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <Button type="submit" className="w-full">{isLogin ? 'Sign In' : 'Create Account'}</Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-indigo-600 hover:text-indigo-500">
                {isLogin ? 'Sign Up' : 'Log In'}
            </button>
        </div>
        
         <div className="mt-4 text-center">
            <button onClick={onNavigateBack} className="text-xs text-gray-400 hover:text-gray-600">Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Pricing from './components/Pricing';
import Payment from './components/Payment';
import ThankYou from './components/ThankYou';
import { User, Plan } from './types';
import { VerificationResult } from './services/geminiService';

type View = 'landing' | 'auth' | 'dashboard' | 'pricing' | 'payment' | 'thankyou';

// Store more details to detect sophisticated fraud
interface TransactionRecord {
    id: string;
    sender: string;
    timestamp: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  
  // Track used transactions with metadata
  const [transactionHistory, setTransactionHistory] = useState<TransactionRecord[]>([]);
  
  // Track last purchase for Thank You page
  const [lastPurchasedCredits, setLastPurchasedCredits] = useState(0);
  
  // Mock User State
  const [user, setUser] = useState<User>({
      name: 'User',
      email: '',
      isLoggedIn: false,
      credits: 0
  });

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleLogin = (email: string, name?: string) => {
      setUser({ 
        ...user, 
        email, 
        isLoggedIn: true, 
        name: name || email.split('@')[0] 
      });
      setCurrentView('dashboard');
  };

  const handleLogout = () => {
      setUser({ ...user, isLoggedIn: false });
      setCurrentView('landing');
  };

  const navigateTo = (view: View) => {
      setCurrentView(view);
  };
  
  const handleGetStarted = () => {
      setAuthInitialMode('signup');
      setCurrentView('auth');
  };

  const handleLoginClick = () => {
      setAuthInitialMode('login');
      setCurrentView('auth');
  };

  const handleSelectPlan = (plan: Plan) => {
      setSelectedPlan(plan);
      setCurrentView('payment');
  };

  const handlePaymentSuccess = (creditsAdded: number, details: VerificationResult) => {
      const newRecord: TransactionRecord = {
          id: details.transactionId,
          sender: details.senderName,
          timestamp: details.timestamp
      };

      // Add to history if it has valid data
      if (details.transactionId !== "UNKNOWN") {
          setTransactionHistory(prev => [...prev, newRecord]);
      }
      
      setUser(prev => ({ ...prev, credits: prev.credits + creditsAdded }));
      
      // Set the credits for the thank you page and navigate there
      setLastPurchasedCredits(creditsAdded);
      setCurrentView('thankyou');
      setSelectedPlan(null);
  };

  // Router Logic
  if (!user.isLoggedIn && currentView !== 'landing' && currentView !== 'auth') {
      // Protect routes
      return <Auth 
          onLoginSuccess={handleLogin} 
          onNavigateBack={() => navigateTo('landing')} 
          initialMode="login"
      />;
  }

  switch (currentView) {
      case 'landing':
          return <LandingPage onGetStarted={handleGetStarted} onLogin={handleLoginClick} />;
      
      case 'auth':
          return <Auth 
            onLoginSuccess={handleLogin} 
            onNavigateBack={() => navigateTo('landing')} 
            initialMode={authInitialMode}
          />;
      
      case 'dashboard':
          return <Dashboard 
                    user={user} 
                    onBuyCredits={() => navigateTo('pricing')} 
                    onLogout={handleLogout}
                    onCreditsUsed={(amount) => setUser(prev => ({...prev, credits: prev.credits - amount}))}
                 />;
      
      case 'pricing':
          return <Pricing onSelectPlan={handleSelectPlan} onCancel={() => navigateTo('dashboard')} />;
      
      case 'payment':
          if (!selectedPlan) {
              navigateTo('pricing');
              return null;
          }
          return <Payment 
                    plan={selectedPlan} 
                    onPaymentSuccess={handlePaymentSuccess} 
                    onCancel={() => navigateTo('pricing')} 
                    transactionHistory={transactionHistory}
                 />;
                 
      case 'thankyou':
          return <ThankYou 
                    creditsAdded={lastPurchasedCredits} 
                    onContinue={() => navigateTo('dashboard')}
                 />;
      
      default:
          return <LandingPage onGetStarted={handleGetStarted} onLogin={handleLoginClick} />;
  }
};

export default App;
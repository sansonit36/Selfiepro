import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Pricing from './components/Pricing';
import Payment from './components/Payment';
import ThankYou from './components/ThankYou';
import { User, Plan } from './types';
import { VerificationResult } from './services/geminiService';
import { authService, dbService } from './services/backend';

type View = 'landing' | 'auth' | 'dashboard' | 'pricing' | 'payment' | 'thankyou';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  
  // Auth state is now nullable to represent "loading" state
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [lastPurchasedCredits, setLastPurchasedCredits] = useState(0);

  // Initialize Auth from Supabase
  useEffect(() => {
    const initAuth = async () => {
        try {
            const sessionUser = await authService.getCurrentSession();
            if (sessionUser) {
                setUser(sessionUser);
                if (currentView === 'landing') setCurrentView('dashboard');
            }
        } catch (e) {
            console.error("Auth init failed", e);
        } finally {
            setIsLoadingAuth(false);
        }
    };
    initAuth();
  }, []);

  const handleLoginSuccess = (email: string, name?: string) => {
      // Reload fresh data from DB to ensure correct state
      setIsLoadingAuth(true);
      authService.getCurrentSession().then(freshUser => {
          if (freshUser) {
              setUser(freshUser);
              setCurrentView('dashboard');
          }
          setIsLoadingAuth(false);
      });
  };

  const handleLogout = async () => {
      await authService.logout();
      setUser(null);
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

  const handlePaymentSuccess = async (creditsAdded: number, details: VerificationResult) => {
      if (!user) return;

      try {
        // 1. Save Transaction to DB
        if (details.transactionId !== "UNKNOWN") {
            await dbService.saveTransaction({
                id: details.transactionId,
                sender: details.senderName,
                timestamp: details.timestamp,
                amount: selectedPlan?.price || 0
            }, user.email);
        }

        // 2. Update Credits in DB
        const newBalance = await dbService.addCredits(creditsAdded);
        
        // 3. Update Local State
        setUser(prev => prev ? ({ ...prev, credits: newBalance }) : null);
        
        setLastPurchasedCredits(creditsAdded);
        setCurrentView('thankyou');
        setSelectedPlan(null);
      } catch (e) {
        alert("Payment recorded locally but failed to save to server. Please contact support.");
        console.error(e);
      }
  };

  const handleCreditsUsed = async (amount: number) => {
      if (!user) return;
      try {
          const newBalance = await dbService.deductCredits(amount);
          setUser(prev => prev ? ({ ...prev, credits: newBalance }) : null);
      } catch (e) {
          console.error("Failed to deduct credits", e);
      }
  };

  if (isLoadingAuth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
      );
  }

  // Router Logic
  // If not logged in and trying to access protected views
  if (!user && currentView !== 'landing' && currentView !== 'auth') {
      return <Auth 
          onLoginSuccess={handleLoginSuccess} 
          onNavigateBack={() => navigateTo('landing')} 
          initialMode="login"
      />;
  }

  switch (currentView) {
      case 'landing':
          return <LandingPage onGetStarted={handleGetStarted} onLogin={handleLoginClick} />;
      
      case 'auth':
          return <Auth 
            onLoginSuccess={handleLoginSuccess} 
            onNavigateBack={() => navigateTo('landing')} 
            initialMode={authInitialMode}
          />;
      
      case 'dashboard':
          if (!user) return null;
          return <Dashboard 
                    user={user} 
                    onBuyCredits={() => navigateTo('pricing')} 
                    onLogout={handleLogout}
                    onCreditsUsed={handleCreditsUsed}
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
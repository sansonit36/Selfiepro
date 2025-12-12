import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Pricing from './components/Pricing';
import Payment from './components/Payment';
import ThankYou from './components/ThankYou';
import AdminPanel from './components/AdminPanel';
import { User, Plan } from './types';
import { VerificationResult } from './services/geminiService';
import { authService, dbService, adminService } from './services/backend';
import { pixelService } from './services/pixelService';

type View = 'landing' | 'auth' | 'dashboard' | 'pricing' | 'payment' | 'thankyou' | 'admin';

const INITIAL_PLANS: Plan[] = [
  { id: 'basic', name: 'Starter', price: 599, credits: 5 },
  { id: 'standard', name: 'Popular', price: 699, credits: 12 },
  { id: 'pro', name: 'Pro', price: 999, credits: 20 },
];

const ADMIN_EMAIL = 'admin@selfiepro.com';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // App Config State (lifted for Admin editing)
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [lastPurchasedCredits, setLastPurchasedCredits] = useState(0);
  const [lastTransactionId, setLastTransactionId] = useState<string>('');
  const [lastPurchaseAmount, setLastPurchaseAmount] = useState<number>(0);

  // Initialize Data
  useEffect(() => {
    const init = async () => {
        try {
            // 1. Auth Check
            const sessionUser = await authService.getCurrentSession();
            if (sessionUser) {
                setUser(sessionUser);
                if (currentView === 'landing') {
                    if (sessionUser.email === ADMIN_EMAIL) {
                        setCurrentView('admin');
                    } else {
                        setCurrentView('dashboard');
                    }
                }
            }

            // 2. Load Plans from DB
            const dbPlans = await dbService.getPlans();
            if (dbPlans.length > 0) {
                setPlans(dbPlans);
            }

            // 3. Load & Initialize Pixels
            const settings = await adminService.getSettings();
            pixelService.initialize(settings);

        } catch (e) {
            console.error("Initialization failed", e);
        } finally {
            setIsLoadingAuth(false);
        }
    };
    init();
  }, []);

  const handleLoginSuccess = (email: string, name?: string) => {
      // Reload fresh data from DB
      setIsLoadingAuth(true);
      authService.getCurrentSession().then(freshUser => {
          if (freshUser) {
              setUser(freshUser);
              if (freshUser.email === ADMIN_EMAIL) {
                  setCurrentView('admin');
              } else {
                  setCurrentView('dashboard');
              }
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
        
        // 3. Update Local State & Tracking Data
        setUser(prev => prev ? ({ ...prev, credits: newBalance }) : null);
        
        setLastPurchasedCredits(creditsAdded);
        setLastTransactionId(details.transactionId !== "UNKNOWN" ? details.transactionId : `MANUAL-${Date.now()}`);
        setLastPurchaseAmount(selectedPlan?.price || 0);

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

  // Admin Check
  if (currentView === 'admin') {
      if (user?.email !== ADMIN_EMAIL) {
          // Fallback if not actually admin
          setCurrentView('dashboard');
          return null;
      }
      return <AdminPanel onLogout={handleLogout} plans={plans} onUpdatePlans={setPlans} />;
  }

  // Router Logic
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
          return <Pricing plans={plans} onSelectPlan={handleSelectPlan} onCancel={() => navigateTo('dashboard')} />;
      
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
                    transactionId={lastTransactionId}
                    amount={lastPurchaseAmount}
                    onContinue={() => navigateTo('dashboard')}
                 />;
      
      default:
          return <LandingPage onGetStarted={handleGetStarted} onLogin={handleLoginClick} />;
  }
};

export default App;

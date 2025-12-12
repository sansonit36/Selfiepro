import React, { useState, useEffect } from 'react';
import { UploadedImage, GenerationState, SceneTemplate, User, Generation, Transaction } from '../types';
import { generateSelfie } from '../services/geminiService';
import { dbService } from '../services/backend';
import ImageUploader from './ImageUploader';
import Button from './Button';

interface DashboardProps {
    user: User;
    onBuyCredits: () => void;
    onLogout: () => void;
    onCreditsUsed: (amount: number) => void;
}

const TEMPLATES: SceneTemplate[] = [
  'Pakistani House Event',
  'Dhaba',
  'Rooftop',
  'Street',
  'Mall',
  'New York',
  'Switzerland',
  'Movie Set',
  'Press Conference',
  'Random Encounter',
  'Award Show',
  'Concert Backstage'
];

const Dashboard: React.FC<DashboardProps> = ({ user, onBuyCredits, onLogout, onCreditsUsed }) => {
  const [userImage, setUserImage] = useState<UploadedImage | null>(null);
  const [celebImages, setCelebImages] = useState<UploadedImage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SceneTemplate>('Pakistani House Event');
  const [customInstructions, setCustomInstructions] = useState('');
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    resultImage: null,
    error: null,
  });
  
  const [history, setHistory] = useState<Generation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Wallet History State
  const [showWallet, setShowWallet] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
    // Background cleanup for old images
    dbService.cleanupHistory().catch(err => console.error("Cleanup warning:", err));
  }, []);

  const loadHistory = async () => {
    try {
      const data = await dbService.getHistory();
      setHistory(data);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenWallet = async () => {
      setShowWallet(true);
      setLoadingTransactions(true);
      try {
          const data = await dbService.getUserTransactions();
          setTransactions(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingTransactions(false);
      }
  };

  const processFile = (file: File): Promise<UploadedImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          file,
          previewUrl: result,
          base64,
          mimeType: file.type,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUserImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const processed = await processFile(files[0]);
      setUserImage(processed);
      setState(prev => ({ ...prev, resultImage: null, error: null }));
    } catch (error) {
      console.error("Error processing user image", error);
    }
  };

  const handleCelebImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const newImages = await Promise.all(
        Array.from(files).map(processFile)
      );
      setCelebImages(prev => [...prev, ...newImages]);
      setState(prev => ({ ...prev, resultImage: null, error: null }));
    } catch (error) {
      console.error("Error processing celeb images", error);
    }
  };

  const removeCelebImage = (index: number) => {
    setCelebImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (user.credits <= 0) {
        setState(prev => ({ ...prev, error: "Insufficient credits. Please top up." }));
        return;
    }
    if (!userImage) {
      setState(prev => ({ ...prev, error: "Please upload your photo first." }));
      return;
    }
    if (celebImages.length === 0) {
      setState(prev => ({ ...prev, error: "Please upload at least one celebrity photo." }));
      return;
    }

    setState({ isLoading: true, resultImage: null, error: null });

    try {
      // 1. Generate Image (AI)
      const resultBase64 = await generateSelfie(userImage, celebImages, selectedTemplate, customInstructions);
      
      // 2. Deduct Credit locally (optimistic)
      onCreditsUsed(1);

      // 3. Save to Supabase Storage & DB
      // We do this in background to show result immediately, but await it to update history list
      const savedRecord = await dbService.uploadGeneration(resultBase64, selectedTemplate);
      
      setHistory(prev => [savedRecord, ...prev]);
      setState({ isLoading: false, resultImage: resultBase64, error: null });
      
    } catch (error: any) {
      console.error(error);
      setState({ 
        isLoading: false, 
        resultImage: null, 
        error: "Failed to generate selfie. " + (error.message || "Unknown error.") 
      });
    }
  };

  const handleDownload = async (imageUrl: string, template: string) => {
    try {
        // Fetch the image as a blob to force download and avoid browser navigation
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `selfie-pro-${template.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Download failed, opening in new tab", error);
        window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Dashboard Header */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1.5 rounded-lg">
               <span className="font-bold">SP</span>
            </span>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">SelfiePro</h1>
          </div>
          
          <div className="flex items-center gap-4">
              <div 
                  onClick={handleOpenWallet}
                  className="bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-indigo-100 transition-colors"
              >
                  <span className="text-sm font-semibold text-indigo-700">{user.credits} Credits</span>
                  <div className="text-indigo-400">|</div>
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <button onClick={onBuyCredits} className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
                  Buy Credits
              </button>
              <button onClick={onLogout} className="text-sm text-gray-500 hover:text-gray-900">Logout</button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          
          {/* Left Column: Controls */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your Vibe</h2>
              <p className="text-gray-500 mb-8">1 Generation = 1 Credit</p>

              <ImageUploader 
                label="1. Your Photo" 
                subLabel="A clear photo of your face."
                onImageSelect={handleUserImageSelect}
                previewImages={userImage ? [userImage.previewUrl] : []}
                onRemove={() => setUserImage(null)}
              />

              <div className="border-t border-gray-100 my-6"></div>

              <ImageUploader 
                label="2. Celebrity Photos" 
                subLabel="Upload one or more celebs you want to pose with."
                onImageSelect={handleCelebImageSelect}
                multiple={true}
                previewImages={celebImages.map(img => img.previewUrl)}
                onRemove={removeCelebImage}
              />

              <div className="border-t border-gray-100 my-6"></div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  3. Select Location
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template}
                      onClick={() => setSelectedTemplate(template)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                        selectedTemplate === template
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  4. Custom Details (Optional)
                </label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  rows={3}
                  placeholder="e.g. Make it look like raining, or I am holding a coffee cup..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                />
              </div>
              
              {state.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {state.error}
                </div>
              )}

              <div className="mt-8">
                <Button 
                  onClick={handleGenerate} 
                  isLoading={state.isLoading} 
                  className="w-full text-lg h-14 shadow-indigo-200 shadow-lg"
                  disabled={user.credits === 0}
                >
                  {user.credits > 0 ? 'Generate Magic Selfie ✨' : 'Buy Credits to Generate'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col items-center justify-start lg:sticky lg:top-24 h-fit space-y-8">
            <div className={`w-full aspect-[3/4] bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden relative flex items-center justify-center transition-all duration-500 ${state.resultImage ? 'ring-4 ring-indigo-50 border-transparent' : ''}`}>
              
              {state.isLoading ? (
                <div className="text-center p-8 animate-pulse">
                   <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-10 h-10 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                   </div>
                   <p className="text-indigo-900 font-semibold text-lg">Thinking...</p>
                   <p className="text-indigo-500 text-sm mt-1">Creating your {selectedTemplate} selfie...</p>
                   <p className="text-xs text-gray-400 mt-4">This usually takes about 10-15 seconds.</p>
                </div>
              ) : state.resultImage ? (
                <img 
                  src={state.resultImage} 
                  alt="Generated Selfie" 
                  className="w-full h-full object-cover animate-fade-in"
                />
              ) : (
                <div className="text-center p-12 text-gray-400">
                  <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-lg font-medium">Your masterpiece will appear here</p>
                  <p className="text-sm mt-2">Upload photos to get started</p>
                </div>
              )}
            </div>

            {state.resultImage && (
              <div className="w-full grid grid-cols-1 gap-4">
                 <Button onClick={() => handleDownload(state.resultImage!, selectedTemplate)} variant="secondary" className="w-full">
                    Download Image
                 </Button>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mt-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Your Gallery
                </h3>
                <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 font-medium flex items-center gap-1.5 w-fit mt-2 sm:mt-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Images auto-delete after 24 hours
                </span>
            </div>
            
            {loadingHistory ? (
                <div className="flex gap-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-48 h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : history.length === 0 ? (
                <p className="text-gray-500">No images generated yet. Create your first one above!</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {history.map((gen) => (
                        <div key={gen.id} className="group relative aspect-[3/4] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100">
                            <img 
                                src={gen.image_url} 
                                alt={gen.template} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <p className="text-white text-xs font-medium mb-2">{gen.template}</p>
                                <button 
                                    onClick={() => handleDownload(gen.image_url, gen.template)}
                                    className="bg-white/20 backdrop-blur-md text-white text-xs py-1.5 px-3 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Save
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      {/* Wallet History Modal */}
      {showWallet && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowWallet(false)}>
              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-900">Payment History</h3>
                      <button onClick={() => setShowWallet(false)} className="text-gray-400 hover:text-gray-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      {loadingTransactions ? (
                          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                      ) : transactions.length === 0 ? (
                          <div className="text-center text-gray-500 py-8">No transactions found.</div>
                      ) : (
                          <div className="space-y-4">
                              {transactions.map(tx => (
                                  <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-gray-100">
                                      <div>
                                          <p className="font-semibold text-gray-900">Credit Top-up</p>
                                          <p className="text-xs text-gray-500 font-mono mt-1">ID: {tx.transaction_id}</p>
                                          <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()} • {tx.sender_name}</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="font-bold text-indigo-600">+ Rs. {tx.amount}</p>
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                              Verified
                                          </span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
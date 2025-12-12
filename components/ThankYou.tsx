import React, { useEffect } from 'react';
import Button from './Button';
import { pixelService } from '../services/pixelService';

interface ThankYouProps {
    creditsAdded: number;
    transactionId: string;
    amount: number;
    onContinue: () => void;
}

const ThankYou: React.FC<ThankYouProps> = ({ creditsAdded, transactionId, amount, onContinue }) => {
    useEffect(() => {
        // Track the purchase via Pixel Service (handles duplication internally)
        pixelService.trackPurchase(amount, 'PKR', transactionId);
        
        console.log('--- PURCHASE COMPLETED ---');
        console.log(`ID: ${transactionId}, Amount: ${amount}, Credits: ${creditsAdded}`);
    }, [creditsAdded, transactionId, amount]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 animate-fade-in">
             <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center relative overflow-hidden">
                {/* Confetti decoration background (CSS-based simple blobs) */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">You're All Set!</h2>
                <p className="text-gray-500 text-lg mb-8">
                    Transaction verified successfully. <br/>
                    <span className="font-bold text-indigo-600 text-2xl">{creditsAdded} Credits</span> have been added to your wallet.
                </p>
                
                <div className="bg-indigo-50 rounded-xl p-4 mb-8 text-sm text-indigo-800 text-left">
                    <p className="font-bold mb-1">Receipt verified via AI 🤖</p>
                    <p>You can now go back to the dashboard and generate your photos.</p>
                </div>

                <Button onClick={onContinue} className="w-full shadow-lg shadow-indigo-200 py-4 text-lg">
                    Start Generating &rarr;
                </Button>
             </div>
        </div>
    );
};

export default ThankYou;

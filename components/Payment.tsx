import React, { useState } from 'react';
import Button from './Button';
import ImageUploader from './ImageUploader';
import { Plan, PaymentMethod, UploadedImage } from '../types';
import { verifyPaymentReceipt, VerificationResult } from '../services/geminiService';

interface PaymentProps {
  plan: Plan;
  onPaymentSuccess: (credits: number, details: VerificationResult) => void;
  onCancel: () => void;
  // We now pass the full history record, not just IDs
  transactionHistory: { id: string; sender: string; timestamp: string }[];
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { name: 'JazzCash', accountName: 'Husnain Ghani', accountNumber: '03184451469', color: 'bg-red-600' },
  { name: 'Easypaisa', accountName: 'Abdul Ghani Dogar', accountNumber: '03184451469', color: 'bg-green-600' },
  { name: 'Nayapay', accountName: 'Husnain Ghani', accountNumber: '03184451469', color: 'bg-blue-600' }
];

const Payment: React.FC<PaymentProps> = ({ plan, onPaymentSuccess, onCancel, transactionHistory }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [receipt, setReceipt] = useState<UploadedImage | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleReceiptUpload = async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      try {
          const img = await processFile(files[0]);
          setReceipt(img);
          setError(null);
      } catch (e) {
          console.error(e);
      }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert('Account number copied!');
  };

  const handleSubmit = async () => {
      if (!selectedMethod) {
          setError('Please select a payment method first.');
          return;
      }
      if (!receipt) {
          setError('Please upload the payment screenshot.');
          return;
      }
      
      setIsVerifying(true);
      setError(null);

      try {
          const result = await verifyPaymentReceipt(receipt, plan.price);
          
          setIsVerifying(false);
          
          // 1. Basic Validation
          if (!result.verified) {
              setError(`Verification failed: ${result.reason} (Confidence: ${result.confidence}%)`);
              return;
          }

          // 2. Forensic Check (Did AI detect editing?)
          if (result.isEdited) {
              setError("⚠️ Security Alert: We detected signs of digital editing on this receipt. Please upload the original, unedited screenshot.");
              return;
          }

          // 3. Strict Duplicate Check
          if (result.transactionId && result.transactionId !== "UNKNOWN") {
              // Direct ID Match
              const idMatch = transactionHistory.find(t => t.id === result.transactionId);
              if (idMatch) {
                  setError(`This Transaction ID (${result.transactionId}) has already been used.`);
                  return;
              }

              // Metadata Collision Match (The "Smart" check)
              // If ID is DIFFERENT, but Sender + Time + Date are EXACTLY the same, it's a fake/edit.
              const metaMatch = transactionHistory.find(t => 
                 t.timestamp !== "UNKNOWN" && 
                 t.timestamp === result.timestamp && 
                 t.sender !== "UNKNOWN" &&
                 t.sender === result.senderName
              );

              if (metaMatch) {
                   setError(`⚠️ Duplicate Detected: A transaction with this exact timestamp and sender was already processed under a different ID. This receipt appears to be edited.`);
                   return;
              }
          }

          // Success
          onPaymentSuccess(plan.credits, result);
          
      } catch (e: any) {
          setIsVerifying(false);
          setError('System error during verification. Please try again or contact support.');
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="bg-white max-w-2xl w-full rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payment for {plan.name}</h2>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Amount to pay</p>
                    <p className="text-2xl font-bold text-indigo-600">Rs. {plan.price}</p>
                </div>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-3">1. Select Payment Method</p>
            <div className="space-y-4 mb-8">
                {PAYMENT_METHODS.map((method, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setSelectedMethod(method)}
                        className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                            selectedMethod?.name === method.name 
                                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                                : 'border-gray-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${method.color}`}>
                                {method.name[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{method.name}</p>
                                <p className="text-sm text-gray-500">{method.accountName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-gray-700 mb-1">{method.accountNumber}</p>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(method.accountNumber);
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                            >
                                Copy Number
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedMethod && (
                <div className="mb-8 animate-fade-in">
                    <h3 className="font-semibold text-gray-900 mb-2">2. Upload {selectedMethod.name} Screenshot</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Please pay <span className="font-bold">Rs. {plan.price}</span> to the account above and upload the receipt.
                    </p>
                    <ImageUploader 
                        label="Transaction Receipt" 
                        onImageSelect={handleReceiptUpload}
                        previewImages={receipt ? [receipt.previewUrl] : []}
                        onRemove={() => setReceipt(null)}
                    />
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium mb-4 flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span>{error}</span>
                </div>
            )}

            <div className="flex gap-4">
                <Button variant="secondary" onClick={onCancel} className="w-1/3">Cancel</Button>
                <Button 
                    variant="primary" 
                    onClick={handleSubmit} 
                    isLoading={isVerifying} 
                    className="w-2/3"
                    disabled={!receipt || !selectedMethod}
                >
                    {isVerifying ? 'Verifying Receipt...' : 'Verify & Pay'}
                </Button>
            </div>
        </div>
    </div>
  );
};

export default Payment;
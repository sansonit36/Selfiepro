import React from 'react';
import Button from './Button';
import { Plan } from '../types';

interface PricingProps {
  plans: Plan[];
  onSelectPlan: (plan: Plan) => void;
  onCancel: () => void;
}

const Pricing: React.FC<PricingProps> = ({ plans, onSelectPlan, onCancel }) => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
       <div className="max-w-7xl mx-auto">
         <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Choose your plan</h2>
            <p className="mt-4 text-xl text-gray-500">Simple pricing for high-quality AI generations.</p>
         </div>

         <div className="grid gap-8 lg:grid-cols-3 lg:gap-x-8">
            {plans.map((plan) => (
                <div key={plan.id} className={`relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col ${plan.id === 'standard' ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'}`}>
                    {plan.id === 'standard' && (
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                            BEST VALUE
                        </div>
                    )}
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                        <div className="mt-4 flex items-baseline text-gray-900">
                            <span className="text-4xl font-extrabold tracking-tight">Rs.{plan.price}</span>
                        </div>
                        <p className="mt-1 text-gray-500">PKR one-time</p>
                    </div>
                    
                    <ul className="mt-6 space-y-4 mb-8 flex-1">
                        <li className="flex">
                             <svg className="flex-shrink-0 w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                             <span className="ml-3 text-gray-500">{plan.credits} Photo Generations</span>
                        </li>
                        <li className="flex">
                             <svg className="flex-shrink-0 w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                             <span className="ml-3 text-gray-500">High Resolution Downloads</span>
                        </li>
                    </ul>

                    <Button onClick={() => onSelectPlan(plan)} variant={plan.id === 'standard' ? 'primary' : 'secondary'} className="w-full">
                        Select {plan.name}
                    </Button>
                </div>
            ))}
         </div>
         
         <div className="text-center mt-10">
             <button onClick={onCancel} className="text-gray-500 hover:text-gray-900">Cancel and go back</button>
         </div>
       </div>
    </div>
  );
};

export default Pricing;
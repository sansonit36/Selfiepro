import React, { useState } from 'react';
import Button from './Button';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const EXAMPLES = [
    {
        label: 'The "Just Ran Into Him" Flex',
        src: 'https://i.postimg.cc/xdxhV4m4/selfie-pro-dhaba-1765540718839.jpg',
        alt: 'Group selfie at a Dhaba with celebrities',
        description: 'Chai, Parathas, and VIPs. No security guards harmed.'
    },
    {
        label: 'The Wedding Crasher',
        src: 'https://i.postimg.cc/mgSK8Dgz/selfie_pro_pakistani_house_event_1765540598191.jpg',
        alt: 'Group selfie at a wedding event',
        description: 'You made it to the guest list. Well, digitally at least.'
    },
    {
        label: 'Global Trotting',
        src: 'https://i.postimg.cc/25cMNKWP/selfie-pro-new-york-1765539445825.jpg',
        alt: 'Group selfie in New York Times Square',
        description: 'From Lahore to NYC in 5 seconds flat.'
    }
];

const FAQS = [
    {
        q: "Is this Photoshop?",
        a: "Nah, Photoshop takes skills. This is AI magic. It's smart enough to match lighting, skin tones, and shadows so your Auntie won't ask questions on WhatsApp."
    },
    {
        q: "Will I look like a potato?",
        a: "Only if you upload a picture where you look like a potato. We preserve your identity perfectly—no beautifying filters, just raw, high-res you."
    },
    {
        q: "Can I use any celebrity?",
        a: "Anyone. Actors, cricketers, politicians (risky choice, but you do you). If you have a photo of them, we can put you next to them."
    },
    {
        q: "Does it cost money?",
        a: "We gotta pay the electricity bill for the supercomputers. But it's cheaper than a flight to Dubai to stalk celebs."
    }
];

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans selection:bg-indigo-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full z-50 relative">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={onGetStarted}>
            <span className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Selfie<span className="text-indigo-600">Pro</span></h1>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={onLogin} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Log In</button>
          <Button onClick={onGetStarted} className="py-2.5 px-5 text-sm rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200">Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-32 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
                <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8 shadow-sm animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    The Ultimate Social Flex Tool
                </div>
                
                <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
                  Skip the Security Detail.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Get the Selfie.</span>
                </h1>
                
                <p className="text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
                  Manifest your dream meetup instantly. Upload your photo, pick a celebrity, and let our AI drop you into a Pakistani wedding, a Dhaba, or NYC. 
                  <span className="block mt-2 font-medium text-indigo-600 italic">It looks so real, even you might believe it happened.</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <Button onClick={onGetStarted} className="text-lg px-8 py-4 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-1 transition-all">Start Flexing Now</Button>
                </div>
            </div>
        </section>

        {/* How it Works */}
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900">How to Hack the Matrix</h2>
                    <p className="text-slate-500 mt-2">Three steps to internet fame.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: '1. Drop a Selfie', desc: 'Upload a clear photo of your beautiful face. No sunglasses, we need to see those eyes.', icon: '📸' },
                        { title: '2. Pick the Target', desc: 'Upload a photo of the celebrity you want to "meet". Actors, singers, or that one politician.', icon: '🎯' },
                        { title: '3. Choose the Vibe', desc: 'Select a scene. Rooftop party? Street food run? We blend the lighting perfectly.', icon: '✨' }
                    ].map((step, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all duration-300 relative group">
                            <div className="text-4xl mb-6 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">{step.icon}</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Showcase Section */}
        <section className="py-24 bg-slate-50">
            <div className="w-full max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div className="text-left">
                        <h3 className="text-3xl sm:text-4xl font-bold text-slate-900">Proof of Concept</h3>
                        <p className="text-slate-500 mt-2 text-lg">Check out these absolute masterpieces.</p>
                    </div>
                    <Button variant="secondary" onClick={onGetStarted}>Create Yours &rarr;</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {EXAMPLES.map((ex, i) => (
                        <div key={i} className="group relative bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                            <div className="aspect-[4/5] overflow-hidden relative bg-slate-200">
                                <img 
                                    src={ex.src} 
                                    alt={ex.alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                                    <span className="text-white font-bold text-xl mb-1">{ex.label}</span>
                                    <p className="text-slate-300 text-sm">{ex.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Features / Why Us */}
        <section className="py-24 bg-indigo-900 text-white relative overflow-hidden">
             {/* Background decoration */}
             <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
             <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20"></div>

             <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl sm:text-5xl font-bold mb-6">Not just another <br/>AI wrapper.</h2>
                        <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
                            Most AI apps turn you into a cartoon or a supermodel that looks nothing like you. 
                            We care about <strong>Identity Preservation</strong>.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "We keep your nose, eyes, and chaos intact.",
                                "Context-aware lighting (no floating heads).",
                                "Pakistani-specific environments (not generic cafes)."
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-lg">
                                    <div className="bg-indigo-700 p-1 rounded-full">
                                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative">
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                             <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                                </div>
                                <div>
                                    <div className="font-bold">Happy User</div>
                                    <div className="text-indigo-300 text-xs">@flex_master_99</div>
                                </div>
                             </div>
                             <p className="italic text-lg">"I told my friends I met Babar Azam at a chai spot. They didn't believe me until I showed them the pic. Now I'm a local legend. 10/10 would lie again."</p>
                        </div>
                    </div>
                </div>
             </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white">
            <div className="max-w-3xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Burning Questions 🔥</h2>
                <div className="space-y-4">
                    {FAQS.map((faq, index) => (
                        <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-indigo-300">
                            <button 
                                onClick={() => toggleFaq(index)}
                                className="w-full flex items-center justify-between p-6 text-left bg-slate-50/50 hover:bg-slate-50"
                            >
                                <span className="font-semibold text-slate-900">{faq.q}</span>
                                <svg 
                                    className={`w-5 h-5 text-slate-400 transform transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                            <div 
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="p-6 pt-0 text-slate-600 leading-relaxed bg-slate-50/50">
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-slate-50">
            <div className="max-w-5xl mx-auto px-4 text-center">
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-8">Ready to break the internet?</h2>
                <Button onClick={onGetStarted} className="text-lg px-10 py-5 shadow-xl shadow-indigo-300">Create Your First Selfie</Button>
                <p className="mt-6 text-slate-500 text-sm">No credit card required to look around. Small fee to generate magic.</p>
            </div>
        </section>
      </main>
      
      <footer className="py-12 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© 2024 SelfiePro. All rights reserved.</p>
            <div className="flex gap-6">
                <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
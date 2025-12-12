import { AppSettings } from '../types';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    ttq: any;
  }
}

let initialized = false;

export const pixelService = {
  initialize: (settings: AppSettings) => {
    if (initialized) return;

    // 1. Initialize Facebook Pixel
    if (settings.facebook_pixel_id) {
      (function(f:any, b:any, e:any, v:any, n?:any, t?:any, s?:any){
        if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)
      })(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      window.fbq('init', settings.facebook_pixel_id);
      window.fbq('track', 'PageView');
      console.log('Facebook Pixel Initialized:', settings.facebook_pixel_id);
    }

    // 2. Initialize TikTok Pixel
    if (settings.tiktok_pixel_id) {
      (function(w:any,d,t:any){
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode?.insertBefore(o,a)};
      })(window, document, 'ttq');

      window.ttq.load(settings.tiktok_pixel_id);
      window.ttq.page();
      console.log('TikTok Pixel Initialized:', settings.tiktok_pixel_id);
    }

    initialized = true;
  },

  trackPurchase: (amount: number, currency: string = 'PKR', transactionId: string) => {
    // Prevent Duplication Logic
    const storageKey = `tracked_tx_${transactionId}`;
    if (localStorage.getItem(storageKey)) {
        console.log(`Event for transaction ${transactionId} already tracked. Skipping.`);
        return;
    }

    // Fire Facebook Event
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: amount,
        currency: currency,
        content_name: 'Credit Pack',
        order_id: transactionId
      });
      console.log("FB Purchase Fired");
    }

    // Fire TikTok Event
    if (window.ttq) {
      window.ttq.track('CompletePayment', {
        content_type: 'product',
        quantity: 1,
        description: 'Credit Pack',
        value: amount,
        currency: currency,
      });
      console.log("TikTok Payment Fired");
    }

    // Mark as tracked
    localStorage.setItem(storageKey, 'true');
  }
};

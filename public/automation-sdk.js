// public/automation-sdk.js
(function () {
    // سيُضبط عند init
    let API_BASE = '';
    let storeId = null;
    let customerId = null;
    let pollInterval = 15000; // ms
  
    function log(...args) { /*console.log('AutomationSDK:', ...args)*/ }
  
    async function postEvent(event, payload = {}) {
      try {
        await fetch(API_BASE + '/log-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            storeId,
            customerId,
            payload
          })
        });
        log('event sent', event);
      } catch (e) {
        console.error('Automation: failed to send event', e);
      }
    }
  
    async function pollActions() {
      try {
        const q = `?customerId=${encodeURIComponent(customerId || 'guest')}`;
        const res = await fetch(API_BASE + '/actions' + q, { method: 'GET' });
        if (!res.ok) return;
        const actions = await res.json();
        (actions || []).forEach(handleAction);
      } catch (e) {
        console.error('Automation.pollActions error', e);
      }
    }
  
    function handleAction(a) {
      if (!a || !a.type) return;
      if (a.type === 'show_popup') showPopup(a.message || '');
      // future: if (a.type === 'send_whatsapp') call backend to send messages, etc.
    }
  
    function showPopup(html) {
      const id = 'automation-sdk-popup';
      if (document.getElementById(id)) return; // avoid duplicates
      const popup = document.createElement('div');
      popup.id = id;
      popup.style = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:#fff;padding:14px;border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,0.18);max-width:320px;';
      popup.innerHTML = `<div style="font-size:14px;line-height:1.4">${html}</div><div style="text-align:right;margin-top:8px"><button id="${id}-close">إغلاق</button></div>`;
      document.body.appendChild(popup);
      document.getElementById(id + '-close').onclick = () => popup.remove();
    }
  
    window.Automation = {
      init(cfg = {}) {
        API_BASE = cfg.apiBase || cfg.api_base || cfg.baseUrl || '';
        storeId = cfg.storeId || null;
        customerId = cfg.customerId || null;
        pollInterval = cfg.pollInterval || pollInterval;
  
        if (!API_BASE) console.warn('Automation: apiBase not set. Use Automation.init({ apiBase: "https://.../api", storeId, customerId })');
  
        // start polling
        setInterval(() => {
          if (customerId) pollActions();
        }, pollInterval);
      },
      track(eventName, payload = {}) {
        // quick guard
        if (!API_BASE) {
          console.warn('Automation: apiBase not set. Call Automation.init first.');
          return;
        }
        postEvent(eventName, payload);
      },
      // optional: expose showPopup for manual triggers
      showPopup: showPopup
    };
  })();
  
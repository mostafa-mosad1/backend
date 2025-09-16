// public/automation-sdk.js
(function(){
    const API_BASE = "https://your-app.vercel.app/api"; // غيّر لدومينك
  
    window.Automation = {
      init({ storeId, customerId }) {
        this.storeId = storeId;
        this.customerId = customerId;
      },
      async track(event, payload = {}) {
        try {
          await fetch(API_BASE + "/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event,
              storeId: this.storeId,
              customerId: this.customerId,
              payload
            })
          });
        } catch (e) { console.error("Automation.track failed", e); }
      },
      async pollActions() {
        try {
          const q = `?customerId=${encodeURIComponent(this.customerId||"guest")}`;
          const res = await fetch(API_BASE + "/actions" + q);
          const actions = await res.json();
          actions.forEach(a => {
            if (a.type === "show_popup") this.showPopup(a.message);
            if (a.type === "send_whatsapp") console.log("Should send whatsapp:", a);
          });
        } catch(e) { console.error(e); }
      },
      showPopup(message) {
        const popup = document.createElement("div");
        popup.style = "position:fixed;bottom:20px;right:20px;background:#fff;padding:15px;border:1px solid #ddd;z-index:99999";
        popup.innerHTML = `<div>${message}</div><button style="margin-top:8px">إغلاق</button>`;
        popup.querySelector("button").onclick = () => popup.remove();
        document.body.appendChild(popup);
      }
    };
  
    setInterval(() => {
      if (window.Automation && window.Automation.pollActions) window.Automation.pollActions();
    }, 15000);
  })();
  
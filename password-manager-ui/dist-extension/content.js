console.log("🔐 Parola Yöneticisi content script yüklendi");let s={isAuthenticated:!1,passwords:[],loading:!1,error:null},u=null,y=null,v=window.location.hostname;const S=`
  /* Bitwarden-style Dropdown */
  .pm-dropdown {
    position: fixed;
    width: 300px;
    max-height: 350px;
    background: #1e2328;
    border: 1px solid #3d4148;
    border-radius: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    z-index: 2147483647;
    overflow: hidden;
    font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: pm-dropdown-appear 0.15s ease-out;
  }
  
  @keyframes pm-dropdown-appear {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .pm-dropdown-content {
    max-height: 300px;
    overflow-y: auto;
  }
  
  .pm-dropdown-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .pm-dropdown-content::-webkit-scrollbar-track {
    background: #1e2328;
  }
  
  .pm-dropdown-content::-webkit-scrollbar-thumb {
    background: #3d4148;
    border-radius: 3px;
  }
  
  /* Password Item - Bitwarden style */
  .pm-password-item {
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: background 0.1s ease;
    border-bottom: 1px solid #2c3036;
  }
  
  .pm-password-item:last-child {
    border-bottom: none;
  }
  
  .pm-password-item:hover {
    background: #2c3036;
  }
  
  .pm-password-item:active {
    background: #363b42;
  }
  
  .pm-password-favicon {
    width: 32px;
    height: 32px;
    background: #175ddc;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: white;
    font-size: 14px;
    font-weight: 600;
  }
  
  .pm-password-info {
    flex: 1;
    min-width: 0;
  }
  
  .pm-password-name {
    font-size: 14px;
    font-weight: 400;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  
  .pm-password-username {
    font-size: 12px;
    color: #8d9095;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .pm-password-fill-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #175ddc;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.1s ease;
  }
  
  .pm-password-fill-icon:hover {
    background: rgba(23, 93, 220, 0.15);
  }
  
  .pm-password-fill-icon svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
  
  /* Login Required State - Bitwarden style */
  .pm-login-required {
    padding: 16px;
    border-bottom: 1px solid #2c3036;
  }
  
  .pm-login-text {
    font-size: 13px;
    color: #ffffff;
    margin-bottom: 12px;
    line-height: 1.4;
  }
  
  .pm-login-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: #175ddc;
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    transition: background 0.1s ease;
    width: 100%;
    text-align: left;
    border-radius: 4px;
  }
  
  .pm-login-btn:hover {
    background: rgba(23, 93, 220, 0.1);
  }
  
  .pm-login-btn svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
  
  /* Empty State */
  .pm-empty-state {
    padding: 20px 16px;
    text-align: center;
  }
  
  .pm-empty-text {
    font-size: 13px;
    color: #8d9095;
  }
  
  /* Loading State */
  .pm-loading {
    padding: 20px;
    text-align: center;
    color: #8d9095;
    font-size: 13px;
  }
  
  .pm-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #3d4148;
    border-top-color: #175ddc;
    border-radius: 50%;
    animation: pm-spin 0.6s linear infinite;
    margin: 0 auto 8px;
  }
  
  @keyframes pm-spin {
    to { transform: rotate(360deg); }
  }
  
  /* Toast */
  .pm-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 16px;
    background: #1e2328;
    border: 1px solid #3d4148;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 2147483647;
    font-family: 'Open Sans', -apple-system, sans-serif;
    font-size: 13px;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: pm-toast-appear 0.2s ease-out;
  }
  
  @keyframes pm-toast-appear {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  
  .pm-toast.success { border-left: 3px solid #51c28a; }
  .pm-toast.error { border-left: 3px solid #c25151; }
`;function A(){if(document.getElementById("pm-overlay-styles"))return;const e=document.createElement("style");e.id="pm-overlay-styles",e.textContent=S,document.head.appendChild(e)}function T(){return'<svg viewBox="0 0 24 24"><path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>'}function I(){return'<svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zm-2 16H5V7h7V5H3v16h14v-7h-2v5h-3z"/></svg>'}function h(e){if(!e)return!1;const t=window.getComputedStyle(e);if(t.display==="none"||t.visibility==="hidden"||t.opacity==="0")return!1;const o=e.getBoundingClientRect();return o.width>0&&o.height>0}function k(e,t="success"){const o=document.querySelector(".pm-toast");o&&o.remove();const n=document.createElement("div");n.className=`pm-toast ${t}`,n.innerHTML=`<span>${t==="success"?"✓":"✕"}</span><span>${e}</span>`,document.body.appendChild(n),setTimeout(()=>{n.style.animation="pm-toast-appear 0.2s ease-out reverse",setTimeout(()=>n.remove(),200)},2e3)}async function O(){s.loading=!0;try{const e=await chrome.runtime.sendMessage({type:"GET_PASSWORDS_FOR_SITE",hostname:v});e?.success&&e.isAuthenticated!==!1?(s.isAuthenticated=!0,s.passwords=e.passwords||[],s.error=null):(s.isAuthenticated=(e?.isAuthenticated===!1,!1),s.passwords=[],s.error=e?.message||null)}catch{s.isAuthenticated=!1,s.passwords=[],s.error="Bağlantı hatası"}s.loading=!1}function w(){const e=document.querySelectorAll('input[type="password"]');return Array.from(e).filter(t=>h(t))}function P(){const e=['input[autocomplete="username"]','input[autocomplete="email"]','input[type="email"]','input[name*="user" i]','input[name*="email" i]','input[name*="login" i]','input[id*="user" i]','input[id*="email" i]','input[type="text"]'],t=[],o=new Set;for(const n of e)document.querySelectorAll(n).forEach(a=>{!o.has(a)&&h(a)&&(o.add(a),t.push(a))});return t}function x(){A();const e=w();console.log("🔐 Password alanları bulundu:",e.length),e.forEach(t=>{if(t.getAttribute("data-pm-attached"))return;t.setAttribute("data-pm-attached","true"),console.log("🔐 Listener ekleniyor:",t.name||t.id||"unnamed");const o=n=>{n.stopPropagation(),console.log("🔐 Input focus/click"),z(t)};t.addEventListener("focus",o),t.addEventListener("click",o)})}async function z(e){if(console.log("🔐 showDropdown çağrıldı"),u&&y===e)return;m(),y=e;const t=document.createElement("div");t.className="pm-dropdown";const o=e.getBoundingClientRect(),n=window.innerWidth,a=320;let p=o.left;p+a>n-10&&(p=n-a-10),p<10&&(p=10),t.style.top=`${o.bottom+4}px`,t.style.left=`${p}px`,t.style.width=`${a}px`,t.innerHTML=`
    <div class="pm-dropdown-content">
      <div class="pm-loading">
        <div class="pm-spinner"></div>
        Yükleniyor...
      </div>
    </div>
  `,document.body.appendChild(t),u=t,await O();const d=t.querySelector(".pm-dropdown-content");if(d)if(!s.isAuthenticated)d.innerHTML=`
      <div class="pm-login-required">
        <div class="pm-login-text">Otomatik doldurma önerilerini görmek için hesabınızın kilidini açın</div>
        <button class="pm-login-btn">
          ${T()}
          Hesap kilidini aç
        </button>
      </div>
    `,d.querySelector(".pm-login-btn")?.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_POPUP"}),m()});else if(s.passwords.length===0)d.innerHTML=`
      <div class="pm-empty-state">
        <div class="pm-empty-text">Bu site için kayıtlı parola yok</div>
      </div>
    `;else{let r="";s.passwords.forEach(i=>{const c=(i.name||i.websiteUrl||"P").charAt(0).toUpperCase();r+=`
        <div class="pm-password-item" data-id="${i.id}">
          <div class="pm-password-favicon">${c}</div>
          <div class="pm-password-info">
            <div class="pm-password-name">${i.name||i.websiteUrl}</div>
            <div class="pm-password-username">${i.username}</div>
          </div>
          <div class="pm-password-fill-icon" title="Doldur">
            ${I()}
          </div>
        </div>
      `}),d.innerHTML=r,d.querySelectorAll(".pm-password-item").forEach(i=>{i.addEventListener("click",()=>{const c=i.getAttribute("data-id"),l=s.passwords.find(g=>g.id===c);l&&(L(l.username,l.password),m())})})}}function m(){u&&(u.remove(),u=null),y=null}document.addEventListener("click",e=>{const t=e.target;!t.closest(".pm-dropdown")&&!t.closest('input[type="password"]')&&m()});document.addEventListener("keydown",e=>{e.key==="Escape"&&m()});function E(e,t){try{const o=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value")?.set;return o?o.call(e,t):e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0,cancelable:!0})),e.dispatchEvent(new Event("change",{bubbles:!0,cancelable:!0})),e.dispatchEvent(new KeyboardEvent("keydown",{bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keyup",{bubbles:!0})),!0}catch(o){return console.error("Input value set error:",o),!1}}function L(e,t){console.log("🔐 fillCredentials çağrıldı:",{username:e,password:"***"});const o=P(),n=w();console.log("🔐 Bulunan alanlar:",{usernameFields:o.length,passwordFields:n.length});let a=!1,p=!1;if(e){const d=n[0];let r=null;if(d){const i=d.closest("form");if(i){const c=i.querySelectorAll('input[type="text"], input[type="email"], input[autocomplete="username"]');for(const l of c)if(h(l)){r=l;break}}if(!r){const c=document.querySelectorAll("input"),l=Array.from(c),g=l.indexOf(d);for(let b=g-1;b>=0;b--){const f=l[b];if((f.type==="text"||f.type==="email")&&h(f)){r=f;break}}}}!r&&o.length>0&&(r=o[0]),r&&(console.log("🔐 Username dolduruluyor:",r.name||r.id),E(r,e)&&(a=!0))}n.length>0&&t&&(console.log("🔐 Password dolduruluyor"),E(n[0],t)&&(p=!0)),a||p?k("Kimlik bilgileri dolduruldu","success"):k("Doldurulacak alan bulunamadı","error")}chrome.runtime.onMessage.addListener((e,t,o)=>((e.type==="AUTOFILL"||e.type==="AUTOFILL_PASSWORD")&&(L(e.username,e.password),o({success:!0})),e.type==="GET_PAGE_INFO"&&o({url:window.location.href,hostname:v,title:document.title,hasLoginForm:w().length>0}),!0));function F(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{setTimeout(x,300)}):setTimeout(x,300),new MutationObserver(()=>{x()}).observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{w().length>0&&chrome.runtime.sendMessage({type:"LOGIN_FORM_DETECTED",hostname:v}).catch(()=>{})},500)}F();console.log("🔐 Parola Yöneticisi autofill sistemi aktif");

console.log("🔐 Parola Yöneticisi content script yüklendi");let a={isAuthenticated:!1,passwords:[],loading:!1,error:null},y=null,A=null,P=window.location.hostname,w=null,l=null;const $=`
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
  
  /* Multi-step login suggested item */
  .pm-password-item.pm-suggested {
    background: rgba(23, 93, 220, 0.1);
    border-left: 3px solid #175ddc;
  }
  
  .pm-password-item.pm-suggested:hover {
    background: rgba(23, 93, 220, 0.2);
  }
  
  .pm-suggested-badge {
    background: #175ddc;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 6px;
    font-weight: 500;
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
`;function M(){if(document.getElementById("pm-overlay-styles"))return;const e=document.createElement("style");e.id="pm-overlay-styles",e.textContent=$,document.head.appendChild(e)}function T(){return'<svg viewBox="0 0 24 24"><path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>'}function E(){return'<svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zm-2 16H5V7h7V5H3v16h14v-7h-2v5h-3z"/></svg>'}function k(e){if(!e)return!1;const s=window.getComputedStyle(e);if(s.display==="none"||s.visibility==="hidden"||s.opacity==="0")return!1;const t=e.getBoundingClientRect();return t.width>0&&t.height>0}function b(e,s="success"){const t=document.querySelector(".pm-toast");t&&t.remove();const n=document.createElement("div");n.className=`pm-toast ${s}`,n.innerHTML=`<span>${s==="success"?"✓":"✕"}</span><span>${e}</span>`,document.body.appendChild(n),setTimeout(()=>{n.style.animation="pm-toast-appear 0.2s ease-out reverse",setTimeout(()=>n.remove(),200)},2e3)}async function z(){a.loading=!0;try{const e=await chrome.runtime.sendMessage({type:"GET_PASSWORDS_FOR_SITE",hostname:P});e?.success&&e.isAuthenticated!==!1?(a.isAuthenticated=!0,a.passwords=e.passwords||[],a.error=null):(a.isAuthenticated=(e?.isAuthenticated===!1,!1),a.passwords=[],a.error=e?.message||null)}catch{a.isAuthenticated=!1,a.passwords=[],a.error="Bağlantı hatası"}a.loading=!1}function f(){const e=document.querySelectorAll('input[type="password"]');return Array.from(e).filter(s=>k(s))}function v(){const e=['input[autocomplete="username"]','input[autocomplete="email"]','input[type="email"]','input[name*="user" i]','input[name*="email" i]','input[name*="login" i]','input[name*="account" i]','input[id*="user" i]','input[id*="email" i]','input[id*="login" i]','input[id*="account" i]','input[placeholder*="email" i]','input[placeholder*="kullanıcı" i]','input[placeholder*="user" i]','input[type="text"]'],s=[],t=new Set;for(const n of e)document.querySelectorAll(n).forEach(r=>{!t.has(r)&&k(r)&&!D(r)&&(t.add(r),s.push(r))});return s}function D(e){const s=(e.name||"").toLowerCase(),t=(e.id||"").toLowerCase(),n=(e.placeholder||"").toLowerCase(),r=e.type.toLowerCase(),d=(e.autocomplete||"").toLowerCase();return!!(r==="search"||d==="off"&&(s.includes("search")||t.includes("search")||n.includes("ara"))||s.includes("search")||t.includes("search")||n.includes("search"))}function q(){return f().length>0||F()}function F(){const e=f(),s=v();if(e.length===0&&s.length>0)for(const t of s){const n=t.closest("form"),r=n?.action?.toLowerCase()||"",d=n?.id?.toLowerCase()||"",c=n?.className?.toLowerCase()||"";if(r.includes("login")||r.includes("signin")||r.includes("auth")||d.includes("login")||d.includes("signin")||c.includes("login")||c.includes("signin")||n&&n.querySelector('button[type="submit"], input[type="submit"]'))return!0;const i=t.parentElement?.parentElement?.parentElement;if(i){const m=i.querySelectorAll("button");for(const g of m){const o=g.textContent?.toLowerCase()||"";if(o.includes("next")||o.includes("continue")||o.includes("devam")||o.includes("ileri")||o.includes("sonraki"))return!0}}}return!1}function S(){M();const e=f(),s=v();console.log("🔐 Password alanları bulundu:",e.length),console.log("🔐 Username alanları bulundu:",s.length),e.forEach(t=>{if(t.getAttribute("data-pm-attached"))return;t.setAttribute("data-pm-attached","true"),console.log("🔐 Password listener ekleniyor:",t.name||t.id||"unnamed");const n=r=>{r.stopPropagation(),console.log("🔐 Password input focus/click"),U(t,"password")};t.addEventListener("focus",n),t.addEventListener("click",n)}),s.forEach(t=>{if(t.getAttribute("data-pm-attached"))return;const n=t.closest("form");if(n&&n.querySelector('input[type="password"]'))return;t.setAttribute("data-pm-attached","true"),console.log("🔐 Username listener ekleniyor:",t.name||t.id||"unnamed");const d=c=>{c.stopPropagation(),console.log("🔐 Username input focus/click"),U(t,"username")};t.addEventListener("focus",d),t.addEventListener("click",d)})}async function U(e,s="password"){if(console.log("🔐 showDropdown çağrıldı, type:",s),y&&A===e)return;x(),A=e;const t=document.createElement("div");t.className="pm-dropdown";const n=e.getBoundingClientRect(),r=window.innerWidth,d=320;let c=n.left;c+d>r-10&&(c=r-d-10),c<10&&(c=10),t.style.top=`${n.bottom+4}px`,t.style.left=`${c}px`,t.style.width=`${d}px`,t.innerHTML=`
    <div class="pm-dropdown-content">
      <div class="pm-loading">
        <div class="pm-spinner"></div>
        Yükleniyor...
      </div>
    </div>
  `,document.body.appendChild(t),y=t,await z();const i=t.querySelector(".pm-dropdown-content");if(i)if(!a.isAuthenticated)i.innerHTML=`
      <div class="pm-login-required">
        <div class="pm-login-text">Otomatik doldurma önerilerini görmek için hesabınızın kilidini açın</div>
        <button class="pm-login-btn">
          ${T()}
          Hesap kilidini aç
        </button>
      </div>
    `,i.querySelector(".pm-login-btn")?.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_POPUP"}),x()});else if(a.passwords.length===0)i.innerHTML=`
      <div class="pm-empty-state">
        <div class="pm-empty-text">Bu site için kayıtlı parola yok</div>
      </div>
    `;else{let m="";if(s==="password"&&l&&l){const o=(l.name||l.websiteUrl||"P").charAt(0).toUpperCase();m+=`
        <div class="pm-password-item pm-suggested" data-id="${l.id}">
          <div class="pm-password-favicon">${o}</div>
          <div class="pm-password-info">
            <div class="pm-password-name">${l.name||l.websiteUrl}</div>
            <div class="pm-password-username">${l.username} <span class="pm-suggested-badge">Önerilen</span></div>
          </div>
          <div class="pm-password-fill-icon" title="Şifreyi doldur">
            ${E()}
          </div>
        </div>
      `,a.passwords.filter(p=>p.id!==l.id).forEach(p=>{const u=(p.name||p.websiteUrl||"P").charAt(0).toUpperCase();m+=`
          <div class="pm-password-item" data-id="${p.id}">
            <div class="pm-password-favicon">${u}</div>
            <div class="pm-password-info">
              <div class="pm-password-name">${p.name||p.websiteUrl}</div>
              <div class="pm-password-username">${p.username}</div>
            </div>
            <div class="pm-password-fill-icon" title="Doldur">
              ${E()}
            </div>
          </div>
        `})}else a.passwords.forEach(o=>{const p=(o.name||o.websiteUrl||"P").charAt(0).toUpperCase();m+=`
          <div class="pm-password-item" data-id="${o.id}">
            <div class="pm-password-favicon">${p}</div>
            <div class="pm-password-info">
              <div class="pm-password-name">${o.name||o.websiteUrl}</div>
              <div class="pm-password-username">${o.username}</div>
            </div>
            <div class="pm-password-fill-icon" title="Doldur">
              ${E()}
            </div>
          </div>
        `});i.innerHTML=m,i.querySelectorAll(".pm-password-item").forEach(o=>{o.addEventListener("click",()=>{const p=o.getAttribute("data-id"),u=a.passwords.find(h=>h.id===p);u&&(s==="username"?(C(u.username),w=u.username,l=u,console.log("🔐 Username dolduruldu, entry hatırlandı:",u.name)):s==="password"&&v().length===0?(I(u.password),w=null,l=null):(O(u.username,u.password),w=null,l=null),x())})})}}function x(){y&&(y.remove(),y=null),A=null}document.addEventListener("click",e=>{const s=e.target,t=s.closest('input[type="password"]')||s.closest('input[type="text"]')||s.closest('input[type="email"]');!s.closest(".pm-dropdown")&&!t&&x()});document.addEventListener("keydown",e=>{e.key==="Escape"&&x()});function L(e,s){try{const t=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value")?.set;return t?t.call(e,s):e.value=s,e.dispatchEvent(new Event("input",{bubbles:!0,cancelable:!0})),e.dispatchEvent(new Event("change",{bubbles:!0,cancelable:!0})),e.dispatchEvent(new KeyboardEvent("keydown",{bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keyup",{bubbles:!0})),!0}catch(t){return console.error("Input value set error:",t),!1}}function C(e){console.log("🔐 fillUsernameOnly çağrıldı:",e);const s=v();if(s.length>0){const t=s[0];if(console.log("🔐 Username dolduruluyor (only):",t.name||t.id),L(t,e))return b("Kullanıcı adı dolduruldu","success"),!0}return b("Kullanıcı adı alanı bulunamadı","error"),!1}function I(e){console.log("🔐 fillPasswordOnly çağrıldı");const s=f();return s.length>0&&(console.log("🔐 Password dolduruluyor (only)"),L(s[0],e))?(b("Şifre dolduruldu","success"),!0):(b("Şifre alanı bulunamadı","error"),!1)}function O(e,s){console.log("🔐 fillCredentials çağrıldı:",{username:e,password:"***"});const t=v(),n=f();console.log("🔐 Bulunan alanlar:",{usernameFields:t.length,passwordFields:n.length});let r=!1,d=!1;if(e){const c=n[0];let i=null;if(c){const m=c.closest("form");if(m){const g=m.querySelectorAll('input[type="text"], input[type="email"], input[autocomplete="username"]');for(const o of g)if(k(o)){i=o;break}}if(!i){const g=document.querySelectorAll("input"),o=Array.from(g),p=o.indexOf(c);for(let u=p-1;u>=0;u--){const h=o[u];if((h.type==="text"||h.type==="email")&&k(h)){i=h;break}}}}!i&&t.length>0&&(i=t[0]),i&&(console.log("🔐 Username dolduruluyor:",i.name||i.id),L(i,e)&&(r=!0))}n.length>0&&s&&(console.log("🔐 Password dolduruluyor"),L(n[0],s)&&(d=!0)),r||d?b("Kimlik bilgileri dolduruldu","success"):b("Doldurulacak alan bulunamadı","error")}chrome.runtime.onMessage.addListener((e,s,t)=>((e.type==="AUTOFILL"||e.type==="AUTOFILL_PASSWORD")&&(O(e.username,e.password),t({success:!0})),e.type==="AUTOFILL_USERNAME"&&(C(e.username),w=e.username,e.entry&&(l=e.entry),t({success:!0})),e.type==="AUTOFILL_PASSWORD_ONLY"&&(I(e.password),l=null,w=null,t({success:!0})),e.type==="GET_PAGE_INFO"&&t({url:window.location.href,hostname:P,title:document.title,hasLoginForm:q(),isMultiStepLogin:F()&&f().length===0,hasPasswordField:f().length>0,hasUsernameField:v().length>0}),!0));function B(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{setTimeout(S,300)}):setTimeout(S,300),new MutationObserver(()=>{S(),l&&f().length>0&&w&&console.log("🔐 Multi-step: Password alanı tespit edildi, önceki entry mevcut:",w)}).observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{const s=f().length>0,t=F();(s||t)&&chrome.runtime.sendMessage({type:"LOGIN_FORM_DETECTED",hostname:P,isMultiStep:t&&!s}).catch(()=>{})},500)}B();console.log("🔐 Parola Yöneticisi autofill sistemi aktif");

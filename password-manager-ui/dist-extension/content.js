let l={isAuthenticated:!1,passwords:[],loading:!1,error:null},v=null,A=null,C=window.location.hostname,p=null;const M=`
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
`;function z(){if(document.getElementById("pm-overlay-styles"))return;const e=document.createElement("style");e.id="pm-overlay-styles",e.textContent=M,document.head.appendChild(e)}function D(){return'<svg viewBox="0 0 24 24"><path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>'}function k(e){if(!e)return"";try{return new URL(e.startsWith("http")?e:`https://${e}`).hostname}catch{const s=e.match(/^(?:https?:\/\/)?([^\/]+)/);return s?s[1]:e}}function E(){return'<svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zm-2 16H5V7h7V5H3v16h14v-7h-2v5h-3z"/></svg>'}function x(e){if(!e)return!1;const s=window.getComputedStyle(e);if(s.display==="none"||s.visibility==="hidden"||s.opacity==="0")return!1;const t=e.getBoundingClientRect();return t.width>0&&t.height>0}function g(e,s="success"){const t=document.querySelector(".pm-toast");t&&t.remove();const n=document.createElement("div");n.className=`pm-toast ${s}`,n.innerHTML=`<span>${s==="success"?"✓":"✕"}</span><span>${e}</span>`,document.body.appendChild(n),setTimeout(()=>{n.style.animation="pm-toast-appear 0.2s ease-out reverse",setTimeout(()=>n.remove(),200)},2e3)}async function q(){l.loading=!0;try{const e=await chrome.runtime.sendMessage({type:"GET_PASSWORDS_FOR_SITE",hostname:C});e?.success&&e.isAuthenticated!==!1?(l.isAuthenticated=!0,l.passwords=e.passwords||[],l.error=null):(l.isAuthenticated=(e?.isAuthenticated===!1,!1),l.passwords=[],l.error=e?.message||null)}catch{l.isAuthenticated=!1,l.passwords=[],l.error="Bağlantı hatası"}l.loading=!1}function f(){const e=document.querySelectorAll('input[type="password"]');return Array.from(e).filter(s=>x(s))}function b(){const e=['input[autocomplete="username"]','input[autocomplete="email"]','input[autocomplete="current-password"]','input[autocomplete="new-password"]','input[type="email"]','input[name*="user" i]','input[name*="email" i]','input[name*="login" i]','input[name*="account" i]','input[id*="user" i]','input[id*="email" i]','input[id*="login" i]','input[id*="account" i]'],s=[],t=new Set;for(const n of e)document.querySelectorAll(n).forEach(o=>{!t.has(o)&&x(o)&&!H(o)&&O(o)&&(t.add(o),s.push(o))});return s}function O(e){const s=e.type.toLowerCase(),t=(e.autocomplete||"").toLowerCase();if(s==="password"||s==="email"||["username","email","current-password","new-password","cc-name","cc-number","name","given-name","family-name"].some(i=>t.includes(i)))return!0;const o=(e.name||"").toLowerCase(),d=(e.id||"").toLowerCase();return!!["user","email","login","account","mail"].some(i=>o.includes(i)||d.includes(i))}function H(e){const s=(e.name||"").toLowerCase(),t=(e.id||"").toLowerCase(),n=(e.placeholder||"").toLowerCase(),o=e.type.toLowerCase(),d=(e.autocomplete||"").toLowerCase();return!!(o==="search"||d==="off"&&(s.includes("search")||t.includes("search")||n.includes("ara"))||s.includes("search")||t.includes("search")||n.includes("search"))}function _(){return f().length>0||F()}function F(){const e=f(),s=b();if(e.length===0&&s.length>0)for(const t of s){const n=t.closest("form"),o=n?.action?.toLowerCase()||"",d=n?.id?.toLowerCase()||"",c=n?.className?.toLowerCase()||"";if(o.includes("login")||o.includes("signin")||o.includes("auth")||d.includes("login")||d.includes("signin")||c.includes("login")||c.includes("signin")||n&&n.querySelector('button[type="submit"], input[type="submit"]'))return!0;const i=t.parentElement?.parentElement?.parentElement;if(i){const u=i.querySelectorAll("button");for(const h of u){const r=h.textContent?.toLowerCase()||"";if(r.includes("next")||r.includes("continue")||r.includes("devam")||r.includes("ileri")||r.includes("sonraki"))return!0}}}return!1}function S(){z();const e=f(),s=b();e.forEach(t=>{if(t.getAttribute("data-pm-attached"))return;t.setAttribute("data-pm-attached","true");const n=o=>{o.stopPropagation(),I(t,"password")};t.addEventListener("focus",n),t.addEventListener("click",n)}),s.forEach(t=>{if(t.getAttribute("data-pm-attached")||!O(t))return;const n=t.closest("form");if(n&&n.querySelector('input[type="password"]'))return;t.setAttribute("data-pm-attached","true");const d=c=>{c.stopPropagation(),I(t,"username")};t.addEventListener("focus",d),t.addEventListener("click",d)})}async function I(e,s="password"){if(v&&A===e)return;y(),A=e;const t=document.createElement("div");t.className="pm-dropdown";const n=e.getBoundingClientRect(),o=window.innerWidth,d=320;let c=n.left;c+d>o-10&&(c=o-d-10),c<10&&(c=10),t.style.top=`${n.bottom+4}px`,t.style.left=`${c}px`,t.style.width=`${d}px`,t.innerHTML=`
    <div class="pm-dropdown-content">
      <div class="pm-loading">
        <div class="pm-spinner"></div>
        Yükleniyor...
      </div>
    </div>
  `,document.body.appendChild(t),v=t,await q();const i=t.querySelector(".pm-dropdown-content");if(i)if(!l.isAuthenticated)i.innerHTML=`
      <div class="pm-login-required">
        <div class="pm-login-text">Otomatik doldurma önerilerini görmek için hesabınızın kilidini açın</div>
        <button class="pm-login-btn">
          ${D()}
          Hesap kilidini aç
        </button>
      </div>
    `,i.querySelector(".pm-login-btn")?.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_POPUP"}),y()});else if(l.passwords.length===0)i.innerHTML=`
      <div class="pm-empty-state">
        <div class="pm-empty-text">Bu site için kayıtlı parola yok</div>
      </div>
    `;else{let u="";if(s==="password"&&p&&p){const r=(p.name||p.websiteUrl||"P").charAt(0).toUpperCase(),w=p.name||k(p.websiteUrl);u+=`
        <div class="pm-password-item pm-suggested" data-id="${p.id}">
          <div class="pm-password-favicon">${r}</div>
          <div class="pm-password-info">
            <div class="pm-password-name">${w}</div>
            <div class="pm-password-username">${p.username} <span class="pm-suggested-badge">Önerilen</span></div>
          </div>
          <div class="pm-password-fill-icon" title="Şifreyi doldur">
            ${E()}
          </div>
        </div>
      `,l.passwords.filter(a=>a.id!==p.id).forEach(a=>{const m=(a.name||a.websiteUrl||"P").charAt(0).toUpperCase(),T=a.name||k(a.websiteUrl);u+=`
          <div class="pm-password-item" data-id="${a.id}">
            <div class="pm-password-favicon">${m}</div>
            <div class="pm-password-info">
              <div class="pm-password-name">${T}</div>
              <div class="pm-password-username">${a.username}</div>
            </div>
            <div class="pm-password-fill-icon" title="Doldur">
              ${E()}
            </div>
          </div>
        `})}else l.passwords.forEach(r=>{const w=(r.name||r.websiteUrl||"P").charAt(0).toUpperCase(),a=r.name||k(r.websiteUrl);u+=`
          <div class="pm-password-item" data-id="${r.id}">
            <div class="pm-password-favicon">${w}</div>
            <div class="pm-password-info">
              <div class="pm-password-name">${a}</div>
              <div class="pm-password-username">${r.username}</div>
            </div>
            <div class="pm-password-fill-icon" title="Doldur">
              ${E()}
            </div>
          </div>
        `});i.innerHTML=u,i.querySelectorAll(".pm-password-item").forEach(r=>{r.addEventListener("click",()=>{const w=r.getAttribute("data-id"),a=l.passwords.find(m=>m.id===w);a&&(s==="username"?(P(a.username),p=a):s==="password"&&b().length===0?(U(a.password),p=null):($(a.username,a.password),p=null),y())})})}}function y(){v&&(v.remove(),v=null),A=null}document.addEventListener("click",e=>{const s=e.target,t=s.closest('input[type="password"]')||s.closest('input[type="text"]')||s.closest('input[type="email"]');!s.closest(".pm-dropdown")&&!t&&y()});document.addEventListener("keydown",e=>{e.key==="Escape"&&y()});function L(e,s){try{const t=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value")?.set;return t?t.call(e,s):e.value=s,e.dispatchEvent(new Event("input",{bubbles:!0,cancelable:!0})),e.dispatchEvent(new Event("change",{bubbles:!0,cancelable:!0})),e.dispatchEvent(new KeyboardEvent("keydown",{bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keyup",{bubbles:!0})),!0}catch(t){return console.error("Input value set error:",t),!1}}function P(e){const s=b();if(s.length>0){const t=s[0];if(L(t,e))return g("Kullanıcı adı dolduruldu","success"),!0}return g("Kullanıcı adı alanı bulunamadı","error"),!1}function U(e){const s=f();return s.length>0&&L(s[0],e)?(g("Şifre dolduruldu","success"),!0):(g("Şifre alanı bulunamadı","error"),!1)}function $(e,s){const t=b(),n=f();let o=!1,d=!1;if(e){const c=n[0];let i=null;if(c){const u=c.closest("form");if(u){const h=u.querySelectorAll('input[type="text"], input[type="email"], input[autocomplete="username"]');for(const r of h)if(x(r)){i=r;break}}if(!i){const h=document.querySelectorAll("input"),r=Array.from(h),w=r.indexOf(c);for(let a=w-1;a>=0;a--){const m=r[a];if((m.type==="text"||m.type==="email")&&x(m)){i=m;break}}}}!i&&t.length>0&&(i=t[0]),i&&L(i,e)&&(o=!0)}n.length>0&&s&&L(n[0],s)&&(d=!0),o||d?g("Kimlik bilgileri dolduruldu","success"):g("Doldurulacak alan bulunamadı","error")}chrome.runtime.onMessage.addListener((e,s,t)=>((e.type==="AUTOFILL"||e.type==="AUTOFILL_PASSWORD")&&($(e.username,e.password),t({success:!0})),e.type==="AUTOFILL_USERNAME"&&(P(e.username),e.entry&&(p=e.entry),t({success:!0})),e.type==="AUTOFILL_PASSWORD_ONLY"&&(U(e.password),p=null,t({success:!0})),e.type==="GET_PAGE_INFO"&&t({url:window.location.href,hostname:C,title:document.title,hasLoginForm:_(),isMultiStepLogin:F()&&f().length===0,hasPasswordField:f().length>0,hasUsernameField:b().length>0}),!0));function B(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{setTimeout(S,300)}):setTimeout(S,300),new MutationObserver(()=>{S()}).observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{const s=f().length>0,t=F();(s||t)&&chrome.runtime.sendMessage({type:"LOGIN_FORM_DETECTED",hostname:C,isMultiStep:t&&!s}).catch(()=>{})},500)}B();

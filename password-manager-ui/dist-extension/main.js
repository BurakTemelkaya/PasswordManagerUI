import{u as P,a as E,b as T,r as o,j as e,L as M,f as D,l as L,d as A,A as $,c as B,e as Y,g as _,h as V,R as W,i as j,k as Z,m as H,S as q,N as Q,B as J,V as X,P as ee,n as ae}from"./chunks/Settings-DPz_qw66.js";import"./chunks/config-BY7x5TM5.js";const se=({onLogout:n,onAddPassword:r,onViewPassword:i,onEditPassword:a,onSettings:b})=>{const p=P(),{passwords:l,decryptedPasswords:g,loading:v,error:x,fetchPasswords:w,checkForUpdates:d}=E(),{lock:h}=T(),[f,I]=o.useState(""),[C,k]=o.useState(null),[t,c]=o.useState(1),u=12,z=o.useMemo(()=>{if(c(1),!f.trim())return l;const s=f.toLowerCase();return l.filter(m=>{const N=g.get(m.id);return N?N.name.toLowerCase().includes(s)||N.username.toLowerCase().includes(s)||N.websiteUrl.toLowerCase().includes(s):!1})},[l,f,g]),y=Math.ceil(z.length/u),U=z.slice((t-1)*u,t*u),K=s=>{c(s),window.scrollTo({top:0,behavior:"smooth"})},G=async()=>{window.confirm("Çıkış yapmak istediğinize emin misiniz?")&&(await L(),n?n():p("/login"))},O=async s=>{if(window.confirm("Bu parolayı silmek istediğinize emin misiniz?"))try{k(null),await A({id:s}),await w(!0)}catch(m){m instanceof $?k(m.getUserMessage()):k("Silme işlemi başarısız"),console.error(m)}};return v&&l.length===0?e.jsx("div",{className:"loading",children:"Yükleniyor..."}):e.jsxs("div",{className:"container",children:[e.jsxs("header",{className:"header",children:[e.jsx("h1",{children:"Parolalarım"}),e.jsxs("div",{className:"header-actions",children:[e.jsx(M,{to:"/download",className:"btn btn-info",style:{marginRight:"8px",textDecoration:"none"},title:"Tarayıcı eklentisini indir",children:"🔌 Eklenti"}),e.jsx("button",{onClick:()=>d(!0),className:"btn btn-secondary",style:{marginRight:"8px"},title:"Şimdi Senkronize Et",children:"🔄"}),e.jsx("button",{onClick:()=>{b?b():p("/settings")},className:"btn btn-secondary",style:{marginRight:"8px"},title:"Ayarlar",children:"⚙️"}),e.jsx("span",{className:"user-name",children:"👤 Kullanıcı"}),e.jsx("button",{onClick:h,className:"btn btn-warning",style:{marginRight:"8px"},title:"Kasayı Kilitle",children:"🔒 Kilitle"}),e.jsx("button",{onClick:G,className:"btn btn-logout",children:"Çıkış Yap"})]})]}),e.jsxs("main",{className:"main",children:[e.jsx("div",{className:"actions",children:e.jsx("button",{onClick:()=>{r?r():p("/passwords/add")},className:"btn btn-primary",children:"+ Yeni Parola"})}),e.jsx("div",{className:"search-box",style:{marginBottom:"16px"},children:e.jsx("input",{type:"text",placeholder:"Parola ara... (ad, kullanıcı adı, website)",value:f,onChange:s=>I(s.target.value),style:{width:"100%",padding:"12px 16px",borderRadius:"8px",border:"1px solid var(--border-color)",background:"var(--bg-input)",color:"var(--text-primary)",fontSize:"14px"}})}),(x||C)&&e.jsx("div",{className:"alert alert-error",children:x||C}),z.length===0?e.jsx("div",{className:"empty-state",children:f?e.jsxs("p",{children:['"',f,'" için sonuç bulunamadı']}):e.jsxs(e.Fragment,{children:[e.jsx("p",{children:"Henüz parola eklememişsiniz"}),e.jsx("button",{onClick:()=>{r?r():p("/passwords/add")},className:"btn btn-primary",children:"İlk parolayı ekleyin"})]})}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"password-grid",children:U.map(s=>{const m=g.get(s.id);return e.jsxs("div",{className:"password-card",children:[e.jsx("h3",{children:m?.name||"Parola"}),e.jsx("p",{className:"website",children:m?.websiteUrl||"-"}),e.jsxs("p",{className:"username",children:["Kullanıcı: ",m?.username||"-"]}),e.jsxs("p",{className:"password-date",children:["Oluşturulma: ",D(s.createdDate)]}),e.jsxs("div",{className:"actions",children:[e.jsx("button",{onClick:()=>{i?i(s.id):p(`/passwords/${s.id}`)},className:"btn btn-small btn-info",children:"Görüntüle"}),e.jsx("button",{onClick:()=>{a?a(s.id):p(`/passwords/${s.id}/edit`)},className:"btn btn-small btn-warning",children:"Düzenle"}),e.jsx("button",{onClick:()=>O(s.id),className:"btn btn-small btn-danger",children:"Sil"})]})]},s.id)})}),y>1&&e.jsxs("div",{className:"pagination",style:{display:"flex",justifyContent:"center",alignItems:"center",gap:"8px",marginTop:"24px"},children:[e.jsx("button",{onClick:()=>K(t-1),disabled:t===1,className:"btn btn-secondary",style:{opacity:t===1?.5:1,marginTop:0},children:"« Önceki"}),Array.from({length:y},(s,m)=>m+1).filter(s=>s===1||s===y||s>=t-2&&s<=t+2).map((s,m,N)=>{const F=m>0&&s-N[m-1]>1;return e.jsxs("div",{style:{display:"flex",alignItems:"center"},children:[F&&e.jsx("span",{style:{margin:"0 8px",color:"var(--text-muted)"},children:"..."}),e.jsx("button",{onClick:()=>K(s),className:`btn ${t===s?"btn-primary":"btn-secondary"}`,style:{minWidth:"32px",marginTop:0},children:s})]},s)}),e.jsx("button",{onClick:()=>K(t+1),disabled:t===y,className:"btn btn-secondary",style:{opacity:t===y?.5:1,marginTop:0},children:"Sonraki »"})]})]}),e.jsxs("div",{style:{textAlign:"center",marginTop:"16px",color:"var(--text-muted)",fontSize:"13px"},children:["Toplam: ",l.length," parola ",f&&`(${z.length} sonuç)`,y>1&&` • Sayfa ${t} / ${y}`]})]})]})},ne=()=>e.jsx(B,{}),re=()=>{const{id:n}=Y(),r=P(),{passwords:i,fetchPasswords:a}=E(),[b,p]=o.useState(null),[l,g]=o.useState(null),[v,x]=o.useState(!0),[w,d]=o.useState(null),[h,f]=o.useState(!1);o.useEffect(()=>{n&&I()},[n,i]);const I=async()=>{try{x(!0),d(null);const t=sessionStorage.getItem("encryptionKey");if(!t){d("Kasa kilitli. Lütfen yeniden giriş yapın."),x(!1);return}let c=i.find(u=>u.id===n);if(!c)try{c=await _(n)}catch(u){console.error(u),d("Parola bulunamadı."),x(!1);return}if(!c){d("Parola bulunamadı"),x(!1);return}if(p(c),!c.iv){console.warn("⚠️ IV BULUNAMADI"),d("Bu parola eski formatta."),x(!1);return}try{const u=await V({encryptedName:c.encryptedName,encryptedUserName:c.encryptedUserName,encryptedPassword:c.encryptedPassword,encryptedDescription:c.encryptedDescription,encryptedWebSiteUrl:c.encryptedWebSiteUrl},t,c.iv);g(u)}catch(u){console.error("❌ Decrypt hatası:",u),d(`Şifre çözme başarısız: ${u.message}`)}}catch(t){console.error("❌ Hata:",t),d(`İşlem başarısız: ${t.message||t}`)}finally{x(!1)}},C=async()=>{if(window.confirm("Bu parolayı silmek istediğinize emin misiniz?"))try{x(!0),await A({id:n}),await a(!0),r("/")}catch(t){console.error(t),d("Silme işlemi başarısız."),x(!1)}},k=t=>{navigator.clipboard.writeText(t),alert("Kopyalandı!")};return v?e.jsx("div",{className:"loading",children:"Yükleniyor..."}):w||!b?e.jsxs("div",{className:"container",children:[e.jsx("div",{className:"alert alert-error",children:w||"Parola bulunamadı"}),e.jsx("button",{onClick:()=>r("/"),className:"btn btn-primary",children:"Geri Dön"})]}):e.jsxs("div",{className:"container",children:[e.jsxs("header",{className:"header",children:[e.jsx("button",{onClick:()=>r("/"),className:"btn btn-back",children:"← Geri"}),e.jsx("h1",{children:l?.name||"Parola"})]}),e.jsxs("main",{className:"main",children:[e.jsxs("div",{className:"password-details",children:[e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Website"}),e.jsx("p",{children:l?.websiteUrl||"-"})]}),e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Kullanıcı Adı"}),e.jsxs("div",{className:"detail-with-action",children:[e.jsx("p",{children:l?.username||"-"}),e.jsx("button",{onClick:()=>k(l?.username||""),className:"btn btn-small",children:"Kopyala"})]})]}),e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Parola"}),e.jsxs("div",{className:"detail-with-action",children:[e.jsx("p",{children:h?l?.password:"••••••••"}),e.jsx("button",{onClick:()=>f(!h),className:"btn btn-small",children:h?"Gizle":"Göster"}),e.jsx("button",{onClick:()=>k(l?.password||""),className:"btn btn-small",children:"Kopyala"})]})]}),l?.description&&e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Açıklama"}),e.jsx("p",{children:l.description})]}),e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Oluşturulma Tarihi"}),e.jsx("p",{children:D(b.createdDate)})]}),b.updatedDate&&e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Son Güncellenme Tarihi"}),e.jsx("p",{children:D(b.updatedDate)})]})]}),e.jsxs("div",{className:"actions",children:[e.jsx("button",{onClick:C,className:"btn",style:{backgroundColor:"#ef4444",color:"white",marginRight:"auto"},children:"Sil"}),e.jsx("button",{onClick:()=>r(`/passwords/${n}/edit`),className:"btn btn-warning",children:"Düzenle"}),e.jsx("button",{onClick:()=>r("/"),className:"btn btn-secondary",children:"Kapat"})]})]})]})},te=()=>{const n=P();return e.jsx("div",{className:"container",children:e.jsxs("div",{className:"not-found",children:[e.jsx("h1",{children:"404"}),e.jsx("p",{children:"Sayfa bulunamadı"}),e.jsx("button",{onClick:()=>n("/"),className:"btn btn-primary",children:"Ana Sayfaya Dön"})]})})},ie=()=>{const n=P(),r=()=>{const i=document.createElement("a");i.href="/password-manager-extension.zip",i.download="password-manager-extension.zip",document.body.appendChild(i),i.click(),document.body.removeChild(i)};return e.jsxs("div",{className:"download-page",children:[e.jsxs("div",{className:"download-container",children:[e.jsxs("header",{className:"download-header",style:{position:"relative"},children:[e.jsx("button",{onClick:()=>n("/"),className:"btn-back-absolute",style:{position:"absolute",left:0,top:0,background:"rgba(255,255,255,0.1)",border:"none",color:"white",padding:"8px 16px",borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"},children:"← Geri"}),e.jsx("div",{className:"download-logo",children:"🔐"}),e.jsx("h1",{children:"Parola Yöneticisi"}),e.jsx("p",{className:"download-subtitle",children:"Zero-Knowledge güvenlikli tarayıcı eklentisi"})]}),e.jsxs("section",{className:"download-features",children:[e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"🔒"}),e.jsx("h3",{children:"Zero-Knowledge"}),e.jsx("p",{children:"Parolalarınız cihazınızda şifrelenir, sunucuda asla açık metin olarak tutulmaz."})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"⚡"}),e.jsx("h3",{children:"Otomatik Doldurma"}),e.jsx("p",{children:"Web sitelerine tek tıkla giriş yapın, form alanlarını otomatik doldurun."})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"🔄"}),e.jsx("h3",{children:"Import/Export"}),e.jsx("p",{children:"Chrome, Firefox, Bitwarden, LastPass'tan parolalarınızı kolayca aktarın."})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"🛡️"}),e.jsx("h3",{children:"Güçlü Şifreleme"}),e.jsx("p",{children:"AES-256-GCM şifreleme ve PBKDF2 (600.000 iterasyon) ile korunun."})]})]}),e.jsxs("section",{className:"download-section",children:[e.jsx("h2",{children:"Tarayıcı Eklentisini İndirin"}),e.jsx("div",{className:"download-options",children:e.jsxs("div",{className:"download-card",children:[e.jsxs("div",{className:"browser-icons",children:[e.jsx("span",{className:"browser-icon",title:"Chrome",children:"🌐"}),e.jsx("span",{className:"browser-icon",title:"Edge",children:"💠"}),e.jsx("span",{className:"browser-icon",title:"Brave",children:"🦁"})]}),e.jsx("h3",{children:"Chrome / Edge / Brave"}),e.jsx("p",{children:"Chromium tabanlı tarayıcılar için"}),e.jsx("button",{onClick:r,className:"download-btn",children:"📦 Eklentiyi İndir (.zip)"})]})}),e.jsxs("div",{className:"install-guide",children:[e.jsx("h3",{children:"📋 Kurulum Adımları"}),e.jsxs("ol",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"İndirin:"})," Yukarıdaki butona tıklayarak ZIP dosyasını indirin."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Çıkartın:"})," ZIP dosyasını bir klasöre çıkartın."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Eklentiler sayfasını açın:"}),e.jsx("code",{children:"chrome://extensions"})," adresine gidin."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Geliştirici modu:"}),' Sağ üst köşedeki "Geliştirici modu"nu açın.']}),e.jsxs("li",{children:[e.jsx("strong",{children:"Yükleyin:"}),' "Paketlenmemiş öğe yükle" butonuna tıklayın ve çıkarttığınız klasörü seçin.']}),e.jsxs("li",{children:[e.jsx("strong",{children:"Hazır!"})," Eklenti simgesi tarayıcı araç çubuğunda görünecektir."]})]})]})]}),e.jsxs("section",{className:"download-actions",children:[e.jsx("p",{children:"Zaten hesabınız var mı?"}),e.jsx("button",{onClick:()=>n("/login"),className:"btn-secondary",children:"Giriş Yap"}),e.jsx("button",{onClick:()=>n("/register"),className:"btn-primary",children:"Kayıt Ol"})]}),e.jsx("footer",{className:"download-footer",children:e.jsxs("p",{children:["🔐 Açık kaynak parola yöneticisi |",e.jsx("a",{href:"https://github.com/BurakTemelkaya/PasswordManagerUI",target:"_blank",rel:"noopener noreferrer",children:"GitHub"})]})})]}),e.jsx("style",{children:`
        .download-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 40px 20px;
        }

        .download-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .download-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .download-logo {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .download-header h1 {
          font-size: 36px;
          color: #fff;
          margin-bottom: 8px;
        }

        .download-subtitle {
          font-size: 18px;
          color: #94a3b8;
        }

        .download-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          transition: transform 0.2s, border-color 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .feature-icon {
          font-size: 40px;
          display: block;
          margin-bottom: 12px;
        }

        .feature-card h3 {
          color: #fff;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .feature-card p {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.5;
        }

        .download-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .download-section h2 {
          color: #fff;
          text-align: center;
          margin-bottom: 24px;
          font-size: 24px;
        }

        .download-options {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 32px;
        }

        .download-card {
          background: rgba(59, 130, 246, 0.1);
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          min-width: 280px;
        }

        .browser-icons {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .browser-icon {
          font-size: 32px;
        }

        .download-card h3 {
          color: #fff;
          font-size: 18px;
          margin-bottom: 8px;
        }

        .download-card p {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .download-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .download-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        .install-guide {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 24px;
        }

        .install-guide h3 {
          color: #fff;
          margin-bottom: 16px;
          font-size: 18px;
        }

        .install-guide ol {
          color: #cbd5e1;
          padding-left: 24px;
          margin: 0;
        }

        .install-guide li {
          margin-bottom: 12px;
          line-height: 1.6;
        }

        .install-guide strong {
          color: #fff;
        }

        .install-guide code {
          background: rgba(59, 130, 246, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
          font-family: monospace;
          color: #60a5fa;
        }

        .download-actions {
          text-align: center;
          margin-bottom: 32px;
        }

        .download-actions p {
          color: #94a3b8;
          margin-bottom: 16px;
        }

        .download-actions button {
          margin: 0 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-primary {
          background: #3b82f6;
          border: none;
          color: #fff;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .download-footer {
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .download-footer a {
          color: #60a5fa;
          text-decoration: none;
          margin-left: 8px;
        }

        .download-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .download-header h1 {
            font-size: 28px;
          }

          .download-features {
            grid-template-columns: 1fr 1fr;
          }

          .download-card {
            min-width: auto;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .download-features {
            grid-template-columns: 1fr;
          }
        }
      `})]})},oe=()=>{const{unlock:n}=T(),[r,i]=o.useState(""),[a,b]=o.useState(!1),[p,l]=o.useState(null),[g,v]=o.useState(null);o.useEffect(()=>{const h=localStorage.getItem("userName");h&&v(h)},[]);const x=async h=>{if(h.preventDefault(),!r)return;b(!0),l(null),await n(r)||l("Master Parola yanlış veya doğrulanamadı."),b(!1)},w=async()=>{await L(),window.location.href="/login"},d=typeof chrome<"u"&&!!chrome.runtime&&!!chrome.runtime.id&&window.location.protocol==="chrome-extension:";return e.jsx("div",{className:`auth-container ${d?"":"web-mode"}`,children:e.jsxs("div",{className:"auth-content-wrapper",children:[!d&&e.jsxs("div",{className:"auth-header-external",children:[e.jsx("div",{className:"auth-header-logo",children:"🔒"}),e.jsx("h1",{className:"auth-header-title",children:"Kasa Kilitli"}),g&&e.jsx("div",{className:"auth-header-subtitle",children:e.jsx("b",{children:g})})]}),e.jsxs("div",{className:"auth-box",children:[d&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:"24px"},children:[e.jsx("div",{style:{width:"56px",height:"56px",borderRadius:"50%",background:"var(--primary)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",marginBottom:"12px"},children:"🔒"}),g?e.jsxs(e.Fragment,{children:[e.jsx("h3",{style:{margin:0,fontSize:"16px"},children:g}),e.jsx("p",{style:{color:"var(--text-secondary)",fontSize:"12px",margin:"4px 0 0 0"},children:"Kasa Kilitli"})]}):e.jsx("h3",{style:{margin:0},children:"Kasa Kilitli"})]}),!g&&e.jsx("div",{style:{textAlign:"center",marginBottom:"20px"},children:e.jsx("p",{style:{color:"var(--text-secondary)"},children:"Devam etmek için Master Parolanızı girin."})}),p&&e.jsx("div",{className:"alert alert-error",children:p}),e.jsxs("form",{onSubmit:x,children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"masterPassword",children:"Master Parola"}),e.jsx("input",{id:"masterPassword",type:"password",value:r,onChange:h=>i(h.target.value),placeholder:"Giriş yapmak için parolanızı girin",required:!0,autoFocus:!0})]}),e.jsx("button",{type:"submit",className:"btn btn-primary btn-block",disabled:a,children:a?"Doğrulanıyor...":"Kilidi Aç"})]}),e.jsx("div",{className:"auth-footer",children:e.jsx("button",{onClick:w,className:"btn-link",style:{color:"var(--text-secondary)"},children:"Farklı bir hesapla giriş yap"})})]})]})})},S=({children:n})=>{const r=localStorage.getItem("authToken"),{isLocked:i}=T();return r?i?e.jsx(oe,{}):e.jsx(e.Fragment,{children:n}):e.jsx(Q,{to:"/login",replace:!0})},le=()=>e.jsxs(W,{children:[e.jsx(j,{path:"/login",element:e.jsx(Z,{})}),e.jsx(j,{path:"/register",element:e.jsx(H,{})}),e.jsx(j,{path:"/download",element:e.jsx(ie,{})}),e.jsx(j,{path:"/",element:e.jsx(S,{children:e.jsx(se,{})})}),e.jsx(j,{path:"/passwords/add",element:e.jsx(S,{children:e.jsx(B,{})})}),e.jsx(j,{path:"/passwords/:id",element:e.jsx(S,{children:e.jsx(re,{})})}),e.jsx(j,{path:"/passwords/:id/edit",element:e.jsx(S,{children:e.jsx(ne,{})})}),e.jsx(j,{path:"/settings",element:e.jsx(S,{children:e.jsx(q,{})})}),e.jsx(j,{path:"*",element:e.jsx(te,{})})]}),R=()=>{const n=localStorage.getItem("encryptionKey"),r=localStorage.getItem("authToken"),i=localStorage.getItem("userName");return{encryptionKey:{exists:!!n,length:n?.length,preview:n?.substring(0,32)+"..."},authToken:{exists:!!r,preview:r?.substring(0,32)+"..."},userName:{exists:!!i,value:i},allKeys:Object.keys(localStorage)}};typeof window<"u"&&(window.__debugCrypto=R);typeof window<"u"&&(window.__debugCrypto=R,console.log("💡 Debug mode: console'da __debugCrypto() çağırarak state kontrol edebilirsin"));function de(){const[n,r]=o.useState(!1);return o.useEffect(()=>{(async()=>{if(typeof chrome<"u"&&chrome.storage?.local&&!localStorage.getItem("authToken"))try{const a=await chrome.storage.local.get(["authToken","userName","userId","encryptionKeyCheck","kdfSalt","kdfIterations","vaultTimeout","vaultAction","lockOnBrowserClose","lockOnSystemLock"]);a.authToken&&(localStorage.setItem("authToken",a.authToken),a.userName&&localStorage.setItem("userName",a.userName),a.userId&&localStorage.setItem("userId",a.userId),a.encryptionKeyCheck&&localStorage.setItem("encryptionKeyCheck",a.encryptionKeyCheck),a.kdfSalt&&localStorage.setItem("kdfSalt",a.kdfSalt),a.kdfIterations&&localStorage.setItem("kdfIterations",String(a.kdfIterations)),a.vaultTimeout&&localStorage.setItem("vaultTimeout",String(a.vaultTimeout)),a.vaultAction&&localStorage.setItem("vaultAction",a.vaultAction),a.lockOnBrowserClose&&localStorage.setItem("lockOnBrowserClose",String(a.lockOnBrowserClose)),a.lockOnSystemLock&&localStorage.setItem("lockOnSystemLock",String(a.lockOnSystemLock)),console.log("✅ Auth token restored from chrome.storage.local"))}catch(a){console.warn("Storage sync error:",a)}r(!0)})()},[]),n?e.jsx("div",{className:"app",children:e.jsx(J,{children:e.jsx(X,{children:e.jsx(ee,{children:e.jsx(le,{})})})})}):null}ae.createRoot(document.getElementById("root")).render(e.jsx(o.StrictMode,{children:e.jsx(de,{})}));

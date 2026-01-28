import{u as S,a as T,b as I,r as o,j as e,L as Y,f as E,l as A,d as L,A as $,c as B,e as W,g as _,h as O,R as V,i as b,k as Z,m as H,S as q,N as Q,B as J,V as X,P as ee,n as ae}from"./chunks/Settings-CPmhJqqg.js";import"./chunks/config-D9A41Bfy.js";const se=({onLogout:s,onAddPassword:r,onViewPassword:t,onEditPassword:j,onSettings:u})=>{const p=S(),{passwords:i,decryptedPasswords:h,loading:v,error:x,fetchPasswords:y,checkForUpdates:l}=T(),{lock:w}=I(),[g,D]=o.useState(""),[C,k]=o.useState(null),[n,d]=o.useState(1),m=12,P=o.useMemo(()=>{if(d(1),!g.trim())return i;const a=g.toLowerCase();return i.filter(c=>{const N=h.get(c.id);return N?N.name.toLowerCase().includes(a)||N.username.toLowerCase().includes(a)||N.websiteUrl.toLowerCase().includes(a):!1})},[i,g,h]),f=Math.ceil(P.length/m),U=P.slice((n-1)*m,n*m),K=a=>{d(a),window.scrollTo({top:0,behavior:"smooth"})},G=async()=>{window.confirm("Çıkış yapmak istediğinize emin misiniz?")&&(await A(),s?s():p("/login"))},F=async a=>{if(window.confirm("Bu parolayı silmek istediğinize emin misiniz?"))try{k(null),await L({id:a}),await y(!0)}catch(c){c instanceof $?k(c.getUserMessage()):k("Silme işlemi başarısız"),console.error(c)}};return v&&i.length===0?e.jsx("div",{className:"loading",children:"Yükleniyor..."}):e.jsxs("div",{className:"container",children:[e.jsxs("header",{className:"header",children:[e.jsx("h1",{children:"Parolalarım"}),e.jsxs("div",{className:"header-actions",children:[e.jsx(Y,{to:"/download",className:"btn btn-info",style:{marginRight:"8px",textDecoration:"none"},title:"Tarayıcı eklentisini indir",children:"🔌 Eklenti"}),e.jsx("button",{onClick:()=>l(!0),className:"btn btn-secondary",style:{marginRight:"8px"},title:"Şimdi Senkronize Et",children:"🔄"}),e.jsx("button",{onClick:()=>{u?u():p("/settings")},className:"btn btn-secondary",style:{marginRight:"8px"},title:"Ayarlar",children:"⚙️"}),e.jsx("span",{className:"user-name",children:"👤 Kullanıcı"}),e.jsx("button",{onClick:w,className:"btn btn-warning",style:{marginRight:"8px"},title:"Kasayı Kilitle",children:"🔒 Kilitle"}),e.jsx("button",{onClick:G,className:"btn btn-logout",children:"Çıkış Yap"})]})]}),e.jsxs("main",{className:"main",children:[e.jsx("div",{className:"actions",children:e.jsx("button",{onClick:()=>{r?r():p("/passwords/add")},className:"btn btn-primary",children:"+ Yeni Parola"})}),e.jsx("div",{className:"search-box",style:{marginBottom:"16px"},children:e.jsx("input",{type:"text",placeholder:"Parola ara... (ad, kullanıcı adı, website)",value:g,onChange:a=>D(a.target.value),style:{width:"100%",padding:"12px 16px",borderRadius:"8px",border:"1px solid var(--border-color)",background:"var(--bg-input)",color:"var(--text-primary)",fontSize:"14px"}})}),(x||C)&&e.jsx("div",{className:"alert alert-error",children:x||C}),P.length===0?e.jsx("div",{className:"empty-state",children:g?e.jsxs("p",{children:['"',g,'" için sonuç bulunamadı']}):e.jsxs(e.Fragment,{children:[e.jsx("p",{children:"Henüz parola eklememişsiniz"}),e.jsx("button",{onClick:()=>{r?r():p("/passwords/add")},className:"btn btn-primary",children:"İlk parolayı ekleyin"})]})}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"password-grid",children:U.map(a=>{const c=h.get(a.id);return e.jsxs("div",{className:"password-card",children:[e.jsx("h3",{children:c?.name||"Parola"}),e.jsx("p",{className:"website",children:c?.websiteUrl||"-"}),e.jsxs("p",{className:"username",children:["Kullanıcı: ",c?.username||"-"]}),e.jsxs("p",{className:"password-date",children:["Oluşturulma: ",E(a.createdDate)]}),e.jsxs("div",{className:"actions",children:[e.jsx("button",{onClick:()=>{t?t(a.id):p(`/passwords/${a.id}`)},className:"btn btn-small btn-info",children:"Görüntüle"}),e.jsx("button",{onClick:()=>{j?j(a.id):p(`/passwords/${a.id}/edit`)},className:"btn btn-small btn-warning",children:"Düzenle"}),e.jsx("button",{onClick:()=>F(a.id),className:"btn btn-small btn-danger",children:"Sil"})]})]},a.id)})}),f>1&&e.jsxs("div",{className:"pagination",style:{display:"flex",justifyContent:"center",alignItems:"center",gap:"8px",marginTop:"24px"},children:[e.jsx("button",{onClick:()=>K(n-1),disabled:n===1,className:"btn btn-secondary",style:{opacity:n===1?.5:1,marginTop:0},children:"« Önceki"}),Array.from({length:f},(a,c)=>c+1).filter(a=>a===1||a===f||a>=n-2&&a<=n+2).map((a,c,N)=>{const M=c>0&&a-N[c-1]>1;return e.jsxs("div",{style:{display:"flex",alignItems:"center"},children:[M&&e.jsx("span",{style:{margin:"0 8px",color:"var(--text-muted)"},children:"..."}),e.jsx("button",{onClick:()=>K(a),className:`btn ${n===a?"btn-primary":"btn-secondary"}`,style:{minWidth:"32px",marginTop:0},children:a})]},a)}),e.jsx("button",{onClick:()=>K(n+1),disabled:n===f,className:"btn btn-secondary",style:{opacity:n===f?.5:1,marginTop:0},children:"Sonraki »"})]})]}),e.jsxs("div",{style:{textAlign:"center",marginTop:"16px",color:"var(--text-muted)",fontSize:"13px"},children:["Toplam: ",i.length," parola ",g&&`(${P.length} sonuç)`,f>1&&` • Sayfa ${n} / ${f}`]})]})]})},ne=()=>e.jsx(B,{}),re=()=>{const{id:s}=W(),r=S(),{passwords:t,fetchPasswords:j}=T(),[u,p]=o.useState(null),[i,h]=o.useState(null),[v,x]=o.useState(!0),[y,l]=o.useState(null),[w,g]=o.useState(!1);o.useEffect(()=>{s&&D()},[s,t]);const D=async()=>{try{x(!0),l(null);const n=sessionStorage.getItem("encryptionKey");if(!n){l("Kasa kilitli. Lütfen yeniden giriş yapın."),x(!1);return}let d=t.find(m=>m.id===s);if(!d)try{d=await _(s)}catch(m){console.error(m),l("Parola bulunamadı."),x(!1);return}if(!d){l("Parola bulunamadı"),x(!1);return}if(p(d),!d.iv){console.warn("⚠️ IV BULUNAMADI"),l("Bu parola eski formatta."),x(!1);return}try{const m=await O({encryptedName:d.encryptedName,encryptedUserName:d.encryptedUserName,encryptedPassword:d.encryptedPassword,encryptedDescription:d.encryptedDescription,encryptedWebSiteUrl:d.encryptedWebSiteUrl},n,d.iv);h(m)}catch(m){console.error("❌ Decrypt hatası:",m),l(`Şifre çözme başarısız: ${m.message}`)}}catch(n){console.error("❌ Hata:",n),l(`İşlem başarısız: ${n.message||n}`)}finally{x(!1)}},C=async()=>{if(window.confirm("Bu parolayı silmek istediğinize emin misiniz?"))try{x(!0),await L({id:s}),await j(!0),r("/")}catch(n){console.error(n),l("Silme işlemi başarısız."),x(!1)}},k=n=>{navigator.clipboard.writeText(n),alert("Kopyalandı!")};return v?e.jsx("div",{className:"loading",children:"Yükleniyor..."}):y||!u?e.jsxs("div",{className:"container",children:[e.jsx("div",{className:"alert alert-error",children:y||"Parola bulunamadı"}),e.jsx("button",{onClick:()=>r("/"),className:"btn btn-primary",children:"Geri Dön"})]}):e.jsxs("div",{className:"container",children:[e.jsxs("header",{className:"header",children:[e.jsx("button",{onClick:()=>r("/"),className:"btn btn-back",children:"← Geri"}),e.jsx("h1",{children:i?.name||"Parola"})]}),e.jsxs("main",{className:"main",children:[e.jsxs("div",{className:"password-details",children:[e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Website"}),e.jsx("p",{children:i?.websiteUrl||"-"})]}),e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Kullanıcı Adı"}),e.jsxs("div",{className:"detail-with-action",children:[e.jsx("p",{children:i?.username||"-"}),e.jsx("button",{onClick:()=>k(i?.username||""),className:"btn btn-small",children:"Kopyala"})]})]}),e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Parola"}),e.jsxs("div",{className:"detail-with-action",children:[e.jsx("p",{children:w?i?.password:"••••••••"}),e.jsx("button",{onClick:()=>g(!w),className:"btn btn-small",children:w?"Gizle":"Göster"}),e.jsx("button",{onClick:()=>k(i?.password||""),className:"btn btn-small",children:"Kopyala"})]})]}),i?.description&&e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Açıklama"}),e.jsx("p",{children:i.description})]}),e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Oluşturulma Tarihi"}),e.jsx("p",{children:E(u.createdDate)})]}),u.updatedDate&&e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Son Güncellenme Tarihi"}),e.jsx("p",{children:E(u.updatedDate)})]})]}),e.jsxs("div",{className:"actions",children:[e.jsx("button",{onClick:C,className:"btn",style:{backgroundColor:"#ef4444",color:"white",marginRight:"auto"},children:"Sil"}),e.jsx("button",{onClick:()=>r(`/passwords/${s}/edit`),className:"btn btn-warning",children:"Düzenle"}),e.jsx("button",{onClick:()=>r("/"),className:"btn btn-secondary",children:"Kapat"})]})]})]})},te=()=>{const s=S();return e.jsx("div",{className:"container",children:e.jsxs("div",{className:"not-found",children:[e.jsx("h1",{children:"404"}),e.jsx("p",{children:"Sayfa bulunamadı"}),e.jsx("button",{onClick:()=>s("/"),className:"btn btn-primary",children:"Ana Sayfaya Dön"})]})})},ie=()=>{const s=S(),r=()=>{const t=document.createElement("a");t.href="/password-manager-extension.zip",t.download="password-manager-extension.zip",document.body.appendChild(t),t.click(),document.body.removeChild(t)};return e.jsxs("div",{className:"download-page",children:[e.jsxs("div",{className:"download-container",children:[e.jsxs("header",{className:"download-header",style:{position:"relative"},children:[e.jsx("button",{onClick:()=>s("/"),className:"btn-back-absolute",style:{position:"absolute",left:0,top:0,background:"rgba(255,255,255,0.1)",border:"none",color:"white",padding:"8px 16px",borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"},children:"← Geri"}),e.jsx("div",{className:"download-logo",children:"🔐"}),e.jsx("h1",{children:"Parola Yöneticisi"}),e.jsx("p",{className:"download-subtitle",children:"Zero-Knowledge güvenlikli tarayıcı eklentisi"})]}),e.jsxs("section",{className:"download-features",children:[e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"🔒"}),e.jsx("h3",{children:"Zero-Knowledge"}),e.jsx("p",{children:"Parolalarınız cihazınızda şifrelenir, sunucuda asla açık metin olarak tutulmaz."})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"⚡"}),e.jsx("h3",{children:"Otomatik Doldurma"}),e.jsx("p",{children:"Web sitelerine tek tıkla giriş yapın, form alanlarını otomatik doldurun."})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"🔄"}),e.jsx("h3",{children:"Import/Export"}),e.jsx("p",{children:"Chrome, Firefox, Bitwarden, LastPass'tan parolalarınızı kolayca aktarın."})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"🛡️"}),e.jsx("h3",{children:"Güçlü Şifreleme"}),e.jsx("p",{children:"AES-256-GCM şifreleme ve PBKDF2 (600.000 iterasyon) ile korunun."})]})]}),e.jsxs("section",{className:"download-section",children:[e.jsx("h2",{children:"Tarayıcı Eklentisini İndirin"}),e.jsx("div",{className:"download-options",children:e.jsxs("div",{className:"download-card",children:[e.jsxs("div",{className:"browser-icons",children:[e.jsx("span",{className:"browser-icon",title:"Chrome",children:"🌐"}),e.jsx("span",{className:"browser-icon",title:"Edge",children:"💠"}),e.jsx("span",{className:"browser-icon",title:"Brave",children:"🦁"})]}),e.jsx("h3",{children:"Chrome / Edge / Brave"}),e.jsx("p",{children:"Chromium tabanlı tarayıcılar için"}),e.jsx("button",{onClick:r,className:"download-btn",children:"📦 Eklentiyi İndir (.zip)"})]})}),e.jsxs("div",{className:"install-guide",children:[e.jsx("h3",{children:"📋 Kurulum Adımları"}),e.jsxs("ol",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"İndirin:"})," Yukarıdaki butona tıklayarak ZIP dosyasını indirin."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Çıkartın:"})," ZIP dosyasını bir klasöre çıkartın."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Eklentiler sayfasını açın:"}),e.jsx("code",{children:"chrome://extensions"})," adresine gidin."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Geliştirici modu:"}),' Sağ üst köşedeki "Geliştirici modu"nu açın.']}),e.jsxs("li",{children:[e.jsx("strong",{children:"Yükleyin:"}),' "Paketlenmemiş öğe yükle" butonuna tıklayın ve çıkarttığınız klasörü seçin.']}),e.jsxs("li",{children:[e.jsx("strong",{children:"Hazır!"})," Eklenti simgesi tarayıcı araç çubuğunda görünecektir."]})]})]})]}),e.jsxs("section",{className:"download-actions",children:[e.jsx("p",{children:"Zaten hesabınız var mı?"}),e.jsx("button",{onClick:()=>s("/login"),className:"btn-secondary",children:"Giriş Yap"}),e.jsx("button",{onClick:()=>s("/register"),className:"btn-primary",children:"Kayıt Ol"})]}),e.jsx("footer",{className:"download-footer",children:e.jsxs("p",{children:["🔐 Açık kaynak parola yöneticisi |",e.jsx("a",{href:"https://github.com/BurakTemelkaya/PasswordManagerUI",target:"_blank",rel:"noopener noreferrer",children:"GitHub"})]})})]}),e.jsx("style",{children:`
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
      `})]})},le=()=>{const{unlock:s}=I(),[r,t]=o.useState(""),[j,u]=o.useState(!1),[p,i]=o.useState(null),[h,v]=o.useState(null);o.useEffect(()=>{const l=localStorage.getItem("userName");l&&v(l)},[]);const x=async l=>{if(l.preventDefault(),!r)return;u(!0),i(null),await s(r)||i("Master Parola yanlış veya doğrulanamadı."),u(!1)},y=async()=>{await A(),window.location.href="/login"};return e.jsx("div",{className:"auth-container",style:{background:"rgba(0,0,0,0.85)"},children:e.jsxs("div",{className:"auth-box",style:{maxWidth:"400px"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:"32px"},children:[e.jsx("div",{style:{width:"64px",height:"64px",borderRadius:"50%",background:"#3b82f6",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",fontWeight:600,marginBottom:"16px",boxShadow:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"},children:h?h.substring(0,2).toUpperCase():"🔒"}),h?e.jsxs(e.Fragment,{children:[e.jsx("h3",{style:{margin:0,fontSize:"18px",fontWeight:600},children:h}),e.jsx("p",{style:{color:"#6b7280",fontSize:"14px",margin:"4px 0 0 0"},children:"Kasa Kilitli"})]}):e.jsx("h3",{style:{margin:0},children:"Kasa Kilitli"})]}),!h&&e.jsx("div",{style:{textAlign:"center",marginBottom:"20px"},children:e.jsx("p",{style:{color:"var(--text-muted)"},children:"Devam etmek için Master Parolanızı girin."})}),p&&e.jsx("div",{className:"alert alert-error",children:p}),e.jsxs("form",{onSubmit:x,children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"masterPassword",children:"Master Parola"}),e.jsx("input",{id:"masterPassword",type:"password",value:r,onChange:l=>t(l.target.value),placeholder:"Master parolanızı girin",required:!0,autoFocus:!0,className:"input"})]}),e.jsx("button",{type:"submit",className:"btn btn-primary btn-block",disabled:j,children:j?"Açılıyor...":"Kasayı Aç"})]}),e.jsx("div",{style:{textAlign:"center",marginTop:"16px"},children:e.jsx("button",{onClick:y,className:"btn-link",style:{fontSize:"14px",color:"var(--text-muted)"},children:"Farklı bir hesapla giriş yap"})})]})})},z=({children:s})=>{const r=localStorage.getItem("authToken"),{isLocked:t}=I();return r?t?e.jsx(le,{}):e.jsx(e.Fragment,{children:s}):e.jsx(Q,{to:"/login",replace:!0})},oe=()=>e.jsxs(V,{children:[e.jsx(b,{path:"/login",element:e.jsx(Z,{})}),e.jsx(b,{path:"/register",element:e.jsx(H,{})}),e.jsx(b,{path:"/download",element:e.jsx(ie,{})}),e.jsx(b,{path:"/",element:e.jsx(z,{children:e.jsx(se,{})})}),e.jsx(b,{path:"/passwords/add",element:e.jsx(z,{children:e.jsx(B,{})})}),e.jsx(b,{path:"/passwords/:id",element:e.jsx(z,{children:e.jsx(re,{})})}),e.jsx(b,{path:"/passwords/:id/edit",element:e.jsx(z,{children:e.jsx(ne,{})})}),e.jsx(b,{path:"/settings",element:e.jsx(z,{children:e.jsx(q,{})})}),e.jsx(b,{path:"*",element:e.jsx(te,{})})]}),R=()=>{const s=localStorage.getItem("encryptionKey"),r=localStorage.getItem("authToken"),t=localStorage.getItem("userName");return{encryptionKey:{exists:!!s,length:s?.length,preview:s?.substring(0,32)+"..."},authToken:{exists:!!r,preview:r?.substring(0,32)+"..."},userName:{exists:!!t,value:t},allKeys:Object.keys(localStorage)}};typeof window<"u"&&(window.__debugCrypto=R);typeof window<"u"&&(window.__debugCrypto=R,console.log("💡 Debug mode: console'da __debugCrypto() çağırarak state kontrol edebilirsin"));function de(){return e.jsx("div",{className:"app",children:e.jsx(J,{children:e.jsx(X,{children:e.jsx(ee,{children:e.jsx(oe,{})})})})})}ae.createRoot(document.getElementById("root")).render(e.jsx(o.StrictMode,{children:e.jsx(de,{})}));

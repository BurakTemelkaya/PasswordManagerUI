import{u as z,r as l,g as U,d as E,A as S,j as e,L as T,f as D,l as B,a as R,b as K,c as G,e as M,B as Y,R as $,h,i as W,k as _,S as F,N as O,m as Z}from"./chunks/Settings-CYezMQsb.js";import"./chunks/config-DmK0IJcx.js";const H=({onLogout:n,onAddPassword:t,onViewPassword:s,onEditPassword:N,onSettings:d})=>{const u=z(),[g,b]=l.useState([]),[v,m]=l.useState(!0),[w,p]=l.useState(null),[x,P]=l.useState(""),[i,r]=l.useState(new Map);l.useEffect(()=>{c()},[]);const c=async()=>{try{m(!0),p(null);const a=localStorage.getItem("encryptionKey");if(console.log("🔑 Encryption Key var mı?",!!a),!a){p("Encryption key bulunamadı. Lütfen yeniden giriş yapın."),m(!1);return}console.log("📥 Parolalar yükleniyor...");const o=await U();console.log("✅ API döndü, parola sayısı:",o.length),b(o);const y=new Map;console.log("🔓 Decrypt işlemleri başlıyor..."),await Promise.all(o.map(async j=>{try{const f=await E({encryptedName:j.encryptedName,encryptedUserName:j.encryptedUserName,encryptedPassword:j.encryptedPassword,encryptedDescription:j.encryptedDescription,encryptedWebSiteUrl:j.encryptedWebSiteUrl},a,j.iv);y.set(j.id,{name:f.name,websiteUrl:f.websiteUrl,username:f.username}),console.log(`✅ ${f.name} decrypted başarılı`)}catch(f){console.error(`❌ Decrypt hatası (${j.id}):`,f.message||f)}})),console.log("✅ Tüm decrypt işlemleri tamamlandı, toplam:",y.size),r(y),p(null)}catch(a){a instanceof S?p(a.getUserMessage()):p("Parolalar yüklenemedi"),console.error(a)}finally{m(!1)}},C=l.useMemo(()=>{if(!x.trim())return g;const a=x.toLowerCase();return g.filter(o=>{const y=i.get(o.id);return y?y.name.toLowerCase().includes(a)||y.username.toLowerCase().includes(a)||y.websiteUrl.toLowerCase().includes(a):!1})},[g,x,i]),A=()=>{B(),n?(console.log("📱 Extension popup modunda - onLogout callback çağrılıyor"),n()):u("/login")},I=async a=>{if(window.confirm("Bu parolayı silmek istediğinize emin misiniz?"))try{await R({id:a}),b(g.filter(o=>o.id!==a))}catch(o){o instanceof S?p(o.getUserMessage()):p("Silme işlemi başarısız"),console.error(o)}};return v&&g.length===0?e.jsx("div",{className:"loading",children:"Yükleniyor..."}):e.jsxs("div",{className:"container",children:[e.jsxs("header",{className:"header",children:[e.jsx("h1",{children:"Parolalarım"}),e.jsxs("div",{className:"header-actions",children:[e.jsx(T,{to:"/download",className:"btn btn-info",style:{marginRight:"8px",textDecoration:"none"},title:"Tarayıcı eklentisini indir",children:"🔌 Eklenti"}),e.jsx("button",{onClick:()=>{d?d():u("/settings")},className:"btn btn-secondary",style:{marginRight:"8px"},title:"Ayarlar",children:"⚙️"}),e.jsx("span",{className:"user-name",children:"👤 Kullanıcı"}),e.jsx("button",{onClick:A,className:"btn btn-logout",children:"Çıkış Yap"})]})]}),e.jsxs("main",{className:"main",children:[e.jsx("div",{className:"actions",children:e.jsx("button",{onClick:()=>{t?t():u("/passwords/add")},className:"btn btn-primary",children:"+ Yeni Parola"})}),e.jsx("div",{className:"search-box",style:{marginBottom:"16px"},children:e.jsx("input",{type:"text",placeholder:"Parola ara... (ad, kullanıcı adı, website)",value:x,onChange:a=>P(a.target.value),style:{width:"100%",padding:"12px 16px",borderRadius:"8px",border:"1px solid var(--border-color)",background:"var(--bg-input)",color:"var(--text-primary)",fontSize:"14px"}})}),w&&e.jsx("div",{className:"alert alert-error",children:w}),C.length===0?e.jsx("div",{className:"empty-state",children:x?e.jsxs("p",{children:['"',x,'" için sonuç bulunamadı']}):e.jsxs(e.Fragment,{children:[e.jsx("p",{children:"Henüz parola eklememişsiniz"}),e.jsx("button",{onClick:()=>{t?t():u("/passwords/add")},className:"btn btn-primary",children:"İlk parolayı ekleyin"})]})}):e.jsx("div",{className:"password-grid",children:C.map(a=>{const o=i.get(a.id);return e.jsxs("div",{className:"password-card",children:[e.jsx("h3",{children:o?.name||"Parola"}),e.jsx("p",{className:"website",children:o?.websiteUrl||"-"}),e.jsxs("p",{className:"username",children:["Kullanıcı: ",o?.username||"-"]}),e.jsxs("p",{className:"password-date",children:["Oluşturulma: ",D(a.createdDate)]}),e.jsxs("div",{className:"actions",children:[e.jsx("button",{onClick:()=>{s?s(a.id):u(`/passwords/${a.id}`)},className:"btn btn-small btn-info",children:"Görüntüle"}),e.jsx("button",{onClick:()=>{N?N(a.id):u(`/passwords/${a.id}/edit`)},className:"btn btn-small btn-warning",children:"Düzenle"}),e.jsx("button",{onClick:()=>I(a.id),className:"btn btn-small btn-danger",children:"Sil"})]})]},a.id)})}),e.jsxs("div",{style:{textAlign:"center",marginTop:"16px",color:"var(--text-muted)",fontSize:"13px"},children:["Toplam: ",g.length," parola ",x&&`(${C.length} sonuç)`]})]})]})},Q=()=>e.jsx(K,{}),q=()=>{const{id:n}=G(),t=z(),[s,N]=l.useState(null),[d,u]=l.useState(null),[g,b]=l.useState(!0),[v,m]=l.useState(null),[w,p]=l.useState(!1);l.useEffect(()=>{n&&x()},[n]);const x=async()=>{try{b(!0),m(null);const i=localStorage.getItem("encryptionKey");if(console.log("🔑 Encryption Key var mı?",!!i),!i){m("Encryption key bulunamadı. Lütfen yeniden giriş yapın."),b(!1);return}console.log("📥 Parola yükleniyor, ID:",n);const r=await M(n);if(console.log("✅ API döndü (RAW):",{id:r.id,encryptedNameLength:r.encryptedName?.length,encryptedPasswordLength:r.encryptedPassword?.length,iv:r.iv,ivLength:r.iv?.length,ivType:typeof r.iv}),N(r),!r.iv){console.warn("⚠️ IV BULUNAMADI - Eski şifreleme mi? Backward compat gerekli olabilir"),m("Bu parola yeni format ile kaydedilmemiş. Admin ile iletişim kurun."),b(!1);return}console.log("🔓 Decrypt işlemi başlıyor..."),console.log("📋 Decrypt parametreleri:",{encryptedNameLength:r.encryptedName.length,encryptionKeyLength:i.length,ivLength:r.iv.length});try{const c=await E({encryptedName:r.encryptedName,encryptedUserName:r.encryptedUserName,encryptedPassword:r.encryptedPassword,encryptedDescription:r.encryptedDescription,encryptedWebSiteUrl:r.encryptedWebSiteUrl},i,r.iv);console.log("✅ Decrypt başarılı:",c),u(c)}catch(c){console.error("❌ Decrypt hatası:",c),console.error("Hata detayı:",{message:c.message,name:c.name,stack:c.stack?.split(`
`).slice(0,3)}),m(`Şifre çözme başarısız: ${c.message}`),b(!1);return}}catch(i){console.error("❌ Parola yükleme hatası:",i),m(`Parola yüklenemedi: ${i.message||i}`)}finally{b(!1)}},P=i=>{navigator.clipboard.writeText(i),alert("Kopyalandı!")};return g?e.jsx("div",{className:"loading",children:"Yükleniyor..."}):v||!s?e.jsxs("div",{className:"container",children:[e.jsx("div",{className:"alert alert-error",children:v||"Parola bulunamadı"}),e.jsx("button",{onClick:()=>t("/"),className:"btn btn-primary",children:"Geri Dön"})]}):e.jsxs("div",{className:"container",children:[e.jsxs("header",{className:"header",children:[e.jsx("button",{onClick:()=>t("/"),className:"btn btn-back",children:"← Geri"}),e.jsx("h1",{children:d?.name||"Parola"})]}),e.jsxs("main",{className:"main",children:[e.jsxs("div",{className:"password-details",children:[e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Website"}),e.jsx("p",{children:d?.websiteUrl||"-"})]}),e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Kullanıcı Adı"}),e.jsxs("div",{className:"detail-with-action",children:[e.jsx("p",{children:d?.username||"-"}),e.jsx("button",{onClick:()=>P(d?.username||""),className:"btn btn-small",children:"Kopyala"})]})]}),e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Parola"}),e.jsxs("div",{className:"detail-with-action",children:[e.jsx("p",{children:w?d?.password:"••••••••"}),e.jsx("button",{onClick:()=>p(!w),className:"btn btn-small",children:w?"Gizle":"Göster"}),e.jsx("button",{onClick:()=>P(d?.password||""),className:"btn btn-small",children:"Kopyala"})]})]}),d?.description&&e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Açıklama"}),e.jsx("p",{children:d.description})]}),e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Oluşturulma Tarihi"}),e.jsx("p",{children:D(s.createdDate)})]}),s.updatedDate&&e.jsxs("div",{className:"detail-group",children:[e.jsx("label",{children:"Son Güncellenme Tarihi"}),e.jsx("p",{children:D(s.updatedDate)})]})]}),e.jsxs("div",{className:"actions",children:[e.jsx("button",{onClick:()=>t(`/passwords/${n}/edit`),className:"btn btn-warning",children:"Düzenle"}),e.jsx("button",{onClick:()=>t("/"),className:"btn btn-secondary",children:"Kapat"})]})]})]})},V=()=>{const n=z();return e.jsx("div",{className:"container",children:e.jsxs("div",{className:"not-found",children:[e.jsx("h1",{children:"404"}),e.jsx("p",{children:"Sayfa bulunamadı"}),e.jsx("button",{onClick:()=>n("/"),className:"btn btn-primary",children:"Ana Sayfaya Dön"})]})})},J=()=>{const n=z(),t=()=>{const s=document.createElement("a");s.href="/password-manager-extension.zip",s.download="password-manager-extension.zip",document.body.appendChild(s),s.click(),document.body.removeChild(s)};return e.jsxs("div",{className:"download-page",children:[e.jsxs("div",{className:"download-container",children:[e.jsxs("header",{className:"download-header",children:[e.jsx("div",{className:"download-logo",children:"🔐"}),e.jsx("h1",{children:"Parola Yöneticisi"}),e.jsx("p",{className:"download-subtitle",children:"Zero-Knowledge güvenlikli tarayıcı eklentisi"})]}),e.jsxs("section",{className:"download-features",children:[e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"🔒"}),e.jsx("h3",{children:"Zero-Knowledge"}),e.jsx("p",{children:"Parolalarınız cihazınızda şifrelenir, sunucuda asla açık metin olarak tutulmaz."})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"⚡"}),e.jsx("h3",{children:"Otomatik Doldurma"}),e.jsx("p",{children:"Web sitelerine tek tıkla giriş yapın, form alanlarını otomatik doldurun."})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"🔄"}),e.jsx("h3",{children:"Import/Export"}),e.jsx("p",{children:"Chrome, Firefox, Bitwarden, LastPass'tan parolalarınızı kolayca aktarın."})]}),e.jsxs("div",{className:"feature-card",children:[e.jsx("span",{className:"feature-icon",children:"🛡️"}),e.jsx("h3",{children:"Güçlü Şifreleme"}),e.jsx("p",{children:"AES-256-GCM şifreleme ve PBKDF2 (600.000 iterasyon) ile korunun."})]})]}),e.jsxs("section",{className:"download-section",children:[e.jsx("h2",{children:"Tarayıcı Eklentisini İndirin"}),e.jsx("div",{className:"download-options",children:e.jsxs("div",{className:"download-card",children:[e.jsxs("div",{className:"browser-icons",children:[e.jsx("span",{className:"browser-icon",title:"Chrome",children:"🌐"}),e.jsx("span",{className:"browser-icon",title:"Edge",children:"💠"}),e.jsx("span",{className:"browser-icon",title:"Brave",children:"🦁"})]}),e.jsx("h3",{children:"Chrome / Edge / Brave"}),e.jsx("p",{children:"Chromium tabanlı tarayıcılar için"}),e.jsx("button",{onClick:t,className:"download-btn",children:"📦 Eklentiyi İndir (.zip)"})]})}),e.jsxs("div",{className:"install-guide",children:[e.jsx("h3",{children:"📋 Kurulum Adımları"}),e.jsxs("ol",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"İndirin:"})," Yukarıdaki butona tıklayarak ZIP dosyasını indirin."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Çıkartın:"})," ZIP dosyasını bir klasöre çıkartın."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Eklentiler sayfasını açın:"}),e.jsx("code",{children:"chrome://extensions"})," adresine gidin."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Geliştirici modu:"}),' Sağ üst köşedeki "Geliştirici modu"nu açın.']}),e.jsxs("li",{children:[e.jsx("strong",{children:"Yükleyin:"}),' "Paketlenmemiş öğe yükle" butonuna tıklayın ve çıkarttığınız klasörü seçin.']}),e.jsxs("li",{children:[e.jsx("strong",{children:"Hazır!"})," Eklenti simgesi tarayıcı araç çubuğunda görünecektir."]})]})]})]}),e.jsxs("section",{className:"download-actions",children:[e.jsx("p",{children:"Zaten hesabınız var mı?"}),e.jsx("button",{onClick:()=>n("/login"),className:"btn-secondary",children:"Giriş Yap"}),e.jsx("button",{onClick:()=>n("/register"),className:"btn-primary",children:"Kayıt Ol"})]}),e.jsx("footer",{className:"download-footer",children:e.jsxs("p",{children:["🔐 Açık kaynak parola yöneticisi |",e.jsx("a",{href:"https://github.com/BurakTemelkaya/PasswordManagerUI",target:"_blank",rel:"noopener noreferrer",children:"GitHub"})]})})]}),e.jsx("style",{children:`
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
      `})]})},k=({children:n})=>localStorage.getItem("authToken")?e.jsx(e.Fragment,{children:n}):e.jsx(O,{to:"/login",replace:!0}),X=()=>e.jsx(Y,{children:e.jsxs($,{children:[e.jsx(h,{path:"/login",element:e.jsx(W,{})}),e.jsx(h,{path:"/register",element:e.jsx(_,{})}),e.jsx(h,{path:"/download",element:e.jsx(J,{})}),e.jsx(h,{path:"/",element:e.jsx(k,{children:e.jsx(H,{})})}),e.jsx(h,{path:"/passwords/add",element:e.jsx(k,{children:e.jsx(K,{})})}),e.jsx(h,{path:"/passwords/:id",element:e.jsx(k,{children:e.jsx(q,{})})}),e.jsx(h,{path:"/passwords/:id/edit",element:e.jsx(k,{children:e.jsx(Q,{})})}),e.jsx(h,{path:"/settings",element:e.jsx(k,{children:e.jsx(F,{})})}),e.jsx(h,{path:"*",element:e.jsx(V,{})})]})}),L=()=>{const n=localStorage.getItem("encryptionKey"),t=localStorage.getItem("authToken"),s=localStorage.getItem("userName");return{encryptionKey:{exists:!!n,length:n?.length,preview:n?.substring(0,32)+"..."},authToken:{exists:!!t,preview:t?.substring(0,32)+"..."},userName:{exists:!!s,value:s},allKeys:Object.keys(localStorage)}};typeof window<"u"&&(window.__debugCrypto=L);typeof window<"u"&&(window.__debugCrypto=L,console.log("💡 Debug mode: console'da __debugCrypto() çağırarak state kontrol edebilirsin"));function ee(){return e.jsx("div",{className:"app",children:e.jsx(X,{})})}Z.createRoot(document.getElementById("root")).render(e.jsx(l.StrictMode,{children:e.jsx(ee,{})}));

# PasswordManagerUI - Yapay Zeka (AI) Etkileşim Rehberi (agents.md)

Bu belge, bu projeyi inceleyen veya projeye kod yazan diğer yapay zeka ajanlarına projenin mimarisini, teknoloji yığınını, çalışma mantığını ve kurallarını açıklamak için hazırlanmıştır.

## 📌 Proje Özeti
Bu proje, Bitwarden benzeri "Zero-Knowledge" (Sıfır Bilgi) uçtan uca şifreleme (E2EE) mimarisine sahip bir **Parola Yöneticisi Web Uygulaması ve Tarayıcı Eklentisi**dir. Sunucu hiçbir zaman kullanıcıların şifresiz verilerini görmez veya saklamaz.

## 🏗 Mimari ve Şifreleme (Bitwarden Modeli)
Bu projedeki parolanın şifrelenme akışı, güvenliğin temelidir. Yapay zeka ajanları, şifreleme ile ilgili bir kod yazdığında aşağıdaki standartlara **harfiyen uymalıdır**:

1. **Native Web Crypto API**: Uygulama şifreleme işlemleri için harici bir kütüphane (ör. `crypto-js`) yerine donanım hızlandırmalı tarayıcı uzantısı **Web Crypto API** kullanmaktadır (`crypto.subtle`).
2. **Master Password (Ana Parola)**: Asla cihazdan dışarı çıkmaz ve sunucuya düz metin (plaintext) olarak gönderilmez.
3. **Master Key (Ana Anahtar)**:
   - Kullanıcının `Master Password`'ü ve `UserId` (salt olarak) kullanılarak PBKDF2 algoritması (600.000 iterasyon) ile 256-bitlik bir `Master Key` üretilir. (Böylelikle username değişse bile şifreleme bozulmaz.)
4. **Authentication Hash (Kimlik Doğrulama Hash'i)**: 
   - `Master Key`, SHA-512 ile hashlenerek `Authentication Hash` oluşturulur. Sunucuya giriş (login/register) yapılırken kullanıcının kimliğini doğrulamak için sadece bu hash gönderilir.
5. **Encryption Key (Şifreleme Anahtarı)**:
   - `Master Key` üzerinden HMAC-SHA256 kullanılarak bir `Encryption Key` türetilir. Veri şifreleme/çözme işlemleri bu anahtar kullanılarak yapılır.
6. **Veri Şifreleme (AES-GCM)**:
   - Parolalar, kullanıcı adları, URL'ler gibi hassas veriler AES-256 GCM algoritması ile şifrelenir. 
   - Her işlem için rastgele 12 byte'lık bir IV (Initialization Vector) üretilir.
   - Sunucu tarafında (backend) yalnızca şifrelenmiş (Encrypted) metinler tutulur.

## 🚀 Teknoloji Yığını (Tech Stack)
- **Framework**: React 19, TypeScript, Vite.
- **Tarayıcı Eklentisi (Chrome Extension)**: Native arka plan (background.ts) ve içerik scriptleri (content.ts).
- **Stil/CSS**: index.css & App.css (Global/Vanilla CSS veya mevcut proje içi stil modülleri)
- **Depolama (Extension)**: `chrome.storage.local` (şifreli önbellek, refresh token vb.) ve `chrome.storage.session` (auth token ve encryption key gibi geçici hassas veriler).
- **Ağ/HTTP**: Axios ve `fetch` API.
  
## 📂 Proje Yapısı
- `/src/pages/` - Web sayfası (ve bazen popup) görünümleri (Login, Register, Dashboard, vb.).
- `/src/helpers/encryption.ts` - **Tüm şifreleme/çözme fonksiyonlarının kalbi.** Yeni bir şifreleme eklenecekse burası kullanılmalı/genişletilmelidir.
- `/src/background.ts` - Tarayıcı eklentisinin arka plan süreçleri. API isteklerinin yönetimi, auto-save / autofill için endpoint dinleme, önbellekleme stratejileri.
- `/src/content.ts` - DOM modifikasyonları. Web sitelerindeki login formlarını tespit etmek ve auto-fill (otomatik doldurma) işlemlerini yönetmekten sorumludur.
- `/public-extension/` - Eklentinin manifest'i ve popup UI'ı.
- `package.json` - İki farklı build konfigürasyonu bulunur. Hem `build:web` (web uygulaması) hem de `build:extension` (Chrome eklentisi) hedefi aynı kod tabanından (monorepo mantığıyla) çıkarılır.

## 🚨 Geliştirme Kuralları (Ajanlar İçin)
1. **Şifreleme Mantığını Bozmayın**: Hiçbir parolanın düz metin (plaintext) olarak ağ (network) loglarına veya diske (storage düşmesine) izin vermeyin. `encryption.ts` içindeki önceden yazılmış olan `encryptDataForAPI` veya `decryptDataFromAPI` helperlarını kullanın.
2. **Refresh Token Mekanizması**: İstekler 401 hatası alırsa, otomatik olarak `RefreshToken` üzerinden yeni bir token alınmalıdır (Bu mantık `background.ts` içinde `fetchWithRefresh` gibi helper'larda kurulmuştur).
3. **Session vs Local Storage Güvenliği**:
   - `Encryption Key` SADECE `chrome.storage.session` içinde saklanmalıdır (Tarayıcı kapandığında kilitlenmesi için).
   - Veritabanından (API'den) çekilmiş parolalar `chrome.storage.local`'de ancak *şifrelenmiş haliyle* tutulabilir (Cache Fallback).
4. **Bağımlılıklar**: Eğer mümkünse Web Crypto API kullanın. Gerekli olmadıkça projenin boyutunu ve eklenti performansını düşürecek ek şifreleme kütüphaneleri dahil etmeyin.
5. **Autofill & Parsing Tespiti**: `content.ts` içerisindeki form parse ederken URL tabanlı `scoreHostnameMatch` fonksiyonu mevcuttur. Form yakalama iyileştirmeleri veya otomatik giriş eklentileri yaparken mevcut eşleşme algoritmalarının dışına çıkmamaya / varolan yapıları bozmamaya özen gösterin.

## 🔗 AI İçin Özet Yönerge
"Bir Parola Yöneticisi ve Chrome Eklentisi geliştiriyorsun. Veriler tamamen client-side tarafında şifreleniyor. Zero-knowledge prensibine sadık kalmalı, verileri dışarı açık şekilde yollamamalı ve mevcut şifreleme alt yapısına (Web Crypto API + Bitwarden modeli) uygun hareket etmelisin."

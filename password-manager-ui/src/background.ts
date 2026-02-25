/**
 * Background Service Worker
 * Extension'ın arka planda çalışmasını sağlar
 * Parolaları yönetir ve content script ile iletişim kurar
 */

import { config } from './helpers/config';

// ============================================
// TYPES
// ============================================
interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  websiteUrl: string;
}

interface EncryptedPassword {
  id: string;
  encryptedName: string;
  encryptedUserName: string;
  encryptedPassword: string;
  encryptedDescription: string;
  encryptedWebSiteUrl: string;
  iv: string;
  userId?: string;
  createdDate?: string;
  updatedDate?: string | null;
}

// ============================================
// ENCRYPTION UTILITIES (Same as popup encryption.ts)
// ============================================

/**
 * Hex string → Buffer dönüş
 */
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Base64 → Buffer dönüş
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Buffer → String dönüş (UTF-8)
 */
function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

/**
 * AES-256 GCM şifre çözme
 */
async function decryptAES(
  encryptedBase64: string,
  keyHex: string,
  ivBase64: string
): Promise<string> {
  try {
    if (!encryptedBase64) return '';

    const keyBuffer = hexToBuffer(keyHex);
    const ivBuffer = base64ToBuffer(ivBase64);
    const encryptedBuffer = base64ToBuffer(encryptedBase64);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      cryptoKey,
      encryptedBuffer
    );

    return bufferToString(decryptedBuffer);
  } catch (error) {
    console.error('Decrypt error:', error);
    return '';
  }
}

async function decryptPassword(encrypted: EncryptedPassword, encryptionKey: string): Promise<PasswordEntry | null> {
  try {
    const name = await decryptAES(encrypted.encryptedName, encryptionKey, encrypted.iv);
    const username = await decryptAES(encrypted.encryptedUserName, encryptionKey, encrypted.iv);
    const password = await decryptAES(encrypted.encryptedPassword, encryptionKey, encrypted.iv);
    const websiteUrl = await decryptAES(encrypted.encryptedWebSiteUrl, encryptionKey, encrypted.iv);

    return {
      id: encrypted.id,
      name,
      username,
      password,
      websiteUrl
    };
  } catch (error) {
    console.error('Password decryption failed:', error);
    return null;
  }
}

// ============================================
// API UTILITIES
// ============================================

/**
 * Refresh token ile yeni access token al
 */
async function refreshAccessToken(refreshToken: string, apiUrl: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const response = await fetch(`${apiUrl}/Auth/RefreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      console.error('🔴 Refresh token başarısız:', response.status);
      return null;
    }

    const data = await response.json();

    // Yeni token'ları session storage'a kaydet
    if (data.accessToken?.token) {
      await chrome.storage.session.set({ authToken: data.accessToken.token });
      await chrome.storage.local.set({
        tokenExpiration: data.accessToken.expirationDate
      });
      console.log('✅ Background: Access token yenilendi');
    }

    if (data.refreshToken?.token) {
      await chrome.storage.local.set({
        refreshToken: data.refreshToken.token,
        refreshTokenExpiration: data.refreshToken.expirationDate
      });
      console.log('✅ Background: Refresh token yenilendi');
    }

    return {
      accessToken: data.accessToken?.token,
      refreshToken: data.refreshToken?.token
    };
  } catch (error) {
    console.error('🔴 Refresh token hatası:', error);
    return null;
  }
}

/**
 * Token ile API isteği yap, 401 durumunda refresh token dene
 */
async function fetchWithRefresh(url: string, token: string, apiUrl: string): Promise<Response> {
  let response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // 401 Unauthorized - refresh token dene
  if (response.status === 401) {
    const localData = await chrome.storage.local.get(['refreshToken']);
    const refreshToken = localData.refreshToken as string | undefined;

    if (refreshToken) {
      const newTokens = await refreshAccessToken(refreshToken, apiUrl);

      if (newTokens?.accessToken) {
        // Yeni token ile tekrar dene
        response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${newTokens.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    }
  }

  return response;
}

async function fetchPasswords(token: string, apiUrl: string): Promise<EncryptedPassword[] | null> {
  try {
    // Get all passwords (yeni endpoint) - refresh token destekli
    const response = await fetchWithRefresh(`${apiUrl}/Password/GetAll`, token, apiUrl);

    if (!response.ok) {
      console.error('API response not ok:', response.status);

      // 401 hala devam ediyorsa oturumu sonlandır
      if (response.status === 401) {
        console.log('🔴 Token yenileme başarısız, oturum sonlandırılıyor...');
        await chrome.storage.session.remove(['authToken', 'encryptionKey']);
        await chrome.storage.local.remove(['refreshToken', 'refreshTokenExpiration', 'passwords']);
      }

      return null;
    }

    const data = await response.json();

    // Direkt array dönüyor
    return Array.isArray(data) ? data : (data.$values || []);
  } catch (error) {
    console.error('Fetch passwords error:', error);
    return null;
  }
}

/**
 * Domain bazlı esnek eşleşme
 * Örnek: "accounts.google.com" ile "google.com" eşleşir
 * "test.example.com" ile "example.com" eşleşir
 */
function extractMainDomain(hostname: string): string {
  // www. prefix'ini kaldır
  let domain = hostname.replace(/^www\./, '');

  // Domain parçalarını al
  const parts = domain.split('.');

  // En az 2 parça varsa son 2'yi al (example.com)
  // Bazı TLD'ler 2 parçalı (co.uk, com.tr) ama basit tutuyoruz
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }

  return domain;
}

/**
 * URL'lerin ne kadar iyi eşleştiğini puanlar (Sıralama için)
 * 3 = Tam Eşleşme (Exact hostname)
 * 2 = Kök Domain Eşleşmesi (Root domain)
 * 1 = Kısmi Eşleşme (Substring)
 * 0 = Eşleşme Yok
 */
function scoreHostnameMatch(websiteUrl: string, currentHostname: string): number {
  if (!websiteUrl || !currentHostname) return 0;

  try {
    const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    const savedHostname = url.hostname;
    const currentClean = currentHostname.replace(/^www\./, '');
    const savedClean = savedHostname.replace(/^www\./, '');

    // 1. Tam Eşleşme
    if (savedClean === currentClean) {
      return 3;
    }

    // 2. Kök Domain Eşleşmesi
    const savedDomain = extractMainDomain(savedClean);
    const currentDomain = extractMainDomain(currentClean);
    if (savedDomain === currentDomain) {
      return 2;
    }

    // 3. Kısmi Eşleşme
    if (savedClean.includes(currentClean) || currentClean.includes(savedClean)) {
      return 1;
    }

    return 0;
  } catch {
    // Parse edilemezse basit string karşılaştırması
    const savedClean = websiteUrl.toLowerCase().replace(/^www\./, '');
    const currentClean = currentHostname.toLowerCase().replace(/^www\./, '');

    if (savedClean === currentClean) return 3;
    if (savedClean.includes(currentClean) || currentClean.includes(savedClean)) return 1;
    return 0;
  }
}

// ============================================
// STATE
// ============================================
const loginTabs = new Set<number>();

// Pending credentials - form submit sonrası sayfa yönlendirmede kullanılır
interface PendingCredential {
  username: string;
  password: string;
  hostname: string;
  isSignup: boolean;
  tabId: number;
  timestamp: number;
}
let pendingCredentials: PendingCredential | null = null;

// ============================================
// EXTENSION LIFECYCLE
// ============================================
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'pm-main',
        title: '🔐 Parola Yöneticisi',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'pm-open',
        parentId: 'pm-main',
        title: 'Popup\'ı Aç',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'pm-fill',
        parentId: 'pm-main',
        title: 'Otomatik Doldur',
        contexts: ['editable']
      });
    });

    // Debug: Check storage on install/update
    chrome.storage.local.get(['encryptedPasswords', 'passwords'], (data) => {
      console.log('🚀 Extension Installed/Updated');
      console.log('🔒 Encrypted Status:', data.encryptedPasswords ? '✅ Found' : '❌ Not Found');
      console.log('⚠️ Legacy Plaintext Status:', data.passwords ? '❌ Found (Should be removed)' : '✅ Clean');

      // Proactive Cache Check
      ensureEncryptedCache();
    });
  } catch (error) {
    console.error('Context menu error:', error);
  }
});

// onStartup is redundant if we check on every interaction, but good for proactive sync
chrome.runtime.onStartup.addListener(() => {
  ensureEncryptedCache();
});

// ============================================
// MESSAGE HANDLERS
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle async operations
  (async () => {
    try {
      switch (request.type) {
        case 'GET_PASSWORDS_FOR_SITE':
          await handleGetPasswordsForSite(request.hostname, sendResponse);
          break;

        case 'AUTOFILL_PASSWORD':
          await handleAutofill(request);
          sendResponse({ success: true });
          break;

        case 'LOGIN_FORM_DETECTED':
          handleLoginFormDetected(sender.tab?.id, request);
          sendResponse({ success: true });
          break;

        case 'GET_CURRENT_TAB':
          await handleGetCurrentTab(sendResponse);
          break;

        case 'OPEN_POPUP':
          try {
            await chrome.action.openPopup();
          } catch {
            chrome.tabs.create({ url: chrome.runtime.getURL('public/popup.html') });
          }
          sendResponse({ success: true });
          break;

        case 'SAVE_PASSWORD':
          await handleSavePassword(request, sendResponse);
          break;

        case 'CHECK_CREDENTIAL_EXISTS':
          await handleCheckCredentialExists(request.hostname, request.username, sendResponse);
          break;

        case 'CREDENTIAL_SUBMITTED':
          // Content script form submit yakaladı, credential'ları sakla
          if (sender.tab?.id) {
            pendingCredentials = {
              username: request.username,
              password: request.password,
              hostname: request.hostname,
              isSignup: request.isSignup || false,
              tabId: sender.tab.id,
              timestamp: Date.now()
            };
          }
          sendResponse({ success: true });
          break;

        case 'GET_PENDING_CREDENTIALS':
          // Yeni sayfa yüklendikten sonra content script pending credential sorar
          if (pendingCredentials && sender.tab?.id === pendingCredentials.tabId) {
            // 30 saniye içinde geçerliyse
            if (Date.now() - pendingCredentials.timestamp < 30000) {
              sendResponse({
                success: true,
                hasPending: true,
                ...pendingCredentials
              });
            } else {
              pendingCredentials = null;
              sendResponse({ success: true, hasPending: false });
            }
          } else {
            sendResponse({ success: true, hasPending: false });
          }
          break;

        case 'CLEAR_PENDING_CREDENTIALS':
          if (sender.tab?.id && pendingCredentials?.tabId === sender.tab.id) {
            pendingCredentials = null;
          }
          sendResponse({ success: true });
          break;

        case 'CLEAR_CACHE':
          await chrome.storage.local.remove('encryptedPasswords');
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, message: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: String(error) });
    }
  })();

  return true; // Keep channel open for async
});

async function handleGetPasswordsForSite(hostname: string, sendResponse: (response: { success: boolean; isAuthenticated?: boolean; passwords: PasswordEntry[]; message?: string; matching?: number; error?: string }) => void) {
  try {
    // Session storage'dan hassas verileri al (tarayıcı kapanınca silinir)
    const sessionData = await chrome.storage.session.get(['authToken', 'encryptionKey']);
    // Local storage'dan kalıcı verileri al - Sadece şifreli parolalar ve API bilgileri
    const localData = await chrome.storage.local.get(['apiUrl', 'encryptedPasswords', 'refreshToken', 'authToken']);

    let token = sessionData.authToken as string | undefined;
    let encryptionKey = sessionData.encryptionKey as string | undefined;

    // Session storage'da token yoksa local storage'dan al (popup kaydetmiş olabilir)
    if (!token && localData.authToken) {
      console.log('[BG] Token session\'da yok, local storage\'dan alınıyor...');
      token = localData.authToken as string;
      // Session storage'a da kaydet (gelecek istekler için)
      await chrome.storage.session.set({ authToken: token });
    }

    // Güvenlik: Encryption Key sadece session storage'da tutulur
    // Eğer yoksa kasa kilitlidir - kullanıcı master parola ile açmalı

    // Token yoksa ve Refresh Token varsa (Service worker uyandıysa)
    if (!token && localData.refreshToken) {
      console.log('[BG] Token yok, refresh token ile yenileniyor...');
      const apiUrl = (localData.apiUrl as string) || config.api.baseURL;
      const newTokens = await refreshAccessToken(localData.refreshToken as string, apiUrl);
      if (newTokens?.accessToken) {
        token = newTokens.accessToken;
        // Yeni token'ı session storage'a kaydet
        await chrome.storage.session.set({ authToken: token });
        console.log('[BG] Token yenilendi ve session storage\'a kaydedildi');
      }
    }

    // Durum kontrolü: Token var mı? Encryption Key var mı?
    const hasToken = !!token;
    const hasKey = !!encryptionKey;

    if (!hasToken) {
      // Hiç giriş yapılmamış
      sendResponse({
        success: false,
        isAuthenticated: false,
        passwords: [],
        message: 'Giriş yapılmamış'
      });
      return;
    }

    if (!hasKey) {
      // Giriş yapılmış ama kasa kilitli
      sendResponse({
        success: false,
        isAuthenticated: false, // UI'da "kilit aç" gösterilsin
        passwords: [],
        message: 'Kasa kilitli'
      });
      return;
    }

    // CACHE STRATEGY:
    // 1. Önce storage'daki 'encryptedPasswords' (Şifreli Önbellek) kontrol et
    let encryptedPasswords = localData.encryptedPasswords as EncryptedPassword[] | undefined;

    // 2. Cache yoksa API'den çek
    if (!encryptedPasswords || encryptedPasswords.length === 0) {
      console.log('🌐 API\'den parolalar çekiliyor...');
      const apiUrl = (localData.apiUrl as string) || config.api.baseURL;
      const fetched = await fetchPasswords(token as string, apiUrl);

      if (fetched) {
        encryptedPasswords = fetched;
        // API'den gelen veriyi ŞİFRELİ olarak kaydet (Plaintext kaydetme!)
        if (encryptedPasswords.length > 0) {
          await chrome.storage.local.set({ encryptedPasswords });
          // Varsa eski 'passwords' (plaintext) verisini sil (Migration)
          await chrome.storage.local.remove(['passwords']);
        }
      } else {
        // Fetch failed
        encryptedPasswords = [];
      }
    } else {
      console.log('📦 Şifreli önbellekten yüklendi');
    }

    // 3. Verileri HAFIZADA çöz (Diske yazma!)
    const decryptedPasswords: PasswordEntry[] = [];
    if (encryptedPasswords && encryptedPasswords.length > 0) {
      for (const encrypted of encryptedPasswords) {
        const decrypted = await decryptPassword(encrypted, encryptionKey);
        if (decrypted) {
          decryptedPasswords.push(decrypted);
        }
      }
    }

    // 4. Domain bazlı filtreleme ve en iyi eşleşen üste gelecek şekilde sıralama
    const scoredPasswords = decryptedPasswords
      .map(pwd => ({
        pwd,
        score: scoreHostnameMatch(pwd.websiteUrl, hostname)
      }))
      .filter(item => item.score > 0) // Sadece eşleşenleri al
      .sort((a, b) => b.score - a.score); // En yüksek puan ilk sırada

    // Puanlamadan çıkarıp salt objeleri al
    const passwordsToReturn = scoredPasswords.map(item => item.pwd);

    sendResponse({
      success: true,
      isAuthenticated: true,
      passwords: passwordsToReturn,
      matching: passwordsToReturn.length
    });
  } catch (error) {
    console.error('Get passwords error:', error);
    sendResponse({
      success: false,
      isAuthenticated: true,
      passwords: [],
      error: String(error)
    });
  }
}

async function ensureEncryptedCache() {
  try {
    const localData = await chrome.storage.local.get(['authToken', 'encryptedPasswords', 'apiUrl']);

    // If we have token (logged in) but cache is missing
    if (localData.authToken && (!localData.encryptedPasswords || !Array.isArray(localData.encryptedPasswords))) {
      console.log('🔄 Proactive: Auth token found but check missing. background.js Fetching...');
      const apiUrl = (localData.apiUrl as string) || config.api.baseURL;
      const fetched = await fetchPasswords(localData.authToken as string, apiUrl);

      if (fetched) {
        await chrome.storage.local.set({ encryptedPasswords: fetched });
        console.log('✅ Proactive: Cache populated with ' + fetched.length + ' items.');
      } else {
        console.log('❌ Proactive: Fetch failed.');
      }
    }
  } catch (e) {
    console.error('Proactive sync error:', e);
  }
}

async function handleAutofill(request: { username: string; password: string }) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'AUTOFILL',
          username: request.username,
          password: request.password
        });
      } catch {
        // Inject content script if not loaded
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });

        setTimeout(async () => {
          await chrome.tabs.sendMessage(tab.id!, {
            type: 'AUTOFILL',
            username: request.username,
            password: request.password
          });
        }, 100);
      }
    }
  } catch (error) {
    console.error('Autofill error:', error);
  }
}

function handleLoginFormDetected(tabId: number | undefined, _request: any) {
  if (tabId) {
    loginTabs.add(tabId);
    chrome.action.setBadgeText({ text: '●', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#0d9488', tabId });
  }
}

async function handleGetCurrentTab(sendResponse: (response: any) => void) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    sendResponse({
      success: true,
      tab: tab ? { id: tab.id, url: tab.url, title: tab.title } : null
    });
  } catch (error) {
    sendResponse({ success: false, error: String(error) });
  }
}

// ============================================
// AUTO-SAVE: ENCRYPTION HELPERS
// ============================================

/**
 * IV (Initialization Vector) üret - AES-GCM için (12 bytes)
 */
function generateIV(): string {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  let binary = '';
  for (let i = 0; i < iv.byteLength; i++) {
    binary += String.fromCharCode(iv[i]);
  }
  return btoa(binary);
}

/**
 * AES-256 GCM şifreleme (background context)
 */
async function encryptAESForSave(
  plainText: string,
  keyHex: string,
  ivBase64: string
): Promise<string> {
  try {
    if (!plainText) plainText = '';

    const keyBuffer = hexToBuffer(keyHex);
    const binaryString = atob(ivBase64);
    const ivBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      ivBytes[i] = binaryString.charCodeAt(i);
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encoder = new TextEncoder();
    const plainBuffer = encoder.encode(plainText);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: ivBytes },
      cryptoKey,
      plainBuffer
    );

    // Buffer → Base64
    const encBytes = new Uint8Array(encryptedBuffer);
    let encBinary = '';
    for (let i = 0; i < encBytes.byteLength; i++) {
      encBinary += String.fromCharCode(encBytes[i]);
    }
    return btoa(encBinary);
  } catch (error) {
    console.error('Background encrypt error:', error);
    return '';
  }
}

// ============================================
// AUTO-SAVE: SAVE PASSWORD HANDLER
// ============================================

async function handleSavePassword(
  request: { name: string; username: string; password: string; websiteUrl: string },
  sendResponse: (response: { success: boolean; message?: string }) => void
) {
  try {
    const sessionData = await chrome.storage.session.get(['authToken', 'encryptionKey']);
    const localData = await chrome.storage.local.get(['apiUrl', 'authToken']);

    let token = sessionData.authToken as string | undefined;
    const encryptionKey = sessionData.encryptionKey as string | undefined;

    // Session'da token yoksa local'dan al
    if (!token && localData.authToken) {
      token = localData.authToken as string;
      await chrome.storage.session.set({ authToken: token });
    }

    if (!token) {
      sendResponse({ success: false, message: 'Giriş yapılmamış' });
      return;
    }

    if (!encryptionKey) {
      sendResponse({ success: false, message: 'Kasa kilitli' });
      return;
    }

    // IV üret ve şifrele
    const iv = generateIV();
    const encryptedName = await encryptAESForSave(request.name || request.websiteUrl || 'Otomatik Kayıt', encryptionKey, iv);
    const encryptedUserName = await encryptAESForSave(request.username, encryptionKey, iv);
    const encryptedPassword = await encryptAESForSave(request.password, encryptionKey, iv);
    const encryptedDescription = await encryptAESForSave('Otomatik kaydedildi', encryptionKey, iv);
    const encryptedWebSiteUrl = await encryptAESForSave(request.websiteUrl, encryptionKey, iv);

    // API'ye kaydet
    const apiUrl = (localData.apiUrl as string) || config.api.baseURL;

    const postResponse = await fetch(`${apiUrl}/Password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        encryptedName,
        encryptedUserName,
        encryptedPassword,
        encryptedDescription,
        encryptedWebSiteUrl,
        iv
      })
    });

    if (!postResponse.ok) {
      // 401 ise refresh token dene
      if (postResponse.status === 401) {
        const refreshData = await chrome.storage.local.get(['refreshToken']);
        const refreshToken = refreshData.refreshToken as string | undefined;
        if (refreshToken) {
          const newTokens = await refreshAccessToken(refreshToken, apiUrl);
          if (newTokens?.accessToken) {
            const retryResponse = await fetch(`${apiUrl}/Password`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${newTokens.accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                encryptedName,
                encryptedUserName,
                encryptedPassword,
                encryptedDescription,
                encryptedWebSiteUrl,
                iv
              })
            });
            if (!retryResponse.ok) {
              sendResponse({ success: false, message: 'Kaydetme başarısız' });
              return;
            }
          } else {
            sendResponse({ success: false, message: 'Oturum süresi doldu' });
            return;
          }
        } else {
          sendResponse({ success: false, message: 'Oturum süresi doldu' });
          return;
        }
      } else {
        sendResponse({ success: false, message: `API hatası: ${postResponse.status}` });
        return;
      }
    }

    // Cache'i güncelle - API'den taze veriyi çek
    console.log('✅ Parola otomatik kaydedildi');
    const freshPasswords = await fetchPasswords(token, apiUrl);
    if (freshPasswords) {
      await chrome.storage.local.set({ encryptedPasswords: freshPasswords });
    }

    sendResponse({ success: true, message: 'Parola kaydedildi' });
  } catch (error) {
    console.error('Save password error:', error);
    sendResponse({ success: false, message: String(error) });
  }
}

// ============================================
// AUTO-SAVE: CHECK CREDENTIAL EXISTS
// ============================================

async function handleCheckCredentialExists(
  hostname: string,
  username: string,
  sendResponse: (response: { success: boolean; exists: boolean }) => void
) {
  try {
    const sessionData = await chrome.storage.session.get(['encryptionKey']);
    const localData = await chrome.storage.local.get(['encryptedPasswords']);
    const encryptionKey = sessionData.encryptionKey as string | undefined;

    if (!encryptionKey) {
      sendResponse({ success: false, exists: false });
      return;
    }

    const encryptedPasswords = localData.encryptedPasswords as EncryptedPassword[] | undefined;
    if (!encryptedPasswords || encryptedPasswords.length === 0) {
      sendResponse({ success: true, exists: false });
      return;
    }

    // Decrypt ve hostname+username eşleşmesi kontrol et
    for (const encrypted of encryptedPasswords) {
      const decrypted = await decryptPassword(encrypted, encryptionKey);
      if (decrypted && scoreHostnameMatch(decrypted.websiteUrl, hostname) > 0) {
        if (decrypted.username.toLowerCase() === username.toLowerCase()) {
          sendResponse({ success: true, exists: true });
          return;
        }
      }
    }

    sendResponse({ success: true, exists: false });
  } catch (error) {
    console.error('Check credential exists error:', error);
    sendResponse({ success: false, exists: false });
  }
}

// ============================================
// CONTEXT MENU
// ============================================
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'pm-open') {
    try {
      await chrome.action.openPopup();
    } catch {
      chrome.tabs.create({ url: chrome.runtime.getURL('public/popup.html') });
    }
  }

  if (info.menuItemId === 'pm-fill' && tab?.id) {
    chrome.action.openPopup();
  }
});

// ============================================
// TAB MANAGEMENT
// ============================================
chrome.tabs.onRemoved.addListener((tabId) => {
  loginTabs.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    loginTabs.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
    // Pending credential varsa temizleme - yeni sayfaya taşıyacağız
  }

  // Sayfa yüklendiğinde pending credential varsa content script'e bildir
  if (changeInfo.status === 'complete' && pendingCredentials && pendingCredentials.tabId === tabId) {
    // 30 saniye zaman aşımı
    if (Date.now() - pendingCredentials.timestamp < 30000) {
      // Content script'in yüklenmesi için kısa bir gecikme
      setTimeout(() => {
        if (!pendingCredentials || pendingCredentials.tabId !== tabId) return;
        chrome.tabs.sendMessage(tabId, {
          type: 'SHOW_AUTOSAVE_BANNER',
          username: pendingCredentials.username,
          password: pendingCredentials.password,
          hostname: pendingCredentials.hostname,
          isSignup: pendingCredentials.isSignup
        }).catch(() => {
          console.warn('[PM BG] Could not send autosave banner to tab', tabId);
        });
      }, 800);
    } else {
      pendingCredentials = null;
    }
  }
});
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
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
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

async function fetchPasswords(token: string, apiUrl: string): Promise<EncryptedPassword[]> {
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
      
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Direkt array dönüyor
    return Array.isArray(data) ? data : (data.$values || []);
  } catch (error) {
    console.error('Fetch passwords error:', error);
    return [];
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

function matchesHostname(websiteUrl: string, currentHostname: string): boolean {
  try {
    if (!websiteUrl) return false;
    
    // URL'yi parse et
    const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    const savedHostname = url.hostname;
    
    // Ana domain'leri karşılaştır
    const savedDomain = extractMainDomain(savedHostname);
    const currentDomain = extractMainDomain(currentHostname);
    
    // Domain eşleşmesi
    return savedDomain === currentDomain;
  } catch {
    // Parse edilemezse basit string karşılaştırması
    const savedClean = websiteUrl.toLowerCase().replace(/^www\./, '');
    const currentClean = currentHostname.toLowerCase().replace(/^www\./, '');
    return savedClean.includes(currentClean) || currentClean.includes(savedClean);
  }
}

// ============================================
// STATE
// ============================================
const loginTabs = new Set<number>();

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
  } catch (error) {
    console.error('Context menu error:', error);
  }
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
    // Local storage'dan kalıcı verileri al - artık parolalar da burada
    const localData = await chrome.storage.local.get(['apiUrl', 'passwords']);
    
    const token = sessionData.authToken as string | undefined;
    const encryptionKey = sessionData.encryptionKey as string | undefined;
    
    if (!token || !encryptionKey) {
      // Not authenticated
      sendResponse({ 
        success: false, 
        isAuthenticated: false,
        passwords: [], 
        message: 'Giriş yapılmamış' 
      });
      return;
    }
    
    // Önce local storage'dan parolaları kontrol et
    const cachedPasswords = localData.passwords as PasswordEntry[] | undefined;
    
    if (cachedPasswords && cachedPasswords.length > 0) {      
      // Filter by hostname
      const matchingPasswords = cachedPasswords.filter(pwd => 
        matchesHostname(pwd.websiteUrl, hostname)
      );
      
      // If no matching, return all passwords
      let passwordsToReturn: PasswordEntry[];
      if (matchingPasswords.length > 0) {
        passwordsToReturn = matchingPasswords;
      } else {
        passwordsToReturn = cachedPasswords.slice(0, 10);
      }

      sendResponse({ 
        success: true, 
        isAuthenticated: true,
        passwords: passwordsToReturn,
        matching: matchingPasswords.length
      });
      return;
    }
    
    // Local'de yoksa API'den çek (sadece ilk seferde)
    console.log('🌐 API\'den parolalar çekiliyor...');
    const apiUrl = (localData.apiUrl as string) || config.api.baseURL;
    const encryptedPasswords = await fetchPasswords(token, apiUrl);
    
    // fetchPasswords içinde zaten 401 durumunda refresh token deneniyor
    // Eğer hala boşsa ve token geçersizse, oturum sonlandırılmış demektir
    if (encryptedPasswords.length === 0) {
      // Token hala geçerli mi kontrol et
      const sessionCheck = await chrome.storage.session.get(['authToken']);
      if (!sessionCheck.authToken) {
        // Token silindi, oturum sonlandırıldı
        sendResponse({ 
          success: false, 
          isAuthenticated: false,
          passwords: [], 
          message: 'Oturum süresi doldu' 
        });
        return;
      }
    }
    
    const decryptedPasswords: PasswordEntry[] = [];
    
    for (const encrypted of encryptedPasswords) {
      const decrypted = await decryptPassword(encrypted, encryptionKey);
      if (decrypted) {
        decryptedPasswords.push(decrypted);
      }
    }
    
    // Parolaları local storage'a kaydet (cache olarak)
    if (decryptedPasswords.length > 0) {
      await chrome.storage.local.set({ passwords: decryptedPasswords });
    }
    
    // Filter by hostname
    const matchingPasswords = decryptedPasswords.filter(pwd => 
      matchesHostname(pwd.websiteUrl, hostname)
    );
    
    // If no matching, return all passwords
    let passwordsToReturn: PasswordEntry[];
    if (matchingPasswords.length > 0) {
      passwordsToReturn = matchingPasswords;
    } else {
      passwordsToReturn = decryptedPasswords.slice(0, 10);
    }

    sendResponse({ 
      success: true, 
      isAuthenticated: true,
      passwords: passwordsToReturn,
      matching: matchingPasswords.length
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
  }
});
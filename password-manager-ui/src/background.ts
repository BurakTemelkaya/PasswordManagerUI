/**
 * Background Service Worker
 * Extension'ın arka planda çalışmasını sağlar
 * Parolaları yönetir ve content script ile iletişim kurar
 */

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
    
    console.log('Decrypted password:', { id: encrypted.id, name, username, websiteUrl: websiteUrl?.substring(0, 30) });
    
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
async function fetchPasswords(token: string, apiUrl: string): Promise<EncryptedPassword[]> {
  try {
    // Get all passwords (yeni endpoint)
    const response = await fetch(`${apiUrl}/Password/GetAll`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('API response not ok:', response.status);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API response:', data);
    
    // Direkt array dönüyor
    return Array.isArray(data) ? data : (data.$values || []);
  } catch (error) {
    console.error('Fetch passwords error:', error);
    return [];
  }
}

function matchesHostname(websiteUrl: string, hostname: string): boolean {
  try {
    if (!websiteUrl) return false;
    const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    return url.hostname.includes(hostname) || hostname.includes(url.hostname);
  } catch {
    return websiteUrl.toLowerCase().includes(hostname.toLowerCase());
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
  console.log('🔐 Parola Yöneticisi eklentisi yüklendi');
  
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
  console.log('📨 Background message:', request.type);
  
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
    // Local storage'dan kalıcı verileri al
    const localData = await chrome.storage.local.get(['apiUrl']);
    
    const token = sessionData.authToken as string | undefined;
    const encryptionKey = sessionData.encryptionKey as string | undefined;
    const apiUrl = (localData.apiUrl as string) || 'https://localhost:7051/api';
    
    console.log('Auth check:', { hasToken: !!token, hasKey: !!encryptionKey });
    
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
    
    // Fetch and decrypt passwords
    const encryptedPasswords = await fetchPasswords(token, apiUrl);
    
    // Check if token is still valid (API returned empty means might be expired)
    if (encryptedPasswords.length === 0) {
      // Try to verify token
      try {
        const testResponse = await fetch(`${apiUrl}/passwords`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (testResponse.status === 401) {
          // Token expired
          await chrome.storage.local.remove(['authToken', 'encryptionKey', 'userName', 'userId']);
          sendResponse({ 
            success: false, 
            isAuthenticated: false,
            passwords: [], 
            message: 'Oturum süresi doldu' 
          });
          return;
        }
      } catch {
        // Network error, but user is authenticated
      }
    }
    
    const decryptedPasswords: PasswordEntry[] = [];
    
    for (const encrypted of encryptedPasswords) {
      const decrypted = await decryptPassword(encrypted, encryptionKey);
      if (decrypted) {
        decryptedPasswords.push(decrypted);
      }
    }
    
    // Filter by hostname
    const matchingPasswords = decryptedPasswords.filter(pwd => 
      matchesHostname(pwd.websiteUrl, hostname)
    );
    
    // If no matching, return all passwords (sorted by matching first)
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
      isAuthenticated: true, // Assume authenticated but network error
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

console.log('🔐 Background service worker başlatıldı');


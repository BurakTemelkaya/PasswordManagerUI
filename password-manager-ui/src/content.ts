/**
 * Content Script - Bitwarden-Style Autofill Dropdown
 * Input'a tıklandığında açılan, auth durumuna göre UI gösteren sistem
 */

console.log('🔐 Parola Yöneticisi content script yüklendi');

// ============================================
// GLOBAL STATE
// ============================================
interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  websiteUrl: string;
}

interface AuthState {
  isAuthenticated: boolean;
  passwords: PasswordEntry[];
  loading: boolean;
  error: string | null;
}

let authState: AuthState = {
  isAuthenticated: false,
  passwords: [],
  loading: false,
  error: null
};

let activeDropdown: HTMLElement | null = null;
let activeInput: HTMLInputElement | null = null;
let currentHostname = window.location.hostname;
let lastFilledUsername: string | null = null; // Multi-step login için son doldurulan kullanıcı adı
let lastFilledEntry: PasswordEntry | null = null; // Son seçilen parola entry'si

// ============================================
// STYLES - Bitwarden Dark Theme
// ============================================
const OVERLAY_STYLES = `
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
`;

// ============================================
// UTILITY FUNCTIONS
// ============================================
function injectStyles() {
  if (document.getElementById('pm-overlay-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'pm-overlay-styles';
  style.textContent = OVERLAY_STYLES;
  document.head.appendChild(style);
}

function getLockIcon(): string {
  return `<svg viewBox="0 0 24 24"><path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/></svg>`;
}

/**
 * URL'yi kısaltarak sadece domain kısmını göster
 * Örnek: "https://accounts.google.com/v3/signin/..." -> "accounts.google.com"
 */
function shortenUrl(url: string): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    // URL parse edilemezse, / öncesini al
    const match = url.match(/^(?:https?:\/\/)?([^\/]+)/);
    return match ? match[1] : url;
  }
}

function getExternalLinkIcon(): string {
  return `<svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zm-2 16H5V7h7V5H3v16h14v-7h-2v5h-3z"/></svg>`;
}

function isVisible(element: HTMLElement): boolean {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  const existing = document.querySelector('.pm-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `pm-toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span><span>${message}</span>`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'pm-toast-appear 0.2s ease-out reverse';
    setTimeout(() => toast.remove(), 200);
  }, 2000);
}

// ============================================
// AUTH CHECK
// ============================================
async function checkAuthAndLoadPasswords(): Promise<void> {
  authState.loading = true;
  
  try {
    const response = await chrome.runtime.sendMessage({ 
      type: 'GET_PASSWORDS_FOR_SITE',
      hostname: currentHostname
    });
    
    if (response?.success && response.isAuthenticated !== false) {
      authState.isAuthenticated = true;
      authState.passwords = response.passwords || [];
      authState.error = null;
    } else {
      authState.isAuthenticated = response?.isAuthenticated === false ? false : false;
      authState.passwords = [];
      authState.error = response?.message || null;
    }
  } catch (error) {
    authState.isAuthenticated = false;
    authState.passwords = [];
    authState.error = 'Bağlantı hatası';
  }
  
  authState.loading = false;
}

// ============================================
// INPUT DETECTION
// ============================================
function findPasswordFields(): HTMLInputElement[] {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
  return Array.from(inputs).filter(input => isVisible(input));
}

function findUsernameFields(): HTMLInputElement[] {
  // Sadece login/auth ile ilgili input'ları seç
  // input[type="text"] genel seçicisini kaldırdık - artık sadece belirli alanlarda çalışıyor
  const selectors = [
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[autocomplete="current-password"]',
    'input[autocomplete="new-password"]',
    'input[type="email"]',
    'input[name*="user" i]',
    'input[name*="email" i]',
    'input[name*="login" i]',
    'input[name*="account" i]',
    'input[id*="user" i]',
    'input[id*="email" i]',
    'input[id*="login" i]',
    'input[id*="account" i]'
  ];
  
  const found: HTMLInputElement[] = [];
  const seen = new Set<HTMLInputElement>();
  
  for (const selector of selectors) {
    document.querySelectorAll<HTMLInputElement>(selector).forEach(input => {
      if (!seen.has(input) && isVisible(input) && !isSearchInput(input) && isAutofillCandidate(input)) {
        seen.add(input);
        found.push(input);
      }
    });
  }
  
  return found;
}

/**
 * Input'un otomatik doldurma için uygun olup olmadığını kontrol et
 * Sadece password, email veya autocomplete attribute'u olan alanlarda çalışır
 */
function isAutofillCandidate(input: HTMLInputElement): boolean {
  const type = input.type.toLowerCase();
  const autocomplete = (input.autocomplete || '').toLowerCase();
  
  // Password alanları her zaman uygun
  if (type === 'password') return true;
  
  // Email alanları uygun
  if (type === 'email') return true;
  
  // Autocomplete attribute'u olan alanlar uygun
  const validAutocompletes = [
    'username', 'email', 'current-password', 'new-password',
    'cc-name', 'cc-number', 'name', 'given-name', 'family-name'
  ];
  if (validAutocompletes.some(ac => autocomplete.includes(ac))) return true;
  
  // Autocomplete="off" veya "on" ise ve login-related name/id varsa kabul et
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const loginKeywords = ['user', 'email', 'login', 'account', 'mail'];
  
  if (loginKeywords.some(kw => name.includes(kw) || id.includes(kw))) {
    return true;
  }
  
  return false;
}

// Arama inputlarını filtrele
function isSearchInput(input: HTMLInputElement): boolean {
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const placeholder = (input.placeholder || '').toLowerCase();
  const type = input.type.toLowerCase();
  const autocomplete = (input.autocomplete || '').toLowerCase();
  
  // Search input ise atla
  if (type === 'search') return true;
  if (autocomplete === 'off' && (name.includes('search') || id.includes('search') || placeholder.includes('ara'))) return true;
  if (name.includes('search') || id.includes('search') || placeholder.includes('search')) return true;
  
  return false;
}

// Login formu olup olmadığını kontrol et
function isLoginForm(): boolean {
  return findPasswordFields().length > 0 || hasStandaloneUsernameField();
}

// Sadece username/email alanı olan sayfa mı? (multi-step login)
function hasStandaloneUsernameField(): boolean {
  const passwordFields = findPasswordFields();
  const usernameFields = findUsernameFields();
  
  // Password yok ama username var - multi-step login olabilir
  if (passwordFields.length === 0 && usernameFields.length > 0) {
    // En az bir username field'ın form içinde veya login-related olup olmadığını kontrol et
    for (const input of usernameFields) {
      const form = input.closest('form');
      const formAction = form?.action?.toLowerCase() || '';
      const formId = form?.id?.toLowerCase() || '';
      const formClass = form?.className?.toLowerCase() || '';
      
      // Login/signin formunda mı?
      if (formAction.includes('login') || formAction.includes('signin') || formAction.includes('auth') ||
          formId.includes('login') || formId.includes('signin') ||
          formClass.includes('login') || formClass.includes('signin')) {
        return true;
      }
      
      // Submit butonu var mı?
      if (form) {
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) return true;
      }
      
      // Standalone input ama Next/Continue/Devam butonu var mı?
      const parent = input.parentElement?.parentElement?.parentElement;
      if (parent) {
        const buttons = parent.querySelectorAll('button');
        for (const btn of buttons) {
          const btnText = btn.textContent?.toLowerCase() || '';
          if (btnText.includes('next') || btnText.includes('continue') || btnText.includes('devam') || 
              btnText.includes('ileri') || btnText.includes('sonraki')) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

// ============================================
// DROPDOWN MANAGEMENT
// ============================================
function attachInputListeners() {
  injectStyles();
  
  const passwordFields = findPasswordFields();
  const usernameFields = findUsernameFields();
  
  console.log('🔐 Password alanları bulundu:', passwordFields.length);
  console.log('🔐 Username alanları bulundu:', usernameFields.length);
  
  // Password field'lara listener ekle
  passwordFields.forEach(input => {
    if (input.getAttribute('data-pm-attached')) return;
    input.setAttribute('data-pm-attached', 'true');
    
    console.log('🔐 Password listener ekleniyor:', input.name || input.id || 'unnamed');
    
    const showHandler = (e: Event) => {
      e.stopPropagation();
      console.log('🔐 Password input focus/click');
      showDropdown(input, 'password');
    };
    
    input.addEventListener('focus', showHandler);
    input.addEventListener('click', showHandler);
  });
  
  // Username/Email field'lara da listener ekle (multi-step login için)
  // Sadece uygun alanlarda çalış
  usernameFields.forEach(input => {
    if (input.getAttribute('data-pm-attached')) return;
    
    // Otomatik doldurma için uygun değilse atla
    if (!isAutofillCandidate(input)) {
      console.log('🔐 Atlanıyor (uygun değil):', input.name || input.id || 'unnamed');
      return;
    }
    
    // Password field ile aynı formda değilse veya password field yoksa
    const form = input.closest('form');
    const hasPasswordInSameForm = form && form.querySelector('input[type="password"]');
    
    // Eğer aynı formda password varsa, username'e ayrıca listener ekleme
    // Çünkü password'a tıklayınca zaten ikisini de dolduracak
    if (hasPasswordInSameForm) return;
    
    input.setAttribute('data-pm-attached', 'true');
    
    console.log('🔐 Username listener ekleniyor:', input.name || input.id || 'unnamed');
    
    const showHandler = (e: Event) => {
      e.stopPropagation();
      console.log('🔐 Username input focus/click');
      showDropdown(input, 'username');
    };
    
    input.addEventListener('focus', showHandler);
    input.addEventListener('click', showHandler);
  });
}

async function showDropdown(input: HTMLInputElement, inputType: 'password' | 'username' = 'password') {
  console.log('🔐 showDropdown çağrıldı, type:', inputType);
  
  // Eğer aynı input için zaten dropdown açıksa, kapatma
  if (activeDropdown && activeInput === input) {
    return;
  }
  
  closeDropdown();
  activeInput = input;
  
  const dropdown = document.createElement('div');
  dropdown.className = 'pm-dropdown';
  
  // Position dropdown below input
  const rect = input.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const dropdownWidth = 320;
  
  let leftPos = rect.left;
  if (leftPos + dropdownWidth > viewportWidth - 10) {
    leftPos = viewportWidth - dropdownWidth - 10;
  }
  if (leftPos < 10) leftPos = 10;
  
  dropdown.style.top = `${rect.bottom + 4}px`;
  dropdown.style.left = `${leftPos}px`;
  dropdown.style.width = `${dropdownWidth}px`;
  
  // Loading state
  dropdown.innerHTML = `
    <div class="pm-dropdown-content">
      <div class="pm-loading">
        <div class="pm-spinner"></div>
        Yükleniyor...
      </div>
    </div>
  `;
  
  document.body.appendChild(dropdown);
  activeDropdown = dropdown;
  
  // Check auth and load passwords
  await checkAuthAndLoadPasswords();
  
  // Update dropdown content
  const content = dropdown.querySelector('.pm-dropdown-content');
  if (!content) return;
  
  if (!authState.isAuthenticated) {
    // Not logged in - Bitwarden style
    content.innerHTML = `
      <div class="pm-login-required">
        <div class="pm-login-text">Otomatik doldurma önerilerini görmek için hesabınızın kilidini açın</div>
        <button class="pm-login-btn">
          ${getLockIcon()}
          Hesap kilidini aç
        </button>
      </div>
    `;
    
    content.querySelector('.pm-login-btn')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
      closeDropdown();
    });
  } else if (authState.passwords.length === 0) {
    // No passwords
    content.innerHTML = `
      <div class="pm-empty-state">
        <div class="pm-empty-text">Bu site için kayıtlı parola yok</div>
      </div>
    `;
  } else {
    // Show passwords - Bitwarden style
    let html = '';
    
    // Multi-step login: Eğer daha önce username doldurulmuşsa ve şimdi password alanındayız
    const isPasswordStep = inputType === 'password' && lastFilledEntry;
    
    if (isPasswordStep && lastFilledEntry) {
      // Önce daha önce seçilen entry'yi öne çıkar
      const initial = (lastFilledEntry.name || lastFilledEntry.websiteUrl || 'P').charAt(0).toUpperCase();
      const displayName = lastFilledEntry.name || shortenUrl(lastFilledEntry.websiteUrl);
      html += `
        <div class="pm-password-item pm-suggested" data-id="${lastFilledEntry.id}">
          <div class="pm-password-favicon">${initial}</div>
          <div class="pm-password-info">
            <div class="pm-password-name">${displayName}</div>
            <div class="pm-password-username">${lastFilledEntry.username} <span class="pm-suggested-badge">Önerilen</span></div>
          </div>
          <div class="pm-password-fill-icon" title="Şifreyi doldur">
            ${getExternalLinkIcon()}
          </div>
        </div>
      `;
      
      // Diğer şifreleri de göster
      authState.passwords.filter(p => p.id !== lastFilledEntry!.id).forEach(pwd => {
        const pwdInitial = (pwd.name || pwd.websiteUrl || 'P').charAt(0).toUpperCase();
        const pwdDisplayName = pwd.name || shortenUrl(pwd.websiteUrl);
        html += `
          <div class="pm-password-item" data-id="${pwd.id}">
            <div class="pm-password-favicon">${pwdInitial}</div>
            <div class="pm-password-info">
              <div class="pm-password-name">${pwdDisplayName}</div>
              <div class="pm-password-username">${pwd.username}</div>
            </div>
            <div class="pm-password-fill-icon" title="Doldur">
              ${getExternalLinkIcon()}
            </div>
          </div>
        `;
      });
    } else {
      // Normal liste
      authState.passwords.forEach(pwd => {
        const initial = (pwd.name || pwd.websiteUrl || 'P').charAt(0).toUpperCase();
        const displayName = pwd.name || shortenUrl(pwd.websiteUrl);
        html += `
          <div class="pm-password-item" data-id="${pwd.id}">
            <div class="pm-password-favicon">${initial}</div>
            <div class="pm-password-info">
              <div class="pm-password-name">${displayName}</div>
              <div class="pm-password-username">${pwd.username}</div>
            </div>
            <div class="pm-password-fill-icon" title="Doldur">
              ${getExternalLinkIcon()}
            </div>
          </div>
        `;
      });
    }
    
    content.innerHTML = html;
    
    // Add click handlers
    content.querySelectorAll('.pm-password-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        const pwd = authState.passwords.find(p => p.id === id);
        if (pwd) {
          if (inputType === 'username') {
            // Sadece username doldur, şifreyi hatırla
            fillUsernameOnly(pwd.username);
            lastFilledUsername = pwd.username;
            lastFilledEntry = pwd;
            console.log('🔐 Username dolduruldu, entry hatırlandı:', pwd.name);
          } else if (inputType === 'password' && findUsernameFields().length === 0) {
            // Sadece password alanı var (multi-step 2. adım)
            fillPasswordOnly(pwd.password);
            lastFilledUsername = null;
            lastFilledEntry = null;
          } else {
            // Normal: hem username hem password doldur
            fillCredentials(pwd.username, pwd.password);
            lastFilledUsername = null;
            lastFilledEntry = null;
          }
          closeDropdown();
        }
      });
    });
  }
}

function closeDropdown() {
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
  activeInput = null;
}

// Close on outside click
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  // Dropdown, password veya username input'larına tıklanmadıysa kapat
  const isInputField = target.closest('input[type="password"]') || 
                       target.closest('input[type="text"]') || 
                       target.closest('input[type="email"]');
  if (!target.closest('.pm-dropdown') && !isInputField) {
    closeDropdown();
  }
});

// Close on escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDropdown();
  }
});

// ============================================
// AUTOFILL LOGIC
// ============================================
function setInputValue(input: HTMLInputElement, value: string): boolean {
  try {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, value);
    } else {
      input.value = value;
    }
    
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    
    return true;
  } catch (error) {
    console.error('Input value set error:', error);
    return false;
  }
}

// Multi-step login: Sadece username doldur
function fillUsernameOnly(username: string) {
  console.log('🔐 fillUsernameOnly çağrıldı:', username);
  
  const usernameFields = findUsernameFields();
  
  if (usernameFields.length > 0) {
    const targetField = usernameFields[0];
    console.log('🔐 Username dolduruluyor (only):', targetField.name || targetField.id);
    if (setInputValue(targetField, username)) {
      showToast('Kullanıcı adı dolduruldu', 'success');
      return true;
    }
  }
  
  showToast('Kullanıcı adı alanı bulunamadı', 'error');
  return false;
}

// Multi-step login: Sadece password doldur
function fillPasswordOnly(password: string) {
  console.log('🔐 fillPasswordOnly çağrıldı');
  
  const passwordFields = findPasswordFields();
  
  if (passwordFields.length > 0) {
    console.log('🔐 Password dolduruluyor (only)');
    if (setInputValue(passwordFields[0], password)) {
      showToast('Şifre dolduruldu', 'success');
      return true;
    }
  }
  
  showToast('Şifre alanı bulunamadı', 'error');
  return false;
}

function fillCredentials(username: string, password: string) {
  console.log('🔐 fillCredentials çağrıldı:', { username, password: '***' });
  
  const usernameFields = findUsernameFields();
  const passwordFields = findPasswordFields();
  
  console.log('🔐 Bulunan alanlar:', { usernameFields: usernameFields.length, passwordFields: passwordFields.length });
  
  let filledUsername = false;
  let filledPassword = false;
  
  // Fill username - önce password field'ın yakınındaki text input'u bul
  if (username) {
    // Password field'ın form'undaki veya yakınındaki username alanını bul
    const passwordField = passwordFields[0];
    let targetField: HTMLInputElement | null = null;
    
    if (passwordField) {
      // Aynı form içindeki input'ları kontrol et
      const form = passwordField.closest('form');
      if (form) {
        const formInputs = form.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="email"], input[autocomplete="username"]');
        for (const input of formInputs) {
          if (isVisible(input)) {
            targetField = input;
            break;
          }
        }
      }
      
      // Form yoksa, password field'ın öncesindeki input'u bul
      if (!targetField) {
        const allInputs = document.querySelectorAll<HTMLInputElement>('input');
        const inputsArray = Array.from(allInputs);
        const passwordIndex = inputsArray.indexOf(passwordField);
        
        for (let i = passwordIndex - 1; i >= 0; i--) {
          const input = inputsArray[i];
          if ((input.type === 'text' || input.type === 'email') && isVisible(input)) {
            targetField = input;
            break;
          }
        }
      }
    }
    
    // Fallback: ilk visible username field
    if (!targetField && usernameFields.length > 0) {
      targetField = usernameFields[0];
    }
    
    if (targetField) {
      console.log('🔐 Username dolduruluyor:', targetField.name || targetField.id);
      if (setInputValue(targetField, username)) {
        filledUsername = true;
      }
    }
  }
  
  // Fill password
  if (passwordFields.length > 0 && password) {
    console.log('🔐 Password dolduruluyor');
    if (setInputValue(passwordFields[0], password)) {
      filledPassword = true;
    }
  }
  
  if (filledUsername || filledPassword) {
    showToast('Kimlik bilgileri dolduruldu', 'success');
  } else {
    showToast('Doldurulacak alan bulunamadı', 'error');
  }
}

// ============================================
// MESSAGE HANDLING
// ============================================
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'AUTOFILL' || message.type === 'AUTOFILL_PASSWORD') {
    fillCredentials(message.username, message.password);
    sendResponse({ success: true });
  }
  
  // Multi-step login: Sadece username doldur
  if (message.type === 'AUTOFILL_USERNAME') {
    fillUsernameOnly(message.username);
    lastFilledUsername = message.username;
    if (message.entry) {
      lastFilledEntry = message.entry;
    }
    sendResponse({ success: true });
  }
  
  // Multi-step login: Sadece password doldur
  if (message.type === 'AUTOFILL_PASSWORD_ONLY') {
    fillPasswordOnly(message.password);
    lastFilledEntry = null;
    lastFilledUsername = null;
    sendResponse({ success: true });
  }
  
  if (message.type === 'GET_PAGE_INFO') {
    sendResponse({
      url: window.location.href,
      hostname: currentHostname,
      title: document.title,
      hasLoginForm: isLoginForm(),
      isMultiStepLogin: hasStandaloneUsernameField() && findPasswordFields().length === 0,
      hasPasswordField: findPasswordFields().length > 0,
      hasUsernameField: findUsernameFields().length > 0
    });
  }
  
  return true;
});

// ============================================
// INITIALIZATION
// ============================================
function initialize() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(attachInputListeners, 300);
    });
  } else {
    setTimeout(attachInputListeners, 300);
  }
  
  // Watch for dynamic content - multi-step login için önemli
  const observer = new MutationObserver(() => {
    attachInputListeners();
    
    // Password alanı yeni eklenmiş olabilir (multi-step 2. adım)
    if (lastFilledEntry && findPasswordFields().length > 0 && lastFilledUsername) {
      console.log('🔐 Multi-step: Password alanı tespit edildi, önceki entry mevcut:', lastFilledUsername);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Notify background about login form (password veya standalone username)
  setTimeout(() => {
    const hasPasswordField = findPasswordFields().length > 0;
    const hasStandaloneUsername = hasStandaloneUsernameField();
    
    if (hasPasswordField || hasStandaloneUsername) {
      chrome.runtime.sendMessage({
        type: 'LOGIN_FORM_DETECTED',
        hostname: currentHostname,
        isMultiStep: hasStandaloneUsername && !hasPasswordField
      }).catch(() => {});
    }
  }, 500);
}

initialize();
console.log('🔐 Parola Yöneticisi autofill sistemi aktif');


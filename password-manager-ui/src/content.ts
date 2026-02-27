/**
 * Content Script - Bitwarden-Style Autofill Dropdown
 * Input'a tıklandığında açılan, auth durumuna göre UI gösteren sistem
 */

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
let lastFilledEntry: PasswordEntry | null = null; // Son seçilen parola entry'si
let autoSaveBannerShown = false; // Banner gösterildi mi?

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

  /* Auto-Save Popup - Bitwarden style (sağ üst köşe) */
  .pm-autosave-banner {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 2147483647;
    background: #1e2328;
    border: 1px solid #3d4148;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
    font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: pm-popup-slide-in 0.3s ease-out;
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 12px;
    width: 340px;
    max-width: calc(100vw - 32px);
  }

  .pm-autosave-banner.pm-closing {
    animation: pm-popup-slide-out 0.3s ease-in forwards;
  }

  @keyframes pm-popup-slide-in {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes pm-popup-slide-out {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(120%); opacity: 0; }
  }

  .pm-autosave-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pm-autosave-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    fill: #175ddc;
  }

  .pm-autosave-text {
    color: #ffffff;
    font-size: 13px;
    line-height: 1.4;
    flex: 1;
  }

  .pm-autosave-text strong {
    color: #8caee6;
  }

  .pm-autosave-details {
    font-size: 12px;
    color: #8d9095;
    margin-top: 2px;
  }

  .pm-autosave-username-input {
    width: 100%;
    margin-top: 8px;
    margin-bottom: 4px;
    padding: 6px 8px;
    border: 1px solid #3d4148;
    background: #111418;
    color: #e3e5e8;
    border-radius: 4px;
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
  }

  .pm-autosave-username-input:focus {
    border-color: #1a6af5;
  }

  .pm-autosave-actions {
    display: flex;
    gap: 8px;
  }

  .pm-autosave-btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.1s ease;
    white-space: nowrap;
    flex: 1;
  }

  .pm-autosave-btn:active {
    transform: scale(0.97);
  }

  .pm-autosave-btn.pm-save {
    background: #175ddc;
    color: #ffffff;
  }

  .pm-autosave-btn.pm-save:hover {
    background: #1a6af5;
  }

  .pm-autosave-btn.pm-save:disabled {
    background: #3d4148;
    color: #8d9095;
    cursor: not-allowed;
  }

  .pm-autosave-btn.pm-dismiss {
    background: transparent;
    color: #8d9095;
    border: 1px solid #3d4148;
  }

  .pm-autosave-btn.pm-dismiss:hover {
    background: #2c3036;
    color: #ffffff;
  }

  .pm-autosave-close {
    background: none;
    border: none;
    color: #8d9095;
    font-size: 16px;
    cursor: pointer;
    padding: 2px 4px;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.15s ease;
    position: absolute;
    top: 8px;
    right: 8px;
  }

  .pm-autosave-close:hover {
    color: #ffffff;
  }

  /* Password Generator Suggestion Dropdown */
  .pm-password-gen {
    position: fixed;
    z-index: 2147483647;
    background: #1e2328;
    border: 1px solid #3d4148;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: pm-dropdown-appear 0.15s ease-out;
    width: 300px;
    overflow: hidden;
  }

  .pm-password-gen-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid #2c3036;
    color: #8caee6;
    font-size: 12px;
    font-weight: 600;
  }

  .pm-password-gen-header svg {
    width: 16px;
    height: 16px;
    fill: #175ddc;
    flex-shrink: 0;
  }

  .pm-password-gen-body {
    padding: 10px 12px;
    cursor: pointer;
    transition: background 0.1s ease;
  }

  .pm-password-gen-body:hover {
    background: #2c3036;
  }

  .pm-password-gen-value {
    font-family: 'Consolas', 'Monaco', monospace;
    color: #51c28a;
    font-size: 14px;
    word-break: break-all;
    letter-spacing: 0.5px;
  }

  .pm-password-gen-hint {
    color: #8d9095;
    font-size: 11px;
    margin-top: 6px;
  }

  .pm-password-gen-actions {
    display: flex;
    border-top: 1px solid #2c3036;
  }

  .pm-password-gen-btn {
    flex: 1;
    padding: 8px;
    background: none;
    border: none;
    color: #8d9095;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.1s ease, color 0.1s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .pm-password-gen-btn:hover {
    background: #2c3036;
    color: #ffffff;
  }

  .pm-password-gen-btn + .pm-password-gen-btn {
    border-left: 1px solid #2c3036;
  }

  .pm-password-gen-btn svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }
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
    // Extension context kontrolü
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }

    const response = await chrome.runtime.sendMessage({
      type: 'GET_PASSWORDS_FOR_SITE',
      hostname: currentHostname
    });

    // Debug log
    if (response?.success && response.isAuthenticated !== false) {
      authState.isAuthenticated = true;
      authState.passwords = response.passwords || [];
      authState.error = null;
    } else {
      authState.isAuthenticated = false;
      authState.passwords = [];
      authState.error = response?.message || null;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Extension context invalidated - sayfa yenilenmeli
    if (errorMessage.includes('Extension context invalidated') ||
      errorMessage.includes('message port closed') ||
      !chrome.runtime?.id) {
      authState.isAuthenticated = false;
      authState.passwords = [];
      authState.error = 'Eklenti yeniden yüklendi. Sayfayı yenileyin.';
      console.warn('[PasswordManager] Extension context invalidated - reload page');
    } else {
      authState.isAuthenticated = false;
      authState.passwords = [];
      authState.error = 'Bağlantı hatası';
    }
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


  // Password field'lara listener ekle
  passwordFields.forEach(input => {
    if (input.getAttribute('data-pm-attached')) return;
    input.setAttribute('data-pm-attached', 'true');

    const showHandler = (e: Event) => {
      e.stopPropagation();
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
      return;
    }

    // Password field ile aynı formda değilse veya password field yoksa
    const form = input.closest('form');
    const hasPasswordInSameForm = form && form.querySelector('input[type="password"]');

    // Eğer aynı formda password varsa, username'e ayrıca listener ekleme
    // Çünkü password'a tıklayınca zaten ikisini de dolduracak
    if (hasPasswordInSameForm) return;

    input.setAttribute('data-pm-attached', 'true');

    const showHandler = (e: Event) => {
      e.stopPropagation();
      showDropdown(input, 'username');
    };

    input.addEventListener('focus', showHandler);
    input.addEventListener('click', showHandler);
  });
}

async function showDropdown(input: HTMLInputElement, inputType: 'password' | 'username' = 'password') {

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
    // Check if it's an extension reload error
    if (authState.error?.includes('yeniden yüklendi') || authState.error?.includes('Sayfayı yenileyin')) {
      content.innerHTML = `
        <div class="pm-login-required">
          <div class="pm-login-text">Eklenti yeniden yüklendi. Lütfen sayfayı yenileyin.</div>
          <button class="pm-login-btn pm-reload-btn">
            🔄 Sayfayı Yenile
          </button>
        </div>
      `;

      content.querySelector('.pm-reload-btn')?.addEventListener('click', () => {
        window.location.reload();
      });
    } else if (authState.error?.includes('Giriş yapılmamış') || authState.error === null) {
      // Kullanıcı hiç giriş yapmamış
      content.innerHTML = `
        <div class="pm-login-required">
          <div class="pm-login-text">Parolalarınızı görmek için giriş yapın</div>
          <button class="pm-login-btn">
            👤 Giriş Yap
          </button>
        </div>
      `;

      content.querySelector('.pm-login-btn')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
        closeDropdown();
      });
    } else {
      // Kasa kilitli - giriş yapılmış ama master parola gerekli
      content.innerHTML = `
        <div class="pm-login-required">
          <div class="pm-login-text">Otomatik doldurma için kasanızın kilidini açın</div>
          <button class="pm-login-btn">
            ${getLockIcon()}
            Kasayı Aç
          </button>
        </div>
      `;

      content.querySelector('.pm-login-btn')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
        closeDropdown();
      });
    }
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
            lastFilledEntry = pwd;
          } else {
            // Password veya genel alan: hem username hem password doldur
            // fillCredentials kendi içinde form'daki tüm text input'ları arar
            fillCredentials(pwd.username, pwd.password);
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

  const usernameFields = findUsernameFields();

  if (usernameFields.length > 0) {
    const targetField = usernameFields[0];
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

  const passwordFields = findPasswordFields();

  if (passwordFields.length > 0) {
    if (setInputValue(passwordFields[0], password)) {
      showToast('Şifre dolduruldu', 'success');
      return true;
    }
  }

  showToast('Şifre alanı bulunamadı', 'error');
  return false;
}

function fillCredentials(username: string, password: string) {

  const usernameFields = findUsernameFields();
  const passwordFields = findPasswordFields();

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
      if (setInputValue(targetField, username)) {
        filledUsername = true;
      }
    }
  }

  // Fill password
  if (passwordFields.length > 0 && password) {
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
    if (message.entry) {
      lastFilledEntry = message.entry;
    }
    sendResponse({ success: true });
  }

  // Multi-step login: Sadece password doldur
  if (message.type === 'AUTOFILL_PASSWORD_ONLY') {
    fillPasswordOnly(message.password);
    lastFilledEntry = null;
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

  // Background login formu kontrol mesajı — banner gösterilmeden önce
  if (message.type === 'CHECK_PAGE_HAS_LOGIN_FORM') {
    const passwordFields = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
    const hasLoginForm = Array.from(passwordFields).some(f => isVisible(f));
    sendResponse({ hasLoginForm });
    return true;
  }

  // Background'dan gelen auto-save banner gösterme mesajı
  if (message.type === 'SHOW_AUTOSAVE_BANNER') {
    handleAutoSaveCheck(message.username, message.password, message.hostname, message.isSignup);
    sendResponse({ success: true });
  }

  return true;
});

// ============================================
// AUTO-SAVE BANNER
// ============================================

/**
 * Kayıt (signup) formu mu kontrol et
 */
function isSignupForm(form: HTMLFormElement | null): boolean {
  if (!form) return false;

  const action = (form.action || '').toLowerCase();
  const id = (form.id || '').toLowerCase();
  const className = (form.className || '').toLowerCase();

  const signupKeywords = ['register', 'signup', 'sign-up', 'sign_up', 'create', 'join', 'kayit', 'kayıt', 'uye', 'üye'];

  // Form action, id veya class'ında signup keyword'ü var mı?
  for (const keyword of signupKeywords) {
    if (action.includes(keyword) || id.includes(keyword) || className.includes(keyword)) {
      return true;
    }
  }

  // autocomplete="new-password" var mı?
  const newPasswordFields = form.querySelectorAll('input[autocomplete="new-password"]');
  if (newPasswordFields.length > 0) return true;

  // 2+ password alanı varsa (şifre + şifre tekrar) büyük ihtimalle kayıt formu
  const passwordFields = form.querySelectorAll('input[type="password"]');
  if (passwordFields.length >= 2) return true;

  // Submit butonunda signup kelimesi var mı?
  const buttons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
  for (const btn of buttons) {
    const btnText = (btn.textContent || (btn as HTMLInputElement).value || '').toLowerCase();
    for (const keyword of signupKeywords) {
      if (btnText.includes(keyword)) return true;
    }
  }

  return false;
}

// ============================================
// PASSWORD GENERATOR SUGGESTION (Bitwarden-style)
// ============================================

let activePasswordGen: HTMLElement | null = null;
let activePasswordField: HTMLInputElement | null = null;

/**
 * Güvenli rastgele parola üret (Web Crypto API)
 */
function generateSecurePassword(length: number = 16): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = upper + lower + digits + symbols;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  // En az 1 büyük, 1 küçük, 1 rakam, 1 sembol garantile
  let password = '';
  password += upper[array[0] % upper.length];
  password += lower[array[1] % lower.length];
  password += digits[array[2] % digits.length];
  password += symbols[array[3] % symbols.length];

  for (let i = 4; i < length; i++) {
    password += all[array[i] % all.length];
  }

  // Shuffle (Fisher-Yates)
  const shuffleArray = new Uint32Array(length);
  crypto.getRandomValues(shuffleArray);
  const arr = password.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = shuffleArray[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.join('');
}

/**
 * Password field'ın yeni parola alanı olup olmadığını kontrol et (Bitwarden yaklaşımı)
 */
function isNewPasswordField(field: HTMLInputElement): boolean {
  // autocomplete="new-password" kontrolü
  if (field.autocomplete === 'new-password') return true;

  // Field adında "new", "confirm", "register", "signup" geçiyor mu?
  const nameId = ((field.name || '') + (field.id || '') + (field.placeholder || '')).toLowerCase();
  if (/new.?pass|confirm.?pass|register|signup|sign.?up|create|kayıt|kayit|tekrar|yeni.?şifre|yeni.?sifre/i.test(nameId)) {
    return true;
  }

  // Form signup formu mu?
  const form = field.closest('form');
  if (form && isSignupForm(form as HTMLFormElement)) return true;

  // Sayfada 2+ password alanı varsa genelde kayıt formudur
  const allPasswords = document.querySelectorAll('input[type="password"]');
  if (allPasswords.length >= 2) return true;

  return false;
}

/**
 * Parola önerisi dropdown'unu göster
 */
function showPasswordGenerator(field: HTMLInputElement) {
  // Zaten açıksa ve aynı field ise kapat
  if (activePasswordGen && activePasswordField === field) {
    closePasswordGenerator();
    return;
  }

  closePasswordGenerator();

  activePasswordField = field;
  const password = generateSecurePassword(18);

  const dropdown = document.createElement('div');
  dropdown.className = 'pm-password-gen';

  dropdown.innerHTML = `
    <div class="pm-password-gen-header">
      <svg viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.23 9.36-7 10.57-3.77-1.21-7-5.74-7-10.57V6.3l7-3.12z"/>
      </svg>
      Güvenli Parola Önerisi
    </div>
    <div class="pm-password-gen-body" data-action="fill">
      <div class="pm-password-gen-value">${password}</div>
      <div class="pm-password-gen-hint">Kullanmak için tıklayın</div>
    </div>
    <div class="pm-password-gen-actions">
      <button class="pm-password-gen-btn" data-action="regenerate">
        <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        Yenile
      </button>
      <button class="pm-password-gen-btn" data-action="copy">
        <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        Kopyala
      </button>
    </div>
  `;

  // Position dropdown
  const rect = field.getBoundingClientRect();
  dropdown.style.left = `${rect.left}px`;
  dropdown.style.top = `${rect.bottom + 4}px`;

  // Ekran sağında taşıyorsa sola kaydır
  if (rect.left + 300 > window.innerWidth) {
    dropdown.style.left = `${window.innerWidth - 310}px`;
  }

  document.body.appendChild(dropdown);
  activePasswordGen = dropdown;

  // Tıklayınca field'a doldur
  dropdown.querySelector('[data-action="fill"]')?.addEventListener('click', () => {
    const pw = dropdown.querySelector('.pm-password-gen-value')?.textContent || '';
    fillPasswordField(field, pw);
    closePasswordGenerator();
  });

  // Yenile butonu
  dropdown.querySelector('[data-action="regenerate"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const newPw = generateSecurePassword(18);
    const valueEl = dropdown.querySelector('.pm-password-gen-value');
    if (valueEl) valueEl.textContent = newPw;
  });

  // Kopyala butonu
  dropdown.querySelector('[data-action="copy"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const pw = dropdown.querySelector('.pm-password-gen-value')?.textContent || '';
    navigator.clipboard.writeText(pw).then(() => {
      const copyBtn = dropdown.querySelector('[data-action="copy"]');
      if (copyBtn) {
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
          Kopyalandı!
        `;
        setTimeout(() => {
          if (copyBtn) {
            copyBtn.innerHTML = `
              <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              Kopyala
            `;
          }
        }, 2000);
      }
    });
  });

  // Document click dışında kapat
  setTimeout(() => {
    document.addEventListener('click', handlePasswordGenOutsideClick);
  }, 100);
}

/**
 * Password field'a değeri doldur (tüm confirm alanlarına da)
 */
function fillPasswordField(field: HTMLInputElement, password: string) {
  // Ana password field'ını doldur
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(field, password);
  } else {
    field.value = password;
  }
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));

  // Aynı formdaki diğer password alanlarını da doldur (şifre tekrar alanı)
  const form = field.closest('form');
  if (form) {
    const allPasswordFields = form.querySelectorAll<HTMLInputElement>('input[type="password"]');
    allPasswordFields.forEach(pw => {
      if (pw !== field) {
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(pw, password);
        } else {
          pw.value = password;
        }
        pw.dispatchEvent(new Event('input', { bubbles: true }));
        pw.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  showToast('Güvenli parola oluşturuldu ve dolduruldu', 'success');
}

function handlePasswordGenOutsideClick(e: MouseEvent) {
  if (activePasswordGen && !activePasswordGen.contains(e.target as Node) &&
    activePasswordField !== e.target) {
    closePasswordGenerator();
  }
}

function closePasswordGenerator() {
  if (activePasswordGen) {
    activePasswordGen.remove();
    activePasswordGen = null;
    activePasswordField = null;
    document.removeEventListener('click', handlePasswordGenOutsideClick);
  }
}

/**
 * Yeni parola alanlarına focus listener ekle (Bitwarden yaklaşımı)
 */
function attachPasswordGenListeners() {
  const passwordFields = document.querySelectorAll<HTMLInputElement>('input[type="password"]');

  passwordFields.forEach(field => {
    if (field.getAttribute('data-pm-gen-attached')) return;
    field.setAttribute('data-pm-gen-attached', 'true');

    // Sadece yeni parola alanlarında göster
    if (isNewPasswordField(field)) {
      field.addEventListener('focus', () => {
        // Küçük bir gecikme ile aç (autofill dropdown ile çakışma önleme)
        setTimeout(() => {
          // Eğer field boşsa veya henüz dolmamışsa öneri göster
          if (!field.value || field.value.length < 4) {
            showPasswordGenerator(field);
          }
        }, 300);
      });
    }
  });
}

/**
 * Kaydetme kontrolü yap ve banner göster
 */
async function handleAutoSaveCheck(username: string, password: string, hostname: string, _isSignup: boolean) {

  // Banner zaten gösteriliyorsa tekrar gösterme
  if (autoSaveBannerShown) {
    return;
  }

  // Extension context kontrolü
  if (!chrome.runtime?.id) {
    return;
  }

  try {
    // Credential kontrolü yap (hem signup hem login için)
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_CREDENTIAL_EXISTS',
      hostname: hostname,
      username: username,
      password: password
    });

    // Excluded site ise hiçbir şey gösterme
    if (response?.excludedSite) {
      return;
    }

    if (response?.success && response.exists) {
      // Kasada var — parola değişmiş mi?
      if (response.passwordChanged && response.passwordId) {
        // Aynı kullanıcı, farklı parola → güncelleme banner'ı
        showAutoSaveBanner(username, password, hostname, 'update', response.passwordId);
      }
      // Aynı kullanıcı, aynı parola → hiçbir şey gösterme
    } else if (response?.success && !response.exists) {
      // Kasada yok → kaydetme banner'ı
      showAutoSaveBanner(username, password, hostname, 'save');
    }
    // success false ise (kasa kilitli vb.) banner gösterme
  } catch (error) {
  }
}

/**
 * Bitwarden-tarzı auto-save banner göster
 */
function showAutoSaveBanner(username: string, password: string, hostname: string, mode: 'save' | 'update' = 'save', passwordId?: string) {
  // Mevcut banner varsa kaldır
  const existing = document.querySelector('.pm-autosave-banner');
  if (existing) existing.remove();

  autoSaveBannerShown = true;

  const banner = document.createElement('div');
  banner.className = 'pm-autosave-banner';

  const displayHost = hostname.replace(/^www\./, '');
  const isUpdate = mode === 'update';

  const bannerTitle = isUpdate ? 'Parola değiştirildi. Güncellemek ister misiniz?' : 'Bu parolayı kaydetmek ister misiniz?';
  const actionBtnText = isUpdate ? 'Güncelle' : 'Kaydet';
  const actionBtnColor = isUpdate ? '#e09f3e' : '#175ddc';

  banner.innerHTML = `
    <button class="pm-autosave-close" title="Kapat">✕</button>
    <div class="pm-autosave-header">
      <svg class="pm-autosave-icon" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.23 9.36-7 10.57-3.77-1.21-7-5.74-7-10.57V6.3l7-3.12zM11 7v2h2V7h-2zm0 4v6h2v-6h-2z"/>
      </svg>
      <div class="pm-autosave-text">
        <div><strong>Parola Yöneticisi</strong></div>
        <div>${bannerTitle}</div>
        ${!isUpdate ? `<input type="text" class="pm-autosave-username-input" value="${username && username !== '-' ? username : ''}" placeholder="Kullanıcı adı veya E-posta" />` : ''}
        <div class="pm-autosave-details">${isUpdate ? `👤 ${username} — ` : ''}${displayHost}</div>
      </div>
    </div>
    <div class="pm-autosave-actions">
      <button class="pm-autosave-btn pm-save" style="background:${actionBtnColor}">${actionBtnText}</button>
      <button class="pm-autosave-btn pm-dismiss">Hayır</button>
      <button class="pm-autosave-btn pm-never" style="background:transparent;color:#c25151;border:1px solid #c25151;font-size:11px">Asla Kaydetme</button>
    </div>
  `;

  document.body.appendChild(banner);

  // Kaydet / Güncelle butonu
  const saveBtn = banner.querySelector('.pm-save');
  saveBtn?.addEventListener('click', async () => {
    const btn = saveBtn as HTMLButtonElement;

    // Inputtan kullanıcı adını oku (sadece save modunda)
    const inputEl = banner.querySelector('.pm-autosave-username-input') as HTMLInputElement;
    const finalUsername = (inputEl ? inputEl.value.trim() : username) || '-';

    btn.disabled = true;
    btn.textContent = isUpdate ? 'Güncelleniyor...' : 'Kaydediliyor...';

    try {
      const messageType = isUpdate ? 'UPDATE_PASSWORD' : 'SAVE_PASSWORD';
      const messageData: Record<string, string> = {
        type: messageType,
        name: displayHost,
        username: finalUsername,
        password: password,
        websiteUrl: `https://${hostname}`
      };

      if (isUpdate && passwordId) {
        messageData.passwordId = passwordId;
      }

      const response = await chrome.runtime.sendMessage(messageData);

      if (response?.success) {
        btn.textContent = isUpdate ? '✓ Güncellendi' : '✓ Kaydedildi';
        btn.style.background = '#51c28a';
        showToast(isUpdate ? 'Parola güncellendi' : 'Parola kasaya kaydedildi', 'success');
        // Pending credential'ları temizle
        chrome.runtime.sendMessage({ type: 'CLEAR_PENDING_CREDENTIALS' }).catch(() => { });
        setTimeout(() => closeAutoSaveBanner(banner), 1500);
      } else {
        btn.textContent = 'Hata!';
        btn.style.background = '#c25151';
        btn.disabled = false;
        showToast(response?.message || (isUpdate ? 'Güncelleme başarısız' : 'Kaydetme başarısız'), 'error');
        setTimeout(() => {
          btn.textContent = actionBtnText;
          btn.style.background = actionBtnColor;
        }, 2000);
      }
    } catch (error) {
      btn.textContent = 'Hata!';
      btn.disabled = false;
      showToast('Bağlantı hatası', 'error');
      setTimeout(() => {
        btn.textContent = actionBtnText;
        btn.style.background = actionBtnColor;
      }, 2000);
    }
  });

  // Hayır butonu
  banner.querySelector('.pm-dismiss')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_PENDING_CREDENTIALS' }).catch(() => { });
    closeAutoSaveBanner(banner);
  });

  // Asla Kaydetme butonu
  banner.querySelector('.pm-never')?.addEventListener('click', async () => {
    try {
      const result = await chrome.storage.local.get(['excludedSites']);
      const excludedSites: string[] = (result.excludedSites as string[]) || [];
      const normalizedHostname = hostname.replace(/^www\./, '');

      if (!excludedSites.includes(normalizedHostname)) {
        excludedSites.push(normalizedHostname);
        await chrome.storage.local.set({ excludedSites });
      }

      showToast(`${normalizedHostname} hariç tutulan sitelere eklendi`, 'success');
      chrome.runtime.sendMessage({ type: 'CLEAR_PENDING_CREDENTIALS' }).catch(() => { });
      closeAutoSaveBanner(banner);
    } catch (err) {
      showToast('Kaydetme hatası', 'error');
    }
  });

  // Kapat butonu
  banner.querySelector('.pm-autosave-close')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_PENDING_CREDENTIALS' }).catch(() => { });
    closeAutoSaveBanner(banner);
  });
}

/**
 * Auto-save banner'ı kapat (animasyonlu)
 */
function closeAutoSaveBanner(banner: HTMLElement) {
  banner.classList.add('pm-closing');
  setTimeout(() => {
    banner.remove();
    autoSaveBannerShown = false;
  }, 300);
}

/**
 * Form submit'ini yakala ve credential bilgilerini background'a gönder
 * Bitwarden yaklaşımı: submit event + buton click + Enter tuşu
 */
function captureFormSubmit(form: HTMLFormElement) {
  if (form.getAttribute('data-pm-submit-attached')) return;
  form.setAttribute('data-pm-submit-attached', 'true');

  // Method 1: Form submit event
  form.addEventListener('submit', () => {
    const creds = extractCredentialsFromForm(form);
    if (creds) submitCredentials(creds.username, creds.password, isSignupForm(form));
  }, { capture: true });

  // Method 2: Submit/login buton click'leri
  const buttons = form.querySelectorAll<HTMLElement>(
    'button, input[type="submit"], input[type="button"], [role="button"]'
  );
  buttons.forEach(btn => {
    if (btn.getAttribute('data-pm-click-attached')) return;
    btn.setAttribute('data-pm-click-attached', 'true');

    const btnText = (btn.textContent || (btn as HTMLInputElement).value || '').toLowerCase();
    const isLoginBtn = /giriş|login|sign.?in|log.?in|oturum|submit|gönder|devam|continue|enter|kayıt|register|sign.?up|oluştur|create/i.test(btnText);

    if (isLoginBtn || btn.getAttribute('type') === 'submit') {
      btn.addEventListener('click', () => {
        setTimeout(() => {
          const creds = extractCredentialsFromForm(form);
          if (creds) submitCredentials(creds.username, creds.password, isSignupForm(form));
        }, 100);
      }, { capture: true });
    }
  });

  // Method 3: Enter tuşu password alanında
  const passwordFields = form.querySelectorAll<HTMLInputElement>('input[type="password"]');
  passwordFields.forEach(pwField => {
    if (pwField.getAttribute('data-pm-keydown-attached')) return;
    pwField.setAttribute('data-pm-keydown-attached', 'true');

    pwField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        setTimeout(() => {
          const creds = extractCredentialsFromForm(form);
          if (creds) submitCredentials(creds.username, creds.password, isSignupForm(form));
        }, 100);
      }
    });
  });
}

/**
 * Formdan username ve password değerlerini çıkar
 */
function extractCredentialsFromForm(form: HTMLFormElement): { username: string; password: string } | null {
  const passwordInputs = form.querySelectorAll<HTMLInputElement>('input[type="password"]');
  if (passwordInputs.length === 0) return null;

  let password = '';
  for (const pwInput of passwordInputs) {
    if (pwInput.value) {
      password = pwInput.value;
      break;
    }
  }
  if (!password) return null;

  let username = '';
  const usernameSelectors = [
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[type="email"]',
    'input[name*="user" i]',
    'input[name*="email" i]',
    'input[name*="login" i]',
    'input[name*="account" i]',
    'input[id*="user" i]',
    'input[id*="email" i]',
    'input[id*="login" i]',
    'input[id*="account" i]',
    'input[type="text"]',
    'input[type="tel"]'
  ];

  for (const selector of usernameSelectors) {
    const inputs = form.querySelectorAll<HTMLInputElement>(selector);
    for (const input of inputs) {
      if (input.value && input.type !== 'password' && !isSearchInput(input)) {
        username = input.value;
        break;
      }
    }
    if (username) break;
  }

  // YENİ: Username ve password aynıysa (gizli fields vb. kaynaklı hata) username'i temizle
  if (username === password) {
    username = '';
  }

  // Sadece parola olsa bile döndür ki kullanıcı input'tan kendi adını yazabilsin
  return { username: username || '', password };
}

/**
 * Sayfadaki tüm password alanlarından credential çıkarmaya çalış (form dışı dahil)
 */
function extractCredentialsFromPage(): { username: string; password: string } | null {
  // Önce form içindekilerden dene
  const forms = document.querySelectorAll<HTMLFormElement>('form');
  for (const form of forms) {
    const creds = extractCredentialsFromForm(form);
    if (creds) return creds;
  }

  // Form yoksa sayfadaki tüm password alanlarından dene
  const allPasswords = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
  for (const pwField of allPasswords) {
    if (!pwField.value) continue;

    const container = pwField.closest('div[class], section, main, body') || document.body;
    const usernameSelectors = [
      'input[autocomplete="username"]',
      'input[autocomplete="email"]',
      'input[type="email"]',
      'input[name*="user" i]',
      'input[name*="email" i]',
      'input[type="text"]',
      'input[type="tel"]'
    ];

    let username = '';
    for (const selector of usernameSelectors) {
      const inputs = container.querySelectorAll<HTMLInputElement>(selector);
      for (const input of inputs) {
        if (input.value && input.type !== 'password' && !isSearchInput(input)) {
          username = input.value;
          break;
        }
      }
      if (username) break;
    }

    if (username === pwField.value) {
      username = '';
    }

    return { username, password: pwField.value };
  }

  return null;
}

/**
 * Credential'ları background'a gönder
 */
function submitCredentials(username: string, password: string, isSignup: boolean) {
  if (!chrome.runtime?.id) {
    return;
  }
  if (!password) {
    return;
  }

  // Mevcut URL'yi kaydet — giriş başarılıysa URL değişir
  const submitUrl = window.location.href;

  chrome.runtime.sendMessage({
    type: 'CREDENTIAL_SUBMITTED',
    username: username,
    password: password,
    hostname: currentHostname,
    isSignup: isSignup
  }).catch(() => { });

  // SPA'lar için: Sayfa yönlendirmezse banner'ı burada da göster
  // Bitwarden yaklaşımı: Login formu hala görünürse giriş başarısız
  setTimeout(() => {
    // Giriş başarısını tespit et:
    // Login formu (password alanı) hala görünürse → başarısız
    // Login formu kaybolmuşsa veya URL değiştiyse → başarılı
    const urlChanged = window.location.href !== submitUrl;
    const passwordFields = document.querySelectorAll<HTMLInputElement>('input[type="password"]');
    const hasVisiblePasswordField = Array.from(passwordFields).some(f => isVisible(f));

    if (urlChanged && !hasVisiblePasswordField) {
      // URL değişti VE login formu yok — kesinlikle başarılı
      handleAutoSaveCheck(username, password, currentHostname, isSignup);
    } else if (!hasVisiblePasswordField) {
      // SPA: URL değişmedi ama form kayboldu — başarılı
      handleAutoSaveCheck(username, password, currentHostname, isSignup);
    } else {
      // Password alanı hala görünür — giriş başarısız
      chrome.runtime.sendMessage({ type: 'CLEAR_PENDING_CREDENTIALS' }).catch(() => { });
    }
  }, 1500);
}

/**
 * Sayfadaki tüm formlara ve butonlara submit listener bağla (Bitwarden yaklaşımı)
 */
function attachFormSubmitListeners() {
  // Form'ları bul ve attach et
  const forms = document.querySelectorAll<HTMLFormElement>('form');

  forms.forEach(form => {
    const hasPassword = form.querySelector('input[type="password"]');
    if (hasPassword) {
      captureFormSubmit(form);
    }
  });

  // Form dışındaki submit butonlarını da yakala (Bitwarden yaklaşımı)
  const allButtons = document.querySelectorAll<HTMLElement>(
    'button, input[type="submit"], input[type="button"], [role="button"]'
  );

  allButtons.forEach(btn => {
    if (btn.getAttribute('data-pm-orphan-click')) return;
    if (btn.closest('form')) return; // Form içindekiler zaten yakalanıyor

    const btnText = (btn.textContent || (btn as HTMLInputElement).value || '').toLowerCase();
    const isLoginBtn = /giriş|login|sign.?in|log.?in|oturum|submit|gönder|devam|continue|kayıt|register|sign.?up|oluştur|create/i.test(btnText);

    if (isLoginBtn) {
      btn.setAttribute('data-pm-orphan-click', 'true');
      btn.addEventListener('click', () => {
        setTimeout(() => {
          const creds = extractCredentialsFromPage();
          if (creds) {
            const isSignup = /kayıt|register|sign.?up|oluştur|create|join/i.test(btnText);
            submitCredentials(creds.username, creds.password, isSignup);
          }
        }, 100);
      }, { capture: true });
    }
  });

  // Password alanlarında Enter tuşu (form dışı)
  document.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach(pwField => {
    if (pwField.getAttribute('data-pm-keydown-attached')) return;
    if (pwField.closest('form')) return;

    pwField.setAttribute('data-pm-keydown-attached', 'true');
    pwField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        setTimeout(() => {
          const creds = extractCredentialsFromPage();
          if (creds) submitCredentials(creds.username, creds.password, false);
        }, 100);
      }
    });
  });
}

// ============================================
// INITIALIZATION
// ============================================
function initialize() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        attachInputListeners();
        attachFormSubmitListeners();
        attachPasswordGenListeners();
      }, 300);
    });
  } else {
    setTimeout(() => {
      attachInputListeners();
      attachFormSubmitListeners();
      attachPasswordGenListeners();
    }, 300);
  }

  // Watch for dynamic content - MutationObserver (Bitwarden yaklaşımı)
  const observer = new MutationObserver(() => {
    attachInputListeners();
    attachFormSubmitListeners();
    attachPasswordGenListeners();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Method 4: beforeunload - sayfa kapanmadan/yönlendirmeden önce credential'ları yakala
  window.addEventListener('beforeunload', () => {
    const creds = extractCredentialsFromPage();
    if (creds && chrome.runtime?.id) {
      const forms = document.querySelectorAll<HTMLFormElement>('form');
      let isSignup = false;
      for (const form of forms) {
        if (form.querySelector('input[type="password"]') && isSignupForm(form)) {
          isSignup = true;
          break;
        }
      }

      chrome.runtime.sendMessage({
        type: 'CREDENTIAL_SUBMITTED',
        username: creds.username,
        password: creds.password,
        hostname: currentHostname,
        isSignup: isSignup
      }).catch(() => { });
    }
  });

  // Web App'ten gelen cache refresh isteklerini yakala ve background'a aktar
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'PM_EXTENSION_REFRESH_CACHE') {
      if (chrome.runtime?.id) {
        chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }).catch(() => { });
      }
    }
  });

  // Notify background about login form
  setTimeout(() => {
    const hasPasswordField = findPasswordFields().length > 0;
    const hasStandaloneUsername = hasStandaloneUsernameField();

    if (hasPasswordField || hasStandaloneUsername) {
      chrome.runtime.sendMessage({
        type: 'LOGIN_FORM_DETECTED',
        hostname: currentHostname,
        isMultiStep: hasStandaloneUsername && !hasPasswordField
      }).catch(() => { });
    }

    // Pending credential var mı kontrol et (sayfa yönlendirmesinden sonra)
    chrome.runtime.sendMessage({ type: 'GET_PENDING_CREDENTIALS' })
      .then((response: any) => {
        if (response?.success && response.hasPending) {
          handleAutoSaveCheck(response.username, response.password, response.hostname, response.isSignup);
        }
      })
      .catch((err: any) => { console.log('[PM-DEBUG] GET_PENDING_CREDENTIALS error:', err); });
  }, 500);
}


initialize();

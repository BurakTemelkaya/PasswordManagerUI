import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router'
import './App.css'
import './styles/pages.css'
import debugCrypto from './helpers/debug'

// Console'da __debugCrypto() çağırabilmek için window'a expose et
if (typeof window !== 'undefined') {
  (window as any).__debugCrypto = debugCrypto;
  console.log('💡 Debug mode: console\'da __debugCrypto() çağırarak state kontrol edebilirsin');
}

import { VaultLockProvider } from './context/VaultLockContext';
import { PasswordProvider } from './context/PasswordContext';

function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <VaultLockProvider>
          <PasswordProvider>
            <AppRouter />
          </PasswordProvider>
        </VaultLockProvider>
      </BrowserRouter>
    </div>
  )
}

export default App

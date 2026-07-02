import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* AuthProvider subscribes to Firebase onAuthStateChanged once and
        provides user/loading/login/logout to the entire React tree */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

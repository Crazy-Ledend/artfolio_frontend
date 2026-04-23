import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import './safari.css'

// Detect iOS for CSS targeting — enables `:global(.ios)` selectors in CSS Modules
// This is needed because @supports (-webkit-touch-callout: none) cannot target
// module-scoped class names from a global stylesheet
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
if (isIOS) {
  document.documentElement.classList.add('ios')
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
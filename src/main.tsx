import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { scan } from 'react-scan'
// Fonts (IBM Plex Sans KR + IBM Plex Mono) load via <link> in index.html.
// Family/stack is defined once in src/styles/tokens.css.
import './index.css'
import App from './App.tsx'

scan({ enabled: import.meta.env.DEV })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

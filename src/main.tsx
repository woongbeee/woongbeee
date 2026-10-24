import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts (Noto Sans KR · Inter · Newsreader · JetBrains Mono) load via <link> in index.html.
// Family/stack is defined once in src/styles/tokens.css.
import './index.css'
import App from './App.tsx'

// react-scan 은 개발 전용 — 동적 import 라서 프로덕션 번들에 포함되지 않는다.
if (import.meta.env.DEV) {
  const { scan } = await import('react-scan')
  scan({ enabled: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

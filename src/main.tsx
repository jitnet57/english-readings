import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

// 이전 프로젝트가 localhost:3000에 남긴 떠도는 Service Worker 제거
// (오래된 캐시가 새 코드를 가리는 문제 방지)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister()
      console.log('[cleanup] Unregistered stale service worker')
    })
  })
  // SW가 만든 캐시도 비움
  if ('caches' in window) {
    caches.keys().then((names) => names.forEach((name) => caches.delete(name)))
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

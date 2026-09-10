import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Plain-path deep links (e.g. https://host/admin/login on static hosting) are
// bridged into the hash router. Storefront links already use hash paths, so
// customer-facing behavior is unchanged.
const { pathname, search } = window.location
if (pathname !== '/' && !window.location.hash) {
  window.history.replaceState(null, '', '/' + search + '#' + pathname)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

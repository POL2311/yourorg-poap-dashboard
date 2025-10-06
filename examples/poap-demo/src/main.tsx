import React from 'react'
import ReactDOM from 'react-dom/client'
import POAPDemoApp from './POAPDemoApp'
import './styles.css'

// Polyfills for Solana wallet adapter
import 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <POAPDemoApp />
  </React.StrictMode>,
)
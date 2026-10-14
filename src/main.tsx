import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// In AI Studio Build iframe environment, HMR WebSocket is disabled.
// Suppress benign WebSocket closure notices from @vite/client.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (msg.includes('WebSocket') || msg.includes('ws://') || msg.includes('wss://')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);

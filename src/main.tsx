import setupLocatorUI from '@locator/runtime';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initPwaAutoCacheBust} from './pwa';

if (import.meta.env.DEV) {
  setupLocatorUI();
}

initPwaAutoCacheBust();

createRoot(document.getElementById('root')!).render(<App />);

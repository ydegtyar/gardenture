import setupLocatorUI from '@locator/runtime';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {prefetchGameScreenAssets} from './app/utils/prefetchGameScreenAssets';
import './index.css';
import {initPwaAutoCacheBust} from './pwa';

if (import.meta.env.DEV) {
  setupLocatorUI();
}

initPwaAutoCacheBust();
void prefetchGameScreenAssets();

createRoot(document.getElementById('root')!).render(<App />);

import * as babel from '@babel/core';
import locatorPkg from '@locator/babel-jsx';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

function locatorPlugin() {
  const plugin = (locatorPkg as any).default || locatorPkg;
  return {
    name: 'vite-plugin-locator',
    enforce: 'pre' as const,
    apply: 'serve' as const,
    transform(code: string, id: string) {
      if (!id.match(/\.[jt]sx$/) || id.includes('node_modules')) {
        return;
      }
      const cleanId = id.split('?')[0];
      const result = babel.transformSync(code, {
        configFile: false,
        babelrc: false,
        filename: cleanId,
        plugins: [plugin],
        parserOpts: {
          plugins: ['jsx', 'typescript'],
        },
        sourceMaps: true,
      });
      if (result?.code) {
        return {
          code: result.code,
          map: result.map,
        };
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      locatorPlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null, // Custom registration handled in src/pwa.ts
        devOptions: {
          enabled: false,
        },
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          clientsClaim: true,
          skipWaiting: true,
        },
        manifest: {
          name: 'Gardenture: Mystic Garden Roguelite',
          short_name: 'Gardenture',
          description: 'Drag to move, let the blade swing itself. A fast-paced 2D pastel botanical survival roguelite — 30 synergy cards, weapon evolutions, DMC-style rank meter, runs under 5 minutes.',
          theme_color: '#18241E',
          background_color: '#18241E',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          lang: 'en',
          scope: '/',
          categories: ['games'],
          screenshots: [
            {
              src: '/og-image.png',
              sizes: '1200x630',
              type: 'image/png',
              label: 'Gardenture: Mystic Garden Roguelite',
            },
          ],
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

import * as babel from '@babel/core';
import locatorPkg from '@locator/babel-jsx';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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

function gamePlatformHtmlPlugin(
  provider: string,
  gameMonetizeId: string,
  gameDistributionId: string,
  noAds: boolean,
  y8GameId: string,
  y8AppId: string
) {
  return {
    name: 'vite-plugin-game-platform-html',
    transformIndexHtml(html: string) {
      if (noAds || provider === 'NONE') {
        // Cleanly strip YouTube SDK script tag for itch.io / no-ads standalone builds
        return html.replace(
          /<!-- Load YouTube Playables SDK FIRST per specification \[F\] -->\s*<script src="https:\/\/www\.youtube\.com\/game_api\/v1"><\/script>/,
          ''
        );
      }
      if (provider === 'Y8') {
        const y8Snippet = `    <!-- Y8 Minimal SDK Integration -->\n    <script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>`;
        if (html.includes('https://www.youtube.com/game_api/v1')) {
          return html.replace(
            /<!-- Load YouTube Playables SDK FIRST per specification \[F\] -->\s*<script src="https:\/\/www\.youtube\.com\/game_api\/v1"><\/script>/,
            y8Snippet
          );
        } else {
          return html.replace('</head>', `${y8Snippet}\n  </head>`);
        }
      }
      if (provider === 'CRAZYGAMES') {
        const cgSnippet = `    <!-- CrazyGames SDK v3 Integration -->\n    <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>`;
        if (html.includes('https://www.youtube.com/game_api/v1')) {
          return html.replace(
            /<!-- Load YouTube Playables SDK FIRST per specification \[F\] -->\s*<script src="https:\/\/www\.youtube\.com\/game_api\/v1"><\/script>/,
            cgSnippet
          );
        } else {
          return html.replace('</head>', `${cgSnippet}\n  </head>`);
        }
      }
      if (provider === 'GAMEDISTRIBUTION') {
        const gdSnippet = `    <!-- GameDistribution HTML5 SDK Integration -->
    <script type="text/javascript">
      window["GD_OPTIONS"] = {
        gameId: "${gameDistributionId}",
        onEvent: function (event) {
          switch (event.name) {
            case "SDK_GAME_START":
              if (typeof window.__gdResume === 'function') window.__gdResume();
              else (window.__gdEventQueue = window.__gdEventQueue || []).push('SDK_GAME_START');
              break;
            case "SDK_GAME_PAUSE":
              if (typeof window.__gdPause === 'function') window.__gdPause();
              else (window.__gdEventQueue = window.__gdEventQueue || []).push('SDK_GAME_PAUSE');
              break;
            case "SDK_REWARDED_WATCH_COMPLETE":
              if (typeof window.__gdRewardedComplete === 'function') window.__gdRewardedComplete();
              else (window.__gdEventQueue = window.__gdEventQueue || []).push('SDK_REWARDED_WATCH_COMPLETE');
              break;
          }
        }
      };
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s);
        js.id = id;
        js.src = 'https://html5.api.gamedistribution.com/main.min.js';
        fjs.parentNode.insertBefore(js, fjs);
      })(document, 'script', 'gamedistribution-jssdk');
    </script>`;

        if (html.includes('https://www.youtube.com/game_api/v1')) {
          html = html.replace(
            /<!-- Load YouTube Playables SDK FIRST per specification \[F\] -->\s*<script src="https:\/\/www\.youtube\.com\/game_api\/v1"><\/script>/,
            gdSnippet
          );
        } else {
          html = html.replace('</head>', `${gdSnippet}\n  </head>`);
        }
        return html;
      }
      if (provider === 'GAMEMONETIZE') {
        const gmSnippet = `    <!-- GameMonetize HTML5 SDK Integration -->
    <script type="text/javascript">
      window.SDK_OPTIONS = {
        gameId: "${gameMonetizeId}",
        onEvent: function (a) {
          switch (a.name) {
            case "SDK_GAME_PAUSE":
              if (typeof window.__gmPause === 'function') window.__gmPause();
              else (window.__gmEventQueue = window.__gmEventQueue || []).push('SDK_GAME_PAUSE');
              break;
            case "SDK_GAME_START":
              if (typeof window.__gmResume === 'function') window.__gmResume();
              else (window.__gmEventQueue = window.__gmEventQueue || []).push('SDK_GAME_START');
              break;
            case "SDK_READY":
              if (typeof window.__gmReady === 'function') window.__gmReady();
              else (window.__gmEventQueue = window.__gmEventQueue || []).push('SDK_READY');
              break;
          }
        },
        pauseGame: function () {
          if (typeof window.__gmPause === 'function') window.__gmPause();
          else (window.__gmEventQueue = window.__gmEventQueue || []).push('SDK_GAME_PAUSE');
        },
        resumeGame: function () {
          if (typeof window.__gmResume === 'function') window.__gmResume();
          else (window.__gmEventQueue = window.__gmEventQueue || []).push('SDK_GAME_START');
        }
      };
      (function (a, b, c) {
        var d = a.getElementsByTagName(b)[0];
        a.getElementById(c) || (a = a.createElement(b), a.id = c, a.src = "https://api.gamemonetize.com/sdk.js", d.parentNode.insertBefore(a, d))
      })(document, "script", "gamemonetize-sdk");
    </script>`;

        // Replace YouTube SDK script when packaging for GameMonetize
        if (html.includes('https://www.youtube.com/game_api/v1')) {
          html = html.replace(
            /<!-- Load YouTube Playables SDK FIRST per specification \[F\] -->\s*<script src="https:\/\/www\.youtube\.com\/game_api\/v1"><\/script>/,
            gmSnippet
          );
        } else {
          html = html.replace('</head>', `${gmSnippet}\n  </head>`);
        }
        return html;
      }
      return html;
    },
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const noAds =
    (process.env.VITE_NO_ADS || env.VITE_NO_ADS || 'false').toLowerCase() === 'true';
  const provider = (
    process.env.VITE_PLATFORM_PROVIDER ||
    env.VITE_PLATFORM_PROVIDER ||
    (noAds ? 'NONE' : 'STUB')
  ).toUpperCase();
  const gameMonetizeId =
    process.env.VITE_GAMEMONETIZE_GAME_ID ||
    env.VITE_GAMEMONETIZE_GAME_ID ||
    'jyg60hwle8o4ch7vh9rn4wnajwztewgj';
  const gameDistributionId =
    process.env.VITE_GAMEDISTRIBUTION_GAME_ID ||
    env.VITE_GAMEDISTRIBUTION_GAME_ID ||
    '';
  const y8GameId =
    process.env.VITE_Y8_GAME_ID ||
    env.VITE_Y8_GAME_ID ||
    '290159';
  const y8AppId =
    process.env.VITE_Y8_APP_ID ||
    env.VITE_Y8_APP_ID ||
    '6ae32a67ba1f868b83779a1f';

  return {
    base: './',
    plugins: [
      locatorPlugin(),
      react(),
      tailwindcss(),
      gamePlatformHtmlPlugin(provider, gameMonetizeId, gameDistributionId, noAds, y8GameId, y8AppId),
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
          start_url: './',
          lang: 'en',
          scope: './',
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

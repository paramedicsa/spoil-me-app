import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Use default pre-bundling behavior (let Vite optimize dependencies)
      server: {
        port: 3002,
        host: '0.0.0.0',
      },
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          strategies: 'injectManifest',
          srcDir: 'src',
          filename: 'service-worker.js',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
          injectManifest: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
          },
          manifest: {
            name: 'Spoil Me Vintage',
            short_name: 'Spoil Me',
            description: 'Exclusive vintage jewelry and fashion marketplace',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            background_color: '#000000',
            theme_color: '#000000',
            icons: [
              { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png', purpose: 'any maskable' },
              { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png', purpose: 'any maskable' },
              { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any maskable' },
              { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any maskable' },
              { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
              { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
            ]
          }
        })
      ],
      // Do NOT expose GEMINI API keys to the client bundle. Use a server-side proxy (Edge Function) and set
      // VITE_GEMINI_PROXY_URL to point to your deployed proxy, e.g. https://<project>.functions.supabase.co/gemini-proxy
      define: {
        'process.env.GEMINI_PROXY_URL': JSON.stringify(env.VITE_GEMINI_PROXY_URL || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@repo': path.resolve(__dirname, 'repo')
        }
      }
    };
});

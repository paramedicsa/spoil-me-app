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
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
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
              { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
              { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@repo': path.resolve(__dirname, 'repo')
        }
      }
    };
});

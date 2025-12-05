import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/prompts': {
            target: 'https://cdn.jsdelivr.net',
            changeOrigin: true,
            rewrite: (path) => '/gh/glidea/banana-prompt-quicker@main/prompts.json',
            secure: true,
          },
        },
      },
      plugins: [
        preact(),
        tailwindcss(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['kuai.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
          devOptions: {
            enabled: true
          },
          manifest: {
            name: 'nbnb',
            short_name: 'nbnb',
            description: 'NB Nano Banana在线客户端',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        }),
      ],
      define: {
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          'react': 'preact/compat',
          'react-dom/test-utils': 'preact/test-utils',
          'react-dom': 'preact/compat',     // Must be below test-utils
          'react/jsx-runtime': 'preact/jsx-runtime'
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'google-genai': ['@google/genai'],
              'markdown-libs': ['react-markdown', 'remark-gfm']
            }
          }
        }
      }
    };
});

import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/ha-api': {
        target: 'http://192.168.1.13',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ha-api/, ''),
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    // Same-origin proxy so the PC preview can reach HA without CORS
    proxy: {
      '/ha-api': {
        target: 'http://192.168.1.13',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ha-api/, ''),
      },
    },
  },
  build: {
    // Android 6 WebView ≈ Chrome 50–60: keep syntax old enough
    target: 'es2015',
    cssTarget: 'chrome50',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Thư Ký — Smart Home',
        short_name: 'Thư Ký',
        description: 'Điều khiển nhà thông minh bằng giọng nói tiếng Việt',
        theme_color: '#0B1220',
        background_color: '#0B1220',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
});

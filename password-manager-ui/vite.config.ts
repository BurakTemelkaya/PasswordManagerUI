import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Extension build mi?
  const isExtensionBuild = mode === 'extension';
  
  // Web sitesi için basit config
  if (!isExtensionBuild) {
    return {
      plugins: [react()],
      base: '/',
      publicDir: 'public',
      build: {
        outDir: 'dist',
        copyPublicDir: true,
      }
    };
  }
  
  // Extension için multi-entry config
  return {
    plugins: [react()],
    base: './',
    publicDir: 'public-extension',
    worker: {
      format: 'es',
    },
    build: {
      copyPublicDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          popup: resolve(__dirname, 'popup.html'),
          background: resolve(__dirname, 'src/background.ts'),
          content: resolve(__dirname, 'src/content.ts'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          dir: 'dist-extension'
        }
      },
      outDir: 'dist-extension',
    }
  };
})

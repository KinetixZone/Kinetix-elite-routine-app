import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom']
          }
        }
      }
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
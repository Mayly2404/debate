import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        host: path.resolve(__dirname, 'host.html'),
        ungho: path.resolve(__dirname, 'ungho.html'),
        phandoi: path.resolve(__dirname, 'phandoi.html'),
        user: path.resolve(__dirname, 'user.html')
      }
    }
  }
});

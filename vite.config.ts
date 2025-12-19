import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/proxy/erp': {
          target: 'https://erp.ecopak.ca',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy\/erp/, ''),
        }
      }
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

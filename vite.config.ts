import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Generate version from build date (YYYY.MM.DD)
const buildDate = new Date();
const version = `${buildDate.getFullYear()}.${String(buildDate.getMonth() + 1).padStart(2, '0')}.${String(buildDate.getDate()).padStart(2, '0')}`;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
});

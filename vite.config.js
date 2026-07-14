import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Chebs-Human-Atlas/',
  plugins: [react()],
  build: {
    // MapLibre is intentionally isolated behind the lazy-loaded Country screen.
    // Keep warnings useful for unexpected growth while allowing that known chunk.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'react-vendor';
          if (id.includes('/data/countries.json')) return 'country-data';
        },
      },
    },
  },
});

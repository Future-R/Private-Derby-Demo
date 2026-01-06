import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Sets the base path for assets. './' works best for generic GitHub Pages deployments
  // where the repo name is the subdirectory.
  base: './',
});
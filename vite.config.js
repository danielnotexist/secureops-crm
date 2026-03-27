import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/manage/',
  base: '/manage/',
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/RULA_REBA/', // IMPORTANT: Replace 'RULA_REBA' with your GitHub repository name if different
})

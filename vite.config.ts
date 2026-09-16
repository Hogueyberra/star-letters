import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const githubRepo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = githubRepo ? `/${githubRepo}/` : '/'

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    host: '0.0.0.0',
    port: 4545,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4545,
    strictPort: true,
  },
})

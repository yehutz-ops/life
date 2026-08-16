import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { aiServerPlugin, emailServerPlugin } from './server/vitePlugin'

export default defineConfig(({ mode }) => {
  // loadEnv reads .env.local (and friends) into a plain object for use here in
  // the Node config context only — it is NOT exposed to the client bundle,
  // unlike import.meta.env which only ever sees VITE_-prefixed variables.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      aiServerPlugin(env.ANTHROPIC_API_KEY ?? ''),
      emailServerPlugin({ user: env.GMAIL_USER, appPassword: env.GMAIL_APP_PASSWORD }),
    ],
    server: {
      port: 5173,
      strictPort: true,
    },
  }
})

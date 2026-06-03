import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiDevPlugin } from './vite.apiDevPlugin'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  const plugins = [apiDevPlugin(), react(), tailwindcss()].flat() as Plugin[]
  try {
    // @ts-expect-error optional local plugin
    const m = await import('./.vite-source-tags.js')
    plugins.push(...m.sourceTags())
  } catch {
    /* optional */
  }
  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  }
})

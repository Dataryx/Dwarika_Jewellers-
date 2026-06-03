import path from 'node:path'
import { existsSync, renameSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiDevPlugin } from './vite.apiDevPlugin'
import { adminSpaFallback } from './vite.admin.shared'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function flattenAdminBuild(): Plugin {
  return {
    name: 'flatten-admin-build',
    closeBundle() {
      const outDir = path.join(__dirname, 'dist-admin')
      const nestedHtml = path.join(outDir, 'admin', 'index.html')
      const rootHtml = path.join(outDir, 'index.html')
      if (existsSync(nestedHtml)) {
        renameSync(nestedHtml, rootHtml)
        rmSync(path.join(outDir, 'admin'), { recursive: true, force: true })
      }
    },
  }
}

export default defineConfig(async ({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  if (!process.env.VITE_STOREFRONT_URL) {
    process.env.VITE_STOREFRONT_URL = 'http://localhost:5173'
  }
  // Dev: admin Vite server serves /api locally. Production build sets VITE_API_URL to the store/API host.
  if (!process.env.VITE_API_URL) {
    process.env.VITE_API_URL = mode === 'production' ? (process.env.VITE_STOREFRONT_URL || '') : ''
  }

  const plugins = [adminSpaFallback('/admin/index.html'), flattenAdminBuild(), apiDevPlugin(), react(), tailwindcss()].flat() as Plugin[]
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
    root: __dirname,
    publicDir: path.join(__dirname, 'public'),
    build: {
      outDir: path.join(__dirname, 'dist-admin'),
      emptyOutDir: true,
      rollupOptions: {
        input: path.join(__dirname, 'admin/index.html'),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      open: false,
    },
    preview: {
      port: 5174,
      strictPort: true,
    },
  }
})

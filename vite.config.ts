import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const API_ROUTES = new Set(['products', 'orders', 'cart', 'settings', 'banner', 'admin-auth', 'customers', 'categories', 'our-story', 'about', 'contact', 'contact-info', 'live-prices'])

function createResAdapter(res: ServerResponse) {
  return {
    setHeader(name: string, value: string | number | readonly string[]) {
      res.setHeader(name, value)
    },
    status(code: number) {
      res.statusCode = code
      return {
        json(data: unknown) {
          if (!res.headersSent) res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        },
        end(body?: string) {
          res.end(body ?? '')
        },
      }
    },
  }
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return undefined
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk as Buffer))
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return undefined
  const ct = req.headers['content-type'] || ''
  if (ct.includes('application/json')) {
    try {
      return JSON.parse(raw) as unknown
    } catch {
      return undefined
    }
  }
  return raw
}

/** Serves `api/*.js` Vercel handlers during `vite` so `/api/*` works on localhost */
function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-vercel-handlers',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url
        if (!url?.startsWith('/api/')) {
          next()
          return
        }

        const pathname = url.split('?')[0] ?? ''
        const parts = pathname.split('/').filter(Boolean)
        if (parts.length < 2 || parts[0] !== 'api') {
          next()
          return
        }

        const segment = parts[1]
        if (!segment || !API_ROUTES.has(segment) || parts.length > 2) {
          next()
          return
        }

        const search = url.includes('?') ? url.slice(url.indexOf('?')) : ''
        const query = Object.fromEntries(new URLSearchParams(search))

        let body: unknown
        try {
          body = await readJsonBody(req)
        } catch {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Invalid request body' }))
          return
        }

        const reqLike = {
          method: req.method || 'GET',
          headers: req.headers,
          query,
          body,
        }

        const resLike = createResAdapter(res as ServerResponse)

        try {
          const mod = await import(pathToFileURL(path.join(__dirname, 'api', `${segment}.js`)).href)
          const handler = mod.default as (req: typeof reqLike, res: typeof resLike) => void | Promise<void>
          await handler(reqLike, resLike)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'API error'
          if (!(res as ServerResponse).headersSent) {
            ;(res as ServerResponse).statusCode = 500
            ;(res as ServerResponse).setHeader('Content-Type', 'application/json')
            ;(res as ServerResponse).end(JSON.stringify({ error: msg }))
          }
          return
        }

        if (!(res as ServerResponse).headersSent) {
          next()
        }
      })
    },
  }
}

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

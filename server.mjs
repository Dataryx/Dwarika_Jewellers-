import { createReadStream } from 'node:fs'
import { stat, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import apiHandler from './api/handler.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const storefrontDir = path.join(root, 'dist')
const adminDir = path.join(root, 'dist-admin')
const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '127.0.0.1'
const configuredAdminHost = process.env.ADMIN_HOST?.toLowerCase()

function isAdminHost(requestHost) {
  const hostname = requestHost.split(':')[0].toLowerCase()
  return configuredAdminHost ? hostname === configuredAdminHost : hostname.startsWith('admin.')
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  }
  return contentTypes[extension] || 'application/octet-stream'
}

function getRequestBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return Promise.resolve(undefined)
  }

  return new Promise((resolve, reject) => {
    const chunks = []
    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    request.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) {
        resolve(undefined)
        return
      }

      const contentType = request.headers['content-type'] || ''
      if (contentType.includes('application/json') || raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
        try {
          resolve(JSON.parse(raw))
        } catch {
          reject(new Error('Invalid JSON request body'))
        }
        return
      }
      resolve(raw)
    })
    request.on('error', reject)
  })
}

function createApiResponse(response) {
  return {
    setHeader(name, value) {
      response.setHeader(name, value)
    },
    status(code) {
      response.statusCode = code
      return {
        json(data) {
          if (!response.headersSent) response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(data))
        },
        end(body = '') {
          response.end(body)
        },
      }
    },
  }
}

async function serveStatic(response, directory, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname
  const candidate = path.resolve(directory, `.${requestedPath}`)
  if (candidate !== directory && !candidate.startsWith(`${directory}${path.sep}`)) {
    response.writeHead(400)
    response.end('Bad request')
    return
  }

  try {
    const info = await stat(candidate)
    if (!info.isFile()) throw new Error('Not a file')
    response.writeHead(200, {
      'Content-Type': contentTypeFor(candidate),
      'Cache-Control': candidate.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    })
    createReadStream(candidate).pipe(response)
  } catch {
    const index = await readFile(path.join(directory, 'index.html'))
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    })
    response.end(index)
  }
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  const pathname = decodeURIComponent(requestUrl.pathname)

  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (pathname.startsWith('/api/')) {
    response.setHeader('Cache-Control', 'no-store')
    try {
      const body = await getRequestBody(request)
      const req = {
        method: request.method || 'GET',
        headers: request.headers,
        query: Object.fromEntries(requestUrl.searchParams),
        body,
        url: request.url,
      }
      await apiHandler(req, createApiResponse(response))
    } catch (error) {
      console.error('API request failed:', error)
      if (!response.headersSent) {
        response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid request' }))
      }
    }
    return
  }

  const directory = isAdminHost(request.headers.host || '') ? adminDir : storefrontDir
  await serveStatic(response, directory, pathname)
})

server.listen(port, host, () => {
  console.log(`Dwarika server listening on http://${host}:${port}`)
})

function shutdown() {
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

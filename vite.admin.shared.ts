import type { Plugin } from 'vite';

/** SPA fallback for admin routes in dev and preview */
export function adminSpaFallback(entry = '/index.html'): Plugin {
  return {
    name: 'admin-spa-fallback',
    configureServer(server) {
      server.middlewares.use(createFallbackMiddleware(entry));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createFallbackMiddleware(entry));
    },
  };
}

function createFallbackMiddleware(entry: string) {
  return (req: { url?: string }, _res: unknown, next: () => void) => {
    const url = req.url?.split('?')[0] ?? '';
    if (
      url.startsWith('/api') ||
      url.startsWith('/@') ||
      url.startsWith('/src') ||
      url.startsWith('/node_modules') ||
      url.startsWith('/assets') ||
      url.startsWith('/admin/assets') ||
      url.includes('.')
    ) {
      next();
      return;
    }
    req.url = entry;
    next();
  };
}

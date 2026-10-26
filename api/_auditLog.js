import { getClientIp } from './_security.js';

/**
 * Append-only admin audit trail (forensics / large-scale ops).
 * Never store passwords or full tokens.
 */
export async function writeAuditLog(db, entry) {
  if (!db) return;
  try {
    const col = db.collection('audit_logs');
    await col.insertOne({
      at: new Date(),
      action: String(entry.action || 'unknown').slice(0, 120),
      actor: String(entry.actor || 'unknown').slice(0, 200),
      ip: String(entry.ip || 'unknown').slice(0, 64),
      method: String(entry.method || '').slice(0, 12),
      path: String(entry.path || '').slice(0, 300),
      meta: entry.meta && typeof entry.meta === 'object' ? entry.meta : {},
      ok: entry.ok !== false,
    });
  } catch (err) {
    console.error('[audit] failed to write log:', err instanceof Error ? err.message : err);
  }
}

export async function auditAdmin(db, req, caller, action, meta = {}, ok = true) {
  return writeAuditLog(db, {
    action,
    actor: caller?.email || 'unknown',
    ip: getClientIp(req),
    method: req.method,
    path: req.url || '',
    meta,
    ok,
  });
}

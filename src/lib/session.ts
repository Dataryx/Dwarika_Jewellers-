const SESSION_KEY = 'dwarika_session_id';

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function resetSession(): void {
  const oldId = localStorage.getItem(SESSION_KEY);
  if (oldId) {
    fetch('/api/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-Session-Id': oldId },
      body: JSON.stringify({ clear_all: true }),
    }).catch(() => {});
  }
  localStorage.removeItem(SESSION_KEY);
}

export function cartHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Session-Id': getSessionId(),
  };
}

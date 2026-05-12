export function printMongoAuthHint(err) {
  const code = err?.code;
  const msg = String(err?.message || err || '');
  if (code !== 13 && !/auth required/i.test(msg) && err?.codeName !== 'Unauthorized') return false;

  console.error(`
MongoDB authentication failed (auth required).

Fix one of these in .env:

  1) Put your Atlas database user in the URI (password must be URL-encoded if it has special chars):
     MONGODB_URI=mongodb://MYUSER:MYPASSWORD@your-host/Dwarika?ssl=true&authSource=admin

  2) Or keep the host-only URI and add:
     MONGODB_USER=MYUSER
     MONGODB_PASSWORD=MYPASSWORD

Create a user under Atlas → Database Access (not the Atlas UI login).
Prefer Atlas → Connect → Drivers and copy the "mongodb://" or "mongodb+srv://" string for your cluster.
`);
  return true;
}

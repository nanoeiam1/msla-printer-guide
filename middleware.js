// Login gate for the whole site. Vercel runs this before serving any file,
// so index.html is never sent to someone who has not signed in.
//
// Set these in Vercel → Project → Settings → Environment Variables:
//   SITE_USERNAME  the username people sign in with
//   SITE_PASSWORD  the password
// Changing either one signs everybody out.

export const config = { matcher: '/:path*' };

const COOKIE = 'msla_session';
const SESSION_DAYS = 7;

export default async function middleware(request) {
  const username = process.env.SITE_USERNAME;
  const password = process.env.SITE_PASSWORD;
  if (!username || !password) {
    return new Response('Login is not configured. Set SITE_USERNAME and SITE_PASSWORD in Vercel.', {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const url = new URL(request.url);
  const key = await signingKey(`${username}\n${password}`);

  if (url.pathname === '/logout') {
    return redirect('/login', clearCookie());
  }

  if (url.pathname === '/login' && request.method === 'POST') {
    const form = await request.formData();
    const next = safeNext(form.get('next'));
    const userOk = await sameText(String(form.get('username') ?? ''), username);
    const passOk = await sameText(String(form.get('password') ?? ''), password);
    if (!(userOk && passOk)) {
      // Slow down guessing.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return loginPage({ next, error: true, status: 401 });
    }
    const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    const token = `${expires}.${await sign(key, String(expires))}`;
    const cookie = `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS * 24 * 60 * 60}; HttpOnly; Secure; SameSite=Lax`;
    return redirect(next, cookie);
  }

  const signedIn = await validSession(key, readCookie(request, COOKIE));

  if (url.pathname === '/login') {
    return signedIn ? redirect(safeNext(url.searchParams.get('next'))) : loginPage({ next: safeNext(url.searchParams.get('next')) });
  }

  if (signedIn) return; // carry on and serve the requested file

  const next = url.pathname === '/' ? '' : `?next=${encodeURIComponent(url.pathname + url.search)}`;
  return redirect(`/login${next}`);
}

// ---------- sessions ----------

async function signingKey(secret) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sign(key, value) {
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return toHex(mac);
}

async function validSession(key, token) {
  if (!token) return false;
  const [expires, mac] = token.split('.');
  if (!expires || !mac || !(Number(expires) > Date.now())) return false;
  return sameText(mac, await sign(key, expires));
}

// Compares two strings without leaking, through timing, how much of them matched.
async function sameText(a, b) {
  const [ha, hb] = await Promise.all(
    [a, b].map((s) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then((d) => new Uint8Array(d)))
  );
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function clearCookie() {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

// Only allow redirects back to a page on this site.
function safeNext(value) {
  const s = typeof value === 'string' ? value : '';
  return s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/\\') ? s : '/';
}

function redirect(location, cookie) {
  const headers = { location, 'cache-control': 'no-store' };
  if (cookie) headers['set-cookie'] = cookie;
  return new Response(null, { status: 303, headers });
}

// ---------- login page ----------

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function loginPage({ next = '/', error = false, status = 200 }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Sign in · mSLA printer guide</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #f2f3f5;
  --surface: #ffffff;
  --ink: #1c2530;
  --ink-soft: #4a5562;
  --rule: #d5d9df;
  --uv: #5536cc;
  --uv-tint: #ece8fb;
  --on-uv: #ffffff;
  --danger-ink: #a61b12;
  --danger-bg: #fde9e7;
  --danger-edge: #d9483b;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14181d;
    --surface: #1c2229;
    --ink: #e6e9ed;
    --ink-soft: #a9b2bd;
    --rule: #323b46;
    --uv: #ab97ff;
    --uv-tint: #262040;
    --on-uv: #14181d;
    --danger-ink: #ff9184;
    --danger-bg: #351a18;
    --danger-edge: #c4463a;
    color-scheme: dark;
  }
}
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: var(--bg);
  color: var(--ink);
  font-family: "Atkinson Hyperlegible Next", "Atkinson Hyperlegible", "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
  font-size: 1.0625rem;
  line-height: 1.5;
}
.card {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 14px;
  padding: 32px 28px 28px;
}
.wedge { display: grid; grid-template-columns: repeat(9, 1fr); height: 10px; border-radius: 3px; overflow: hidden; border: 1px solid var(--rule); margin-bottom: 24px; }
.wedge span:nth-child(1) { background: #ffffff; } .wedge span:nth-child(2) { background: #e0e0e0; } .wedge span:nth-child(3) { background: #c0c0c0; }
.wedge span:nth-child(4) { background: #a0a0a0; } .wedge span:nth-child(5) { background: #808080; } .wedge span:nth-child(6) { background: #606060; }
.wedge span:nth-child(7) { background: #404040; } .wedge span:nth-child(8) { background: #202020; } .wedge span:nth-child(9) { background: #000000; }
h1 { font-size: 1.6rem; line-height: 1.15; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 6px; }
p.lede { color: var(--ink-soft); margin: 0 0 24px; }
label { display: block; font-weight: 600; margin: 0 0 6px; }
input {
  display: block;
  width: 100%;
  font: inherit;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 11px 12px;
  margin: 0 0 18px;
}
input:focus { outline: 3px solid var(--uv); outline-offset: 1px; border-color: var(--uv); }
button {
  width: 100%;
  font: inherit;
  font-weight: 600;
  color: var(--on-uv);
  background: var(--uv);
  border: 0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 4px;
  cursor: pointer;
}
button:hover { filter: brightness(1.08); }
button:focus-visible { outline: 3px solid var(--uv); outline-offset: 3px; }
.error {
  background: var(--danger-bg);
  color: var(--danger-ink);
  border-left: 4px solid var(--danger-edge);
  border-radius: 6px;
  padding: 10px 12px;
  margin: 0 0 20px;
  font-size: 0.95rem;
}
</style>
</head>
<body>
<main class="card">
  <div class="wedge" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
  <h1>Grayscale mSLA printer guide</h1>
  <p class="lede">Sign in to read the setup and operating guide.</p>
  ${error ? '<p class="error" role="alert">That username or password is not right. Try again.</p>' : ''}
  <form method="post" action="/login">
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    <label for="username">Username</label>
    <input id="username" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required ${error ? '' : 'autofocus'}>
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required ${error ? 'autofocus' : ''}>
    <button type="submit">Sign in</button>
  </form>
</main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

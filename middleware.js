// The site is paused: Vercel runs this before serving any file and answers
// every request with a "temporarily unavailable" page instead of the guide.
// To bring the site back, delete this file and commit.

export const config = { matcher: '/:path*' };

export default function middleware() {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Temporarily unavailable</title>
<style>
:root { --bg: #f2f3f5; --ink: #1c2530; --ink-soft: #4a5562; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root { --bg: #14181d; --ink: #e6e9ed; --ink-soft: #a9b2bd; color-scheme: dark; } }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px; background: var(--bg); color: var(--ink);
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; text-align: center; }
h1 { font-size: 1.5rem; margin: 0 0 8px; }
p { color: var(--ink-soft); margin: 0; }
</style>
</head>
<body>
<main>
  <h1>This site is temporarily unavailable</h1>
  <p>Please check back later.</p>
</main>
</body>
</html>`,
    {
      status: 503,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '86400' },
    }
  );
}

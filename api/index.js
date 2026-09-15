const TARGET_HOST = 'pwthor.live';
const NEW_LOGO_URL = 'https://raw.githubusercontent.com/meoponly/deadpool-image/main/free.png';
const CHANNEL_HANDLE = '@FreeW_Official';
const CHANNEL_URL = 'https://t.me/FreeW_Official';
const ADMIN_HANDLE = '@meoponly';
const ADMIN_URL = 'https://t.me/meoponly';

export default async function handler(req, res) {
  const path = req.url || '/';

  // Redirect logo requests directly
  if (path === '/logo.png' || path.endsWith('/logo.png')) {
    res.writeHead(302, { Location: NEW_LOGO_URL });
    return res.end();
  }

  const targetUrl = `https://${TARGET_HOST}${path}`;

  // Real browser headers to pass through all Cloudflare checks
  const headers = {
    'Host': TARGET_HOST,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': req.headers['accept'] || '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': `https://${TARGET_HOST}/`,
    'Origin': `https://${TARGET_HOST}`
  };

  if (req.headers['cookie']) {
    headers['cookie'] = req.headers['cookie'];
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: headers,
      redirect: 'follow'
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    // Handle HTML & Next.js Streaming responses
    if (
      contentType.includes('text/html') ||
      contentType.includes('application/json') ||
      contentType.includes('text/plain') ||
      contentType.includes('text/x-component')
    ) {
      let text = await response.text();

      // Replace Branding, Telegram links & Owner info
      text = text
        .replace(/PW\s*~?\s*THOR/gi, 'FreeW')
        .replace(/PWTHOR/gi, 'FreeW')
        .replace(/pwthorxiityatra/gi, 'FreeW_Official')
        .replace(/pw_thor/gi, 'FreeW_Official')
        .replace(/@pwthor\b/gi, CHANNEL_HANDLE)
        .replace(/https?:\/\/t\.me\/pw_?thor\b/gi, CHANNEL_URL)
        .replace(/https?:\/\/t\.me\/pwthorxiityatra\b/gi, CHANNEL_URL)
        .replace(/(?:Owner|Developer|Admin)\s*[:\-]?\s*@[A-Za-z0-9_]+/gi, (m) => m.replace(/@[A-Za-z0-9_]+$/, ADMIN_HANDLE));

      // Inject Favicon and custom CSS
      if (contentType.includes('text/html')) {
        const injectedStyles = `
          <link rel="icon" type="image/png" href="${NEW_LOGO_URL}" />
          <style>
            /* Hide oversized hero logo on /contact */
            body:has(a[href*="/contact"]) main img[src*="logo.png"],
            body:has(a[href*="/contact"]) main img[src*="free.png"],
            body:has(a[href*="/contact"]) main img[alt*="PW THOR"],
            body:has(a[href*="/contact"]) main img[alt*="FreeW"] {
              display: none !important;
            }
            aside img {
              display: block !important;
              max-width: 100% !important;
              object-fit: contain !important;
            }
          </style>
        `;
        text = text.replace('</head>', `${injectedStyles}</head>`);
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(response.status).send(text);
    }

    // Binary / Static Assets (Images, fonts, CSS, JS)
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(response.status).send(buffer);

  } catch (error) {
    return res.status(502).send('Error loading page: ' + error.message);
  }
}

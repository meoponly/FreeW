const TARGET_HOST = 'stream.studyratna.cc';
const NEW_LOGO_URL = 'https://raw.githubusercontent.com/meoponly/deadpool-image/main/free.png';
const CHANNEL_HANDLE = '@FreeW_Official';
const CHANNEL_URL = 'https://t.me/FreeW_Official';
const ADMIN_HANDLE = '@meoponly';
const ADMIN_URL = 'https://t.me/meoponly';

export default async function handler(req, res) {
  const path = req.url || '/';

  // 1. Direct Favicon / Logo Redirects
  if (path === '/favicon.ico' || path === '/logo.png' || path.endsWith('/logo.png')) {
    res.writeHead(302, { Location: NEW_LOGO_URL });
    return res.end();
  }

  const targetUrl = `https://${TARGET_HOST}${path}`;

  // 2. Prepare headers
  const forwardHeaders = {
    'Host': TARGET_HOST,
    'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': req.headers['accept'] || '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': `https://${TARGET_HOST}/`,
    'Origin': `https://${TARGET_HOST}`
  };

  if (req.headers['cookie']) {
    forwardHeaders['cookie'] = req.headers['cookie'];
  }
  if (req.headers['content-type']) {
    forwardHeaders['content-type'] = req.headers['content-type'];
  }

  // 3. Collect POST/PUT request body safely
  let reqBody = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
      reqBody = req.body;
    } else if (req.body && typeof req.body === 'object') {
      reqBody = JSON.stringify(req.body);
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: reqBody,
      redirect: 'follow'
    });

    const contentType = response.headers.get('content-type') || '';

    // 4. Transform HTML documents
    if (contentType.includes('text/html')) {
      let html = await response.text();

      // Brand & Handle text replacements
      html = html
        .replace(/StudyRatna(?:\.cc)?/gi, 'FreeW')
        .replace(/studyratna/gi, 'freew')
        .replace(/STUDY\s*RATNA/gi, 'FreeW')
        .replace(/Ratna\s*Bhai/gi, 'meoponly')
        .replace(/mee_ratna/gi, 'meoponly')
        .replace(/https?:\/\/t\.me\/mee_ratna/gi, ADMIN_URL)
        .replace(/https?:\/\/t\.me\/\+detG3qtCyHs3M2Rl/gi, CHANNEL_URL)
        .replace(/https?:\/\/t\.me\/[a-zA-Z0-9_+]+/gi, CHANNEL_URL);

      // Inject full design fixes, Base URL (for fonts/icons/css), and logo styles
      const customHead = `
        <base href="https://${TARGET_HOST}/">
        <link rel="icon" type="image/png" href="${NEW_LOGO_URL}">
        <title>FreeW - Free Education For Everyone</title>
        <style>
          /* Full dark theme & responsive UI fix */
          body { min-height: 100vh; background-color: #0d1117 !important; color: #c9d1d9 !important; }
          
          /* Replace all logos & center neon poster with FreeW logo */
          img[src*="logo"],
          img[src*="favicon"],
          img[src*="study"],
          img[src*="ratna"],
          img.logo,
          .modal img,
          .swal2-image,
          .card img {
            content: url("${NEW_LOGO_URL}") !important;
            object-fit: contain !important;
            max-height: 160px !important;
          }

          /* Keep header small logo crisp */
          header img, nav img, .navbar-brand img {
            max-height: 40px !important;
          }
        </style>
      `;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${customHead}`);
      } else {
        html = customHead + html;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(response.status).send(html);
    }

    // 5. Transform API JSON / Batch Data
    if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      let text = await response.text();
      text = text
        .replace(/StudyRatna(?:\.cc)?/gi, 'FreeW')
        .replace(/studyratna/gi, 'freew')
        .replace(/STUDY\s*RATNA/gi, 'FreeW');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(response.status).send(text);
    }

    // 6. Pass-through CSS, JS, Fonts, and Media streams cleanly
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(response.status).send(buffer);

  } catch (error) {
    return res.status(502).send('Error connecting to service: ' + error.message);
  }
}

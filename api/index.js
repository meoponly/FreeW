const TARGET_HOST = 'stream.studyratna.cc';
const NEW_LOGO_URL = 'https://raw.githubusercontent.com/meoponly/deadpool-image/main/free.png';
const CHANNEL_HANDLE = '@FreeW_Official';
const CHANNEL_URL = 'https://t.me/FreeW_Official';
const ADMIN_HANDLE = '@meoponly';
const ADMIN_URL = 'https://t.me/meoponly';

export default async function handler(req, res) {
  const path = req.url || '/';

  // Redirect logo/favicon requests
  if (path === '/logo.png' || path === '/favicon.ico' || path.endsWith('/logo.png')) {
    res.writeHead(302, { Location: NEW_LOGO_URL });
    return res.end();
  }

  const targetUrl = `https://${TARGET_HOST}${path}`;

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

    // Rewrite HTML content
    if (contentType.includes('text/html')) {
      let text = await response.text();

      // Replace All Branding & Handles
      text = text
        .replace(/StudyRatna(?:\.cc)?/gi, 'FreeW')
        .replace(/studyratna/gi, 'freew')
        .replace(/STUDY\s*RATNA/gi, 'FreeW')
        .replace(/Ratna\s*Bhai/gi, 'meoponly')
        .replace(/mee_ratna/gi, 'meoponly')
        .replace(/https?:\/\/t\.me\/mee_ratna/gi, ADMIN_URL)
        .replace(/https?:\/\/t\.me\/\+detG3qtCyHs3M2Rl/gi, CHANNEL_URL)
        .replace(/https?:\/\/t\.me\/[a-zA-Z0-9_+]+/gi, CHANNEL_URL);

      // Inject Base URL (Fixes CSS/JS/Fonts loading) + Logo and Poster replacement
      const injectedStyles = `
        <base href="https://${TARGET_HOST}/">
        <link rel="icon" type="image/png" href="${NEW_LOGO_URL}" />
        <title>FreeW - Free Education For Everyone</title>
        <style>
          /* Replace All Logos, Nav Icons, and Center Neon StudyRatna Posters */
          img[src*="logo"],
          img[src*="favicon"],
          img[src*="study"],
          img[src*="ratna"],
          img[alt*="Study"],
          img[alt*="Ratna"],
          .modal img,
          .card img {
            content: url("${NEW_LOGO_URL}") !important;
            object-fit: contain !important;
            max-height: 180px !important;
          }
        </style>
      `;

      text = text.replace('<head>', `<head>${injectedStyles}`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(response.status).send(text);
    }

    // Pass through all other requests (JSON, API, etc.)
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(response.status).send(buffer);

  } catch (error) {
    return res.status(502).send('Error loading page: ' + error.message);
  }
}

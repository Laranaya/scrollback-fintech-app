import http from 'node:http';
import { URL } from 'node:url';

const ledger = {
  account: {
    id: 'acc_main_user',
    balance: 250.0,
    currency: 'GBP',
  },
  spaces: {
    vault: {
      id: 'spc_vault_locked',
      name: 'ScrollBack Vault',
      balance: 0.0,
    },
    futureMe: {
      id: 'spc_future_me',
      name: 'Future Me Savings',
      balance: 0.0,
    },
  },
};

const allowedOrigins = new Set(['http://localhost:5173', 'http://localhost:3000']);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : '*';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

async function handleGithubVerification(username) {
  const githubUrl = `https://api.github.com/users/${encodeURIComponent(username)}/events/public`;

  try {
    const response = await fetch(githubUrl, {
      headers: {
        'User-Agent': 'ScrollBack-BaaS',
        Accept: 'application/vnd.github+json',
      },
    });

    const data = await response.json().catch(() => []);
    const events = Array.isArray(data) ? data : [];
    const verified = events.some((event) => {
      const type = event?.type;
      return type === 'PushEvent' || type === 'PullRequestEvent';
    });

    return { username, verified };
  } catch (error) {
    return { username, verified: false };
  }
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, 'http://localhost:4000');

  if (req.method === 'GET' && requestUrl.pathname === '/api/engine/account') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(ledger));
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/engine/webhook') {
    try {
      const payload = await readJsonBody(req);
      const { type } = payload;

      if (type === 'screen_time') {
        ledger.account.balance -= 2;
        ledger.spaces.vault.balance += 2;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'SUCCESS', event: 'SCREENTIME_LOCK', ledger }));
        return;
      }

      if (type === 'goal_complete') {
        const releaseAmount = Math.min(1, ledger.spaces.vault.balance);
        ledger.spaces.vault.balance -= releaseAmount;
        ledger.account.balance += releaseAmount;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'SUCCESS', event: 'GOAL_RELEASE', ledger }));
        return;
      }

      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ERROR', message: 'Unsupported webhook type' }));
      return;
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ERROR', message: 'Invalid JSON payload' }));
      return;
    }
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/verify-github') {
    const username = requestUrl.searchParams.get('username') || 'octocat';
    const verification = await handleGithubVerification(username);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(verification));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ERROR', message: 'Not found' }));
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Mock Starling Engine BaaS backend running on http://localhost:${PORT}`);
});

process.env.NODE_ENV = 'test';
process.env.DATA_DIR = 'memory://';
process.env.SEED_DEMO = 'true';
process.env.JWT_SECRET = 'test-secret-for-bookswap';
process.env.ADMIN_LOGIN = 'admin';
process.env.ADMIN_PASSWORD = 'admin-change-me';
process.env.MODERATOR_LOGIN = 'moderator';
process.env.MODERATOR_PASSWORD = 'moderator-change-me';
process.env.PUBLIC_SITE_URL = 'http://localhost:5173';

import { once } from 'node:events';

export async function startTestServer() {
  const { bootstrapDatabase } = await import('../bootstrap.js');
  const { createApp } = await import('../app.js');
  const { closeDatabase } = await import('../db/index.js');

  await bootstrapDatabase({ seed: true });
  const app = await createApp({ serveFrontend: false });
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  const request = async (path, { method = 'GET', token, body, headers = {} } = {}) => {
    const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: response.status, data, headers: response.headers };
  };

  return {
    request,
    port,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await closeDatabase();
    }
  };
}

export async function loginAs(request, email = 'anna@bookswap.local', password = 'demo12345') {
  const result = await request('/auth/login', { method: 'POST', body: { email, password } });
  if (result.status !== 200) throw new Error(`login failed: ${JSON.stringify(result.data)}`);
  return result.data;
}

export async function loginStaff(request, role = 'admin') {
  const credentials = role === 'admin'
    ? { email: 'admin', password: 'admin-change-me' }
    : { email: 'moderator', password: 'moderator-change-me' };
  const result = await request('/auth/login', { method: 'POST', body: credentials });
  if (result.status !== 200) throw new Error(`staff login failed: ${JSON.stringify(result.data)}`);
  return result.data;
}

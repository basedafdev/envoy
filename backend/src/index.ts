import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://frontend:5173'],
  credentials: true,
}));

app.get('/', (c) => c.json({ status: 'ok', service: 'envoy-backend' }));
app.get('/health', (c) => c.json({ status: 'healthy', timestamp: new Date().toISOString() }));

const port = parseInt(process.env.PORT || '3000');

console.log(`Backend starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};

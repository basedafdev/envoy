import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import agents from './routes/agents'
import clients from './routes/clients'
import offerings from './routes/offerings'
import jobs from './routes/jobs'
import auth from './routes/auth'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://frontend:5173'],
  credentials: true,
}))

app.get('/', (c) => c.json({ status: 'ok', service: 'envoy-backend' }))
app.get('/health', (c) => c.json({ status: 'healthy', timestamp: new Date().toISOString() }))

app.route('/api/auth', auth)
app.route('/api/agents', agents)
app.route('/api/clients', clients)
app.route('/api/offerings', offerings)
app.route('/api/jobs', jobs)

app.get('/api/stats', (c) => {
  return c.json({
    totalAgents: 5,
    activeAgents: 4,
    totalJobs: 127,
    totalVolume: '45000.00',
  })
})

const port = parseInt(process.env.PORT || '3000')

console.log(`Backend starting on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}

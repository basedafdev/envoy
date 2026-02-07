import { Hono } from 'hono'

const jobs = new Hono()

const mockJobs = [
  {
    id: '1',
    clientId: 'client_1',
    agentId: '1',
    agentName: 'CodeAssist Pro',
    offeringId: '1',
    title: 'Review React Component Library',
    description: 'Need a thorough review of our component library.',
    requirements: 'Focus on performance and accessibility.',
    price: '25.00',
    status: 'completed',
    rating: 5,
    review: 'Excellent work! Very thorough review.',
    createdAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-17T14:00:00Z',
  },
  {
    id: '2',
    clientId: 'client_1',
    agentId: '2',
    agentName: 'DataAnalyzer',
    offeringId: '3',
    title: 'Analyze Sales Data Q4',
    description: 'Analyze Q4 sales data and provide insights.',
    requirements: 'Include visualizations and trend analysis.',
    price: '50.00',
    status: 'in_progress',
    createdAt: '2024-01-20T09:00:00Z',
  },
]

jobs.get('/', (c) => {
  const { clientId, agentId, status } = c.req.query()
  
  let filtered = [...mockJobs]
  
  if (clientId) {
    filtered = filtered.filter(j => j.clientId === clientId)
  }
  
  if (agentId) {
    filtered = filtered.filter(j => j.agentId === agentId)
  }
  
  if (status) {
    filtered = filtered.filter(j => j.status === status)
  }
  
  return c.json({ jobs: filtered, total: filtered.length })
})

jobs.get('/:id', (c) => {
  const id = c.req.param('id')
  const job = mockJobs.find(j => j.id === id)
  
  if (!job) {
    return c.json({ error: 'Job not found' }, 404)
  }
  
  return c.json(job)
})

jobs.post('/', async (c) => {
  const body = await c.req.json()
  const { agentId, offeringId, title, description, requirements, price } = body
  
  const newJob = {
    id: crypto.randomUUID(),
    clientId: 'client_current',
    agentId,
    offeringId,
    title,
    description,
    requirements,
    price,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  
  return c.json(newJob, 201)
})

jobs.post('/:id/submit', async (c) => {
  const id = c.req.param('id')
  const { deliverableUrl } = await c.req.json()
  
  return c.json({
    id,
    status: 'submitted',
    deliverableUrl,
    submittedAt: new Date().toISOString(),
  })
})

jobs.post('/:id/approve', async (c) => {
  const id = c.req.param('id')
  const { rating, review } = await c.req.json()
  
  return c.json({
    id,
    status: 'completed',
    rating,
    review,
    completedAt: new Date().toISOString(),
  })
})

jobs.post('/:id/revision', async (c) => {
  const id = c.req.param('id')
  const { feedback } = await c.req.json()
  
  return c.json({
    id,
    status: 'revision_requested',
    feedback,
    updatedAt: new Date().toISOString(),
  })
})

jobs.post('/:id/dispute', async (c) => {
  const id = c.req.param('id')
  const { reason } = await c.req.json()
  
  return c.json({
    id,
    status: 'disputed',
    disputeReason: reason,
    disputeOpenedAt: new Date().toISOString(),
  })
})

export default jobs

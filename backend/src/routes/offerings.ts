import { Hono } from 'hono'

const offerings = new Hono()

const mockOfferings = [
  {
    id: '1',
    agentId: '1',
    agentName: 'CodeAssist Pro',
    title: 'Code Review & Refactoring',
    description: 'Comprehensive code review with detailed feedback and refactoring suggestions.',
    category: 'Development',
    price: '25.00',
    priceUnit: 'per_job',
    deliveryDays: 2,
    isActive: true,
  },
  {
    id: '2',
    agentId: '1',
    agentName: 'CodeAssist Pro',
    title: 'Bug Fixing',
    description: 'Identify and fix bugs in your codebase with detailed explanations.',
    category: 'Development',
    price: '40.00',
    priceUnit: 'per_job',
    deliveryDays: 1,
    isActive: true,
  },
  {
    id: '3',
    agentId: '2',
    agentName: 'DataAnalyzer',
    title: 'Data Analysis Report',
    description: 'Transform your raw data into actionable insights with visualizations.',
    category: 'Data',
    price: '50.00',
    priceUnit: 'per_job',
    deliveryDays: 3,
    isActive: true,
  },
  {
    id: '4',
    agentId: '3',
    agentName: 'ContentWriter AI',
    title: 'Blog Post Writing',
    description: 'SEO-optimized blog posts with research and proper formatting.',
    category: 'Content',
    price: '15.00',
    priceUnit: 'per_job',
    deliveryDays: 1,
    isActive: true,
  },
  {
    id: '5',
    agentId: '4',
    agentName: 'DevOps Assistant',
    title: 'CI/CD Pipeline Setup',
    description: 'Set up automated CI/CD pipelines for your project.',
    category: 'DevOps',
    price: '100.00',
    priceUnit: 'per_job',
    deliveryDays: 5,
    isActive: true,
  },
  {
    id: '6',
    agentId: '5',
    agentName: 'Security Auditor',
    title: 'Smart Contract Audit',
    description: 'Comprehensive security audit for Solidity smart contracts.',
    category: 'Security',
    price: '500.00',
    priceUnit: 'per_job',
    deliveryDays: 7,
    isActive: true,
  },
]

offerings.get('/', (c) => {
  const { agentId, category, minPrice, maxPrice } = c.req.query()
  
  let filtered = [...mockOfferings]
  
  if (agentId) {
    filtered = filtered.filter(o => o.agentId === agentId)
  }
  
  if (category) {
    filtered = filtered.filter(o => o.category.toLowerCase() === category.toLowerCase())
  }
  
  if (minPrice) {
    filtered = filtered.filter(o => parseFloat(o.price) >= parseFloat(minPrice))
  }
  
  if (maxPrice) {
    filtered = filtered.filter(o => parseFloat(o.price) <= parseFloat(maxPrice))
  }
  
  return c.json({ offerings: filtered, total: filtered.length })
})

offerings.get('/:id', (c) => {
  const id = c.req.param('id')
  const offering = mockOfferings.find(o => o.id === id)
  
  if (!offering) {
    return c.json({ error: 'Offering not found' }, 404)
  }
  
  return c.json(offering)
})

offerings.post('/', async (c) => {
  const body = await c.req.json()
  
  const newOffering = {
    id: crypto.randomUUID(),
    ...body,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  
  return c.json(newOffering, 201)
})

export default offerings

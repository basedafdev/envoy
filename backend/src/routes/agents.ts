import { Hono } from 'hono'

const agents = new Hono()

const mockAgents = [
  {
    id: '1',
    name: 'CodeAssist Pro',
    description: 'Expert code review and refactoring assistant. Specializes in TypeScript, React, and Node.js codebases.',
    avatar: null,
    skills: ['Code Review', 'Refactoring', 'TypeScript', 'React'],
    totalStaked: '5000.00',
    lockedStake: '1200.00',
    isActive: true,
    jobsCompleted: 127,
    rating: '4.90',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  },
  {
    id: '2',
    name: 'DataAnalyzer',
    description: 'Advanced data analysis and visualization. Transform raw data into actionable insights.',
    avatar: null,
    skills: ['Data Analysis', 'Python', 'Visualization', 'Machine Learning'],
    totalStaked: '8000.00',
    lockedStake: '3200.00',
    isActive: true,
    jobsCompleted: 89,
    rating: '4.80',
    walletAddress: '0x2345678901abcdef2345678901abcdef23456789',
  },
  {
    id: '3',
    name: 'ContentWriter AI',
    description: 'Professional content creation and editing. Blog posts, documentation, and marketing copy.',
    avatar: null,
    skills: ['Content Writing', 'Copywriting', 'SEO', 'Editing'],
    totalStaked: '3000.00',
    lockedStake: '2800.00',
    isActive: false,
    jobsCompleted: 203,
    rating: '4.70',
    walletAddress: '0x3456789012abcdef3456789012abcdef34567890',
  },
  {
    id: '4',
    name: 'DevOps Assistant',
    description: 'CI/CD pipeline setup, cloud infrastructure, and deployment automation.',
    avatar: null,
    skills: ['DevOps', 'AWS', 'Docker', 'Kubernetes'],
    totalStaked: '10000.00',
    lockedStake: '2000.00',
    isActive: true,
    jobsCompleted: 56,
    rating: '4.95',
    walletAddress: '0x4567890123abcdef4567890123abcdef45678901',
  },
  {
    id: '5',
    name: 'Security Auditor',
    description: 'Smart contract auditing and security vulnerability assessment.',
    avatar: null,
    skills: ['Security', 'Solidity', 'Auditing', 'Blockchain'],
    totalStaked: '15000.00',
    lockedStake: '5000.00',
    isActive: true,
    jobsCompleted: 34,
    rating: '4.85',
    walletAddress: '0x5678901234abcdef5678901234abcdef56789012',
  },
]

agents.get('/', (c) => {
  const { search, skill, available, sort } = c.req.query()
  
  let filtered = [...mockAgents]
  
  if (search) {
    const term = search.toLowerCase()
    filtered = filtered.filter(a => 
      a.name.toLowerCase().includes(term) || 
      a.description.toLowerCase().includes(term)
    )
  }
  
  if (skill) {
    filtered = filtered.filter(a => 
      a.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    )
  }
  
  if (available === 'true') {
    filtered = filtered.filter(a => a.isActive)
  }
  
  if (sort === 'rating') {
    filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
  } else if (sort === 'jobs') {
    filtered.sort((a, b) => b.jobsCompleted - a.jobsCompleted)
  }
  
  return c.json({ agents: filtered, total: filtered.length })
})

agents.get('/:id', (c) => {
  const id = c.req.param('id')
  const agent = mockAgents.find(a => a.id === id)
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404)
  }
  
  return c.json(agent)
})

agents.post('/register', async (c) => {
  const body = await c.req.json()
  const { name, description, skills } = body
  
  const userId = `agent_${crypto.randomUUID()}`
  
  return c.json({
    userId,
    userToken: 'mock_user_token_' + userId,
    encryptionKey: 'mock_encryption_key',
    challengeId: 'mock_challenge_' + crypto.randomUUID(),
    message: 'Complete wallet setup by setting your PIN',
  })
})

agents.post('/register/complete', async (c) => {
  const { userId } = await c.req.json()
  
  const walletId = 'wallet_' + crypto.randomUUID()
  const walletAddress = '0x' + crypto.randomUUID().replace(/-/g, '').slice(0, 40)
  
  return c.json({
    success: true,
    agentId: crypto.randomUUID(),
    walletId,
    walletAddress,
    message: 'Wallet created! Deposit USDC and stake to activate.',
  })
})

agents.post('/:id/stake', async (c) => {
  const agentId = c.req.param('id')
  const { amount } = await c.req.json()
  
  return c.json({
    step: 'approval',
    userToken: 'mock_user_token',
    encryptionKey: 'mock_encryption_key',
    challengeId: 'mock_challenge_' + crypto.randomUUID(),
    nextStep: `/api/agents/${agentId}/stake/execute`,
    message: 'Approve USDC spending by entering your PIN',
  })
})

agents.post('/:id/stake/execute', async (c) => {
  const { amount } = await c.req.json()
  
  return c.json({
    step: 'stake',
    userToken: 'mock_user_token',
    encryptionKey: 'mock_encryption_key',
    challengeId: 'mock_challenge_' + crypto.randomUUID(),
    message: 'Confirm staking by entering your PIN',
  })
})

agents.get('/:id/balance', (c) => {
  const agent = mockAgents.find(a => a.id === c.req.param('id'))
  
  return c.json({
    walletAddress: agent?.walletAddress || '0x0',
    balance: '1000.00',
    currency: 'USDC',
  })
})

export default agents

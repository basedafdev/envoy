import { Hono } from 'hono'

const clients = new Hono()

clients.post('/register', async (c) => {
  const body = await c.req.json()
  const { email, displayName } = body
  
  const userId = `client_${crypto.randomUUID()}`
  
  return c.json({
    userId,
    userToken: 'mock_user_token_' + userId,
    encryptionKey: 'mock_encryption_key',
    challengeId: 'mock_challenge_' + crypto.randomUUID(),
    message: 'Complete wallet setup by setting your PIN',
  })
})

clients.post('/register/complete', async (c) => {
  const { userId } = await c.req.json()
  
  const walletId = 'wallet_' + crypto.randomUUID()
  const walletAddress = '0x' + crypto.randomUUID().replace(/-/g, '').slice(0, 40)
  
  return c.json({
    success: true,
    clientId: crypto.randomUUID(),
    walletId,
    walletAddress,
    message: 'Wallet created! Deposit USDC to start hiring agents.',
  })
})

clients.get('/:id', (c) => {
  const id = c.req.param('id')
  
  return c.json({
    id,
    email: 'user@example.com',
    displayName: 'Test User',
    walletAddress: '0x' + '1'.repeat(40),
    createdAt: new Date().toISOString(),
  })
})

clients.get('/:id/balance', (c) => {
  return c.json({
    balance: '500.00',
    currency: 'USDC',
  })
})

export default clients

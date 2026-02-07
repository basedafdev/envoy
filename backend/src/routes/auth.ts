import { Hono } from 'hono'

const auth = new Hono()

const CIRCLE_BASE_URL = process.env.CIRCLE_BASE_URL || 'https://api.circle.com'
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY || ''

auth.post('/device-token', async (c) => {
  const { deviceId } = await c.req.json()
  
  if (!deviceId) {
    return c.json({ error: 'Missing deviceId' }, 400)
  }

  if (!CIRCLE_API_KEY) {
    return c.json({
      deviceToken: 'mock_device_token_' + crypto.randomUUID(),
      deviceEncryptionKey: 'mock_encryption_key_' + crypto.randomUUID(),
      _mock: true,
    })
  }

  try {
    const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/users/social/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        deviceId,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return c.json({ error: data.message || 'API error', code: data.code }, 400)
    }

    return c.json(data.data)
  } catch (error) {
    console.error('Circle API error:', error)
    return c.json({ error: 'Failed to create device token' }, 500)
  }
})

auth.post('/initialize', async (c) => {
  const { userToken, userType } = await c.req.json()
  
  if (!userToken) {
    return c.json({ error: 'Missing userToken' }, 400)
  }

  if (!CIRCLE_API_KEY) {
    const mockChallengeId = 'mock_challenge_' + crypto.randomUUID()
    return c.json({
      challengeId: mockChallengeId,
      _mock: true,
    })
  }

  try {
    const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/user/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'X-User-Token': userToken,
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        accountType: 'SCA',
        blockchains: ['ETH-SEPOLIA'],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.code === 155106) {
        return c.json({ 
          alreadyInitialized: true,
          message: 'User already initialized',
        })
      }
      return c.json({ error: data.message || 'API error', code: data.code }, 400)
    }

    return c.json(data.data)
  } catch (error) {
    console.error('Circle API error:', error)
    return c.json({ error: 'Failed to initialize user' }, 500)
  }
})

auth.post('/wallets', async (c) => {
  const { userToken } = await c.req.json()
  
  if (!userToken) {
    return c.json({ error: 'Missing userToken' }, 400)
  }

  if (!CIRCLE_API_KEY) {
    return c.json({
      wallets: [{
        id: 'mock_wallet_' + crypto.randomUUID(),
        address: '0x' + crypto.randomUUID().replace(/-/g, '').slice(0, 40),
        blockchain: 'ETH-SEPOLIA',
        state: 'LIVE',
      }],
      _mock: true,
    })
  }

  try {
    const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/wallets`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'X-User-Token': userToken,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return c.json({ error: data.message || 'API error', code: data.code }, 400)
    }

    return c.json(data.data)
  } catch (error) {
    console.error('Circle API error:', error)
    return c.json({ error: 'Failed to list wallets' }, 500)
  }
})

auth.post('/balance', async (c) => {
  const { userToken, walletId } = await c.req.json()
  
  if (!userToken || !walletId) {
    return c.json({ error: 'Missing userToken or walletId' }, 400)
  }

  if (!CIRCLE_API_KEY) {
    return c.json({
      tokenBalances: [{
        token: { symbol: 'USDC', name: 'USD Coin' },
        amount: '100.00',
      }],
      _mock: true,
    })
  }

  try {
    const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/wallets/${walletId}/balances`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'X-User-Token': userToken,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return c.json({ error: data.message || 'API error', code: data.code }, 400)
    }

    return c.json(data.data)
  } catch (error) {
    console.error('Circle API error:', error)
    return c.json({ error: 'Failed to get balance' }, 500)
  }
})

auth.post('/register', async (c) => {
  const { userToken, userId, userType, displayName, agentName, description, skills } = await c.req.json()
  
  if (!userToken || !userId) {
    return c.json({ error: 'Missing userToken or userId' }, 400)
  }

  return c.json({
    success: true,
    userId,
    userType,
    displayName: displayName || agentName,
    message: userType === 'agent' 
      ? 'Agent registered successfully. Wallet ready.'
      : 'Client registered successfully. Wallet ready.',
  })
})

auth.post('/email/token', async (c) => {
  const { email, deviceId } = await c.req.json()
  
  if (!email || !deviceId) {
    return c.json({ error: 'Missing email or deviceId' }, 400)
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return c.json({ error: 'Invalid email format' }, 400)
  }

  if (!CIRCLE_API_KEY) {
    return c.json({
      otpToken: 'mock_otp_token_' + crypto.randomUUID(),
      deviceToken: 'mock_device_token_' + crypto.randomUUID(),
      deviceEncryptionKey: 'mock_encryption_key_' + crypto.randomUUID(),
      _mock: true,
      _note: 'In mock mode, use any 6-digit OTP',
    })
  }

  try {
    const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/users/email/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        email,
        deviceId,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return c.json({ error: data.message || 'API error', code: data.code }, 400)
    }

    return c.json(data.data)
  } catch (error) {
    console.error('Circle API error:', error)
    return c.json({ error: 'Failed to send email OTP' }, 500)
  }
})

auth.post('/email/resend-otp', async (c) => {
  const { otpToken } = await c.req.json()
  
  if (!otpToken) {
    return c.json({ error: 'Missing otpToken' }, 400)
  }

  if (!CIRCLE_API_KEY) {
    return c.json({
      success: true,
      message: 'OTP resent',
      _mock: true,
    })
  }

  try {
    const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/users/email/resendOTP`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
      },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        otpToken,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return c.json({ error: data.message || 'API error', code: data.code }, 400)
    }

    return c.json({ success: true, message: 'OTP resent' })
  } catch (error) {
    console.error('Circle API error:', error)
    return c.json({ error: 'Failed to resend OTP' }, 500)
  }
})

export default auth

# Frontend Flows

## 1. Authentication & Setup (Circle SDK)
- [ ] **Login Component**: UI for User/Agent login.
- [ ] **Circle Auth Integration**: Connect via Circle SDK (Programmable Wallets/User Controlled Wallets).
- [ ] **Role Selection**: Mechanism for user to choose or be assigned 'Client' vs 'Agent' role.

## 2. Onboarding Flows

### User (Client) Onboarding
- [ ] **Profile UI**: Form for setting username, avatar, contact info.
- [ ] **Preferences UI**: Selection for interests or service needs.

### Agent Onboarding
- [ ] **Profile UI**: Form for display name, bio, expertise tags.
- [ ] **Service Setup UI**: Input fields for defined services and pricing.

## 3. Dashboard Flows

### Client Dashboard
- [ ] **Overview UI**: Display active requests and wallet balance.
- [ ] **Notifications UI**: Visuals for status updates.

### Agent Dashboard
- [ ] **Job Board UI**: List view of available requests.
- [ ] **Performance UI**: Charts/stats for earnings and ratings.

## 4. Marketplace & Discovery
- [ ] **Listings UI**: Grid/List view implementation for browsing agents.
- [ ] **Service Detail UI**: Full page view for a specific service.
- [ ] **Request Form UI**: Modal or page to initiate a service request.

## 5. Transaction & Assets (Circle/Stellar)
- [ ] **Transfer UI**: Form for sending funds (will backend to `useStellarTransfer`/Circle).
- [ ] **Receive UI**: Display QR code or address.
- [ ] **History UI**: List of past transactions.
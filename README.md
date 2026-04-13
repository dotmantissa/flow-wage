# Flow | WAGE

Stream wages. Withdraw anytime.

Flow | WAGE is a PayFi protocol on HashKey Chain Testnet that replaces monthly payroll batches with continuous per-second salary streams.

Live demo target: https://flow-wage.vercel.app

## Network

- Network Name: HashKey Chain Testnet
- RPC Endpoint: https://testnet.hsk.xyz
- Chain ID: 133
- Native Token: HSK
- Explorer: https://testnet-explorer.hsk.xyz

## Architecture

```
Employer Wallet
    |
    | deployVault / createStream / pause / cancel
    v
FlowWageFactory -----> StreamVault (per employer, CREATE2)
    |                       |
    | registry lookup       | streams, accounting, withdrawal rights
    v                       v
PayrollRegistry        Worker Wallet (withdraw anytime)
    |
    | KYC + token whitelist
    v
WithdrawalGateway ---> HSP Gateway (optional payout routing)
```

## Repository Structure

```
foundry_contracts/
  src/
  script/
  test/
src/
  components/
  hooks/
  lib/
  pages/
  providers/
  store/
public/demo/
```

## Smart Contracts

- PayrollRegistry: employer registration, KYC state, token whitelist
- FlowWageFactory: one deterministic CREATE2 vault per employer
- StreamVault: per-second streaming, pause/resume/top-up/cancel/withdraw
- WithdrawalGateway: cooldown + daily limits + optional HSP routing
- MockUSDT: 6-decimal USDT-like token for testnet/demo
- MockHSPGateway: transfer settlement simulation and FX state

## Prerequisites

- Node.js >= 20
- npm >= 10
- Foundry (forge/cast)
- MetaMask configured for HashKey Chain Testnet

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template:

```bash
cp .env.example .env
```

3. Start dev server:

```bash
npm run dev
```

4. Production build check:

```bash
npm run build
```

## Contract Deployment

1. Configure deploy env:

```bash
DEPLOYER_PRIVATE_KEY=<your-private-key>
ADMIN_ADDRESS=<cast wallet address --private-key $DEPLOYER_PRIVATE_KEY>
```

2. Build and deploy:

```bash
cd foundry_contracts
forge build
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://testnet.hsk.xyz \
  --broadcast \
  --chain-id 133 \
  -vvvv
```

3. Copy printed addresses into root `.env`:

```bash
VITE_RPC_URL
VITE_CHAIN_ID
VITE_REGISTRY_ADDRESS
VITE_FACTORY_ADDRESS
VITE_GATEWAY_ADDRESS
VITE_USDT_ADDRESS
VITE_HSP_ADDRESS
```

## Frontend Environment Variables

Set these in local `.env` and Vercel project settings:

- VITE_RPC_URL
- VITE_CHAIN_ID
- VITE_REGISTRY_ADDRESS
- VITE_FACTORY_ADDRESS
- VITE_GATEWAY_ADDRESS
- VITE_USDT_ADDRESS
- VITE_HSP_ADDRESS

Never expose `DEPLOYER_PRIVATE_KEY` as a `VITE_` variable.

### Current HashKey Testnet Deployment

Use these values in local `.env` and Vercel environment variables:

- VITE_RPC_URL=https://testnet.hsk.xyz
- VITE_CHAIN_ID=133
- VITE_REGISTRY_ADDRESS=0x57e6b27a646d41e8cdc61202fb337414c75502ae
- VITE_FACTORY_ADDRESS=0x815cb601bee4f382ad395348fddb242dc5b64c72
- VITE_GATEWAY_ADDRESS=0x5be45ef6963dc3d09363d35c0ad720c2b5acfc18
- VITE_USDT_ADDRESS=0xce03acacedf9eac818175f2092ff88529d9ce47d
- VITE_HSP_ADDRESS=0x72f1af5be4c54c083c5f94b987691dd65f5d2a87

## Vercel Deployment

1. Push repository to GitHub
2. Import project in Vercel
3. Framework preset: Vite
4. Add all required `VITE_` env vars
5. Deploy

`vercel.json` includes rewrite rules for SPA refresh safety.

## User Flows

Employer:
- Connect wallet
- Deploy vault (once)
- Approve USDT
- Create stream
- Pause/resume/cancel streams

Worker:
- Connect wallet
- Load vault
- Observe live claimable balance
- Withdraw all anytime

New User:
- Connect wallet
- KYC status shown on onboarding page

Demo Mode:
- No wallet required
- Open animated static simulation in `public/demo/index.html`

## Security Summary

- Role-separated admin controls (`PROTOCOL_ADMIN`, `KYC_MANAGER`, `PAUSER`)
- Deterministic vault deployment via CREATE2
- CEI pattern and reentrancy guards on token movements
- Stream cancellation split is deterministic and auditable
- Daily withdrawal limits and cooldown in gateway

## Troubleshooting

1. MetaMask not connecting:
- Ensure extension is unlocked and site permissions are enabled.

2. Wrong network screen persists:
- Switch to chain ID `133` and re-open dApp.

3. Missing contract banner visible:
- Check `.env` values are set and not zero address.

4. Stream creation fails with whitelist error:
- Confirm token is whitelisted in `PayrollRegistry`.

5. Stream creation fails with KYC error:
- Confirm employee status is `Approved`.

6. Withdraw disabled:
- Wait for claimable amount to become non-zero.

7. Vault not found for employer:
- Deploy via factory and wait for confirmation.

8. Build fails on PostCSS config:
- Keep ESM `export default` format in config files.

9. Foundry command missing:
- Install Foundry and ensure `forge`/`cast` are in PATH.

10. Explorer links open but tx missing:
- Confirm tx was broadcast to HashKey Testnet and wallet had gas.

11. Vercel route refresh gives 404:
- Ensure rewrite rule to `index.html` is present in `vercel.json`.

## Hackathon Context

Flow | WAGE demonstrates how real-time payroll improves liquidity for workers, lowers payroll ops overhead for employers, and adds programmable controls for PayFi settlement rails on HashKey Chain.

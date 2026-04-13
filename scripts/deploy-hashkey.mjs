import fs from 'node:fs'
import path from 'node:path'
import solc from 'solc'
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseUnits,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const root = process.cwd()
const contractsRoot = path.join(root, 'foundry_contracts')

const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet.hsk.xyz'] } },
  blockExplorers: { default: { name: 'HashKey Explorer', url: 'https://testnet-explorer.hsk.xyz' } },
  testnet: true,
})

const ENTRY = [
  'foundry_contracts/src/PayrollRegistry.sol',
  'foundry_contracts/src/FlowWageFactory.sol',
  'foundry_contracts/src/WithdrawalGateway.sol',
  'foundry_contracts/src/mocks/MockUSDT.sol',
  'foundry_contracts/src/mocks/MockHSPGateway.sol',
]

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function resolveImport(importPath) {
  if (importPath.startsWith('@openzeppelin/contracts/')) {
    const rel = importPath.replace('@openzeppelin/contracts/', '')
    return path.join(contractsRoot, 'lib', 'openzeppelin-contracts', 'contracts', rel)
  }
  if (importPath.startsWith('forge-std/')) {
    const rel = importPath.replace('forge-std/', '')
    return path.join(contractsRoot, 'lib', 'forge-std', 'src', rel)
  }

  const candidates = [
    path.join(contractsRoot, importPath),
    path.join(contractsRoot, 'src', importPath),
    path.join(contractsRoot, 'script', importPath),
  ]

  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }

  return null
}

function findImports(importPath) {
  const resolved = resolveImport(importPath)
  if (!resolved) {
    return { error: `Import not found: ${importPath}` }
  }
  return { contents: readUtf8(resolved) }
}

function compileAll() {
  const sources = {}

  const walk = (dirPath) => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const full = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.isFile() && entry.name.endsWith('.sol')) {
        const key = path.relative(root, full).split(path.sep).join('/')
        sources[key] = { content: readUtf8(full) }
      }
    }
  }

  walk(path.join(contractsRoot, 'src'))

  for (const file of ENTRY) {
    if (!sources[file]) {
      throw new Error(`Missing entry source: ${file}`)
    }
  }

  const input = {
    language: 'Solidity',
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  }

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }))

  if (output.errors) {
    const fatal = output.errors.filter((e) => e.severity === 'error')
    if (fatal.length > 0) {
      throw new Error(`Solidity compile failed:\n${fatal.map((e) => e.formattedMessage).join('\n')}`)
    }
  }

  return output.contracts
}

function artifact(contracts, source, name) {
  const c = contracts[source]?.[name]
  if (!c) throw new Error(`Missing artifact for ${name} in ${source}`)
  const bytecode = c.evm?.bytecode?.object
  if (!bytecode) throw new Error(`Missing bytecode for ${name}`)
  return { abi: c.abi, bytecode: `0x${bytecode}` }
}

async function deployContract(walletClient, publicClient, account, a, args = []) {
  const hash = await walletClient.deployContract({
    abi: a.abi,
    bytecode: a.bytecode,
    args,
    account,
    chain: hashkeyTestnet,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return receipt.contractAddress
}

async function sendTx(walletClient, publicClient, account, to, abi, functionName, args = []) {
  const hash = await walletClient.writeContract({
    address: to,
    abi,
    functionName,
    args,
    account,
    chain: hashkeyTestnet,
  })
  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY
  if (!privateKey || !privateKey.startsWith('0x')) {
    throw new Error('DEPLOYER_PRIVATE_KEY must be set as 0x-prefixed key')
  }

  const account = privateKeyToAccount(privateKey)
  const admin = account.address

  const publicClient = createPublicClient({ chain: hashkeyTestnet, transport: http('https://testnet.hsk.xyz') })
  const walletClient = createWalletClient({ account, chain: hashkeyTestnet, transport: http('https://testnet.hsk.xyz') })

  const balance = await publicClient.getBalance({ address: admin })
  if (balance === 0n) throw new Error('Deployer balance is 0 on HashKey testnet')

  const contracts = compileAll()

  const mockUSDT = artifact(contracts, 'foundry_contracts/src/mocks/MockUSDT.sol', 'MockUSDT')
  const mockHSP = artifact(contracts, 'foundry_contracts/src/mocks/MockHSPGateway.sol', 'MockHSPGateway')
  const registryA = artifact(contracts, 'foundry_contracts/src/PayrollRegistry.sol', 'PayrollRegistry')
  const factoryA = artifact(contracts, 'foundry_contracts/src/FlowWageFactory.sol', 'FlowWageFactory')
  const gatewayA = artifact(contracts, 'foundry_contracts/src/WithdrawalGateway.sol', 'WithdrawalGateway')

  const usdt = await deployContract(walletClient, publicClient, account, mockUSDT, [])
  await sendTx(walletClient, publicClient, account, usdt, mockUSDT.abi, 'mint', [admin, 10_000_000n * 1_000_000n])

  const hsp = await deployContract(walletClient, publicClient, account, mockHSP, [])
  const registry = await deployContract(walletClient, publicClient, account, registryA, [admin])

  const kycRole = await publicClient.readContract({
    address: registry,
    abi: registryA.abi,
    functionName: 'KYC_MANAGER_ROLE',
  })
  const pauserRole = await publicClient.readContract({
    address: registry,
    abi: registryA.abi,
    functionName: 'PAUSER_ROLE',
  })

  await sendTx(walletClient, publicClient, account, registry, registryA.abi, 'grantRole', [kycRole, admin])
  await sendTx(walletClient, publicClient, account, registry, registryA.abi, 'grantRole', [pauserRole, admin])
  await sendTx(walletClient, publicClient, account, registry, registryA.abi, 'whitelistToken', [usdt])

  const factory = await deployContract(walletClient, publicClient, account, factoryA, [registry, admin])
  const gateway = await deployContract(walletClient, publicClient, account, gatewayA, [admin, hsp])

  await sendTx(walletClient, publicClient, account, registry, registryA.abi, 'registerEmployer', [admin])
  await sendTx(walletClient, publicClient, account, registry, registryA.abi, 'setKYCStatus', [admin, 2])

  const env = [
    'VITE_RPC_URL=https://testnet.hsk.xyz',
    'VITE_CHAIN_ID=133',
    `VITE_REGISTRY_ADDRESS=${registry}`,
    `VITE_FACTORY_ADDRESS=${factory}`,
    `VITE_GATEWAY_ADDRESS=${gateway}`,
    `VITE_USDT_ADDRESS=${usdt}`,
    `VITE_HSP_ADDRESS=${hsp}`,
  ].join('\n') + '\n'

  fs.writeFileSync(path.join(root, '.env'), env, 'utf8')

  console.log('Deployer/Admin:', admin)
  console.log('VITE_REGISTRY_ADDRESS=' + registry)
  console.log('VITE_FACTORY_ADDRESS=' + factory)
  console.log('VITE_GATEWAY_ADDRESS=' + gateway)
  console.log('VITE_USDT_ADDRESS=' + usdt)
  console.log('VITE_HSP_ADDRESS=' + hsp)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

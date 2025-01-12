export const AddressZero = '0x0000000000000000000000000000000000000000'
export const DefaultDepositFee = 0.01

export function GetNetworkColor(chainId: number) {
  if (chainId === 1) return 'green'
  if (chainId === 10) return 'red'
  if (chainId === 137) return 'purple'
  if (chainId === 42161) return 'blue'
  if (chainId === 534352) return 'yellow'

  return 'grey'
}

export function GetNetworkName(chainId: number) {
  if (chainId === 1) return 'mainnet'
  if (chainId === 11155111) return 'sepolia'
  if (chainId === 42161) return 'arbitrum'
  if (chainId === 10) return 'optimism'

  return 'mainnet'
}

export const WHITELISTED_TOKENS = [
  { chainId: 1, symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18 },
  { chainId: 1, symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
  { chainId: 1, symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },

  { chainId: 10, symbol: 'OP', address: '0x4200000000000000000000000000000000000042', decimals: 18 },
  { chainId: 10, symbol: 'DAI', address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', decimals: 18 },
  { chainId: 10, symbol: 'USDT', address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', decimals: 6 },
  { chainId: 10, symbol: 'USDC', address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', decimals: 6 },

  { chainId: 11155111, symbol: 'SUP-DAI', address: '0x7ef7024B76791BD1f31Ac482724c76f0e24a2dD0', decimals: 18 },
]

export function GetTokenSymbol(address?: string) {
  if (!address || address == AddressZero) return 'ETH'

  return WHITELISTED_TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase())?.symbol || 'ETH'
}

export function GetTokenDecimals(address?: string) {
  if (!address || address == AddressZero) return 18

  return WHITELISTED_TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase())?.decimals || 18
}

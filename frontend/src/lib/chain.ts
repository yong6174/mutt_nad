import { defineChain } from 'viem';

const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const isMainnet = NETWORK === 'mainnet';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_TESTNET_RPC_URL || 'https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
});

export const monadMainnet = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://infra.originstake.com/monad/evm'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
  testnet: false,
});

/** 현재 NETWORK에 따른 활성 체인 */
export const activeChain = isMainnet ? monadMainnet : monadTestnet;

/** 현재 NETWORK에 따른 컨트랙트 주소 */
export const MUTT_NFT_ADDRESS = (
  isMainnet
    ? process.env.NEXT_PUBLIC_MAINNET_MUTT_NFT_ADDRESS
    : process.env.NEXT_PUBLIC_TESTNET_MUTT_NFT_ADDRESS
) as `0x${string}` | undefined;

/** MUTT ERC-20 토큰 주소 */
export const MUTT_TOKEN_ADDRESS = (
  isMainnet
    ? process.env.NEXT_PUBLIC_MAINNET_MUTT_TOKEN_ADDRESS
    : process.env.NEXT_PUBLIC_TESTNET_MUTT_TOKEN_ADDRESS
) as `0x${string}` | undefined;

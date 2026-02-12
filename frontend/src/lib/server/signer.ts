import { privateKeyToAccount } from 'viem/accounts';
import { type Hex } from 'viem';
import { activeChain, MUTT_NFT_ADDRESS } from '../chain';

const NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const isMainnet = NETWORK === 'mainnet';

const SERVER_KEY = isMainnet
  ? process.env.MAINNET_SERVER_PRIVATE_KEY
  : process.env.TESTNET_SERVER_PRIVATE_KEY;

const serverAccount = privateKeyToAccount(
  (SERVER_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001') as Hex
);

const DOMAIN = {
  name: 'MuttNFT',
  version: '1',
  chainId: activeChain.id,
  verifyingContract: (MUTT_NFT_ADDRESS || '0x') as `0x${string}`,
} as const;

const HATCH_TYPES = {
  Hatch: [
    { name: 'to', type: 'address' },
    { name: 'personality', type: 'uint8' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

const BREED_TYPES = {
  Breed: [
    { name: 'to', type: 'address' },
    { name: 'parentA', type: 'uint256' },
    { name: 'parentB', type: 'uint256' },
    { name: 'personality', type: 'uint8' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

export async function signHatch(to: `0x${string}`, personality: number, nonce: bigint) {
  return serverAccount.signTypedData({
    domain: DOMAIN,
    types: HATCH_TYPES,
    primaryType: 'Hatch',
    message: { to, personality, nonce },
  });
}

export async function signBreed(
  to: `0x${string}`,
  parentA: bigint,
  parentB: bigint,
  personality: number,
  nonce: bigint
) {
  return serverAccount.signTypedData({
    domain: DOMAIN,
    types: BREED_TYPES,
    primaryType: 'Breed',
    message: { to, parentA, parentB, personality, nonce },
  });
}

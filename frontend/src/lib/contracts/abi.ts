export const MUTT_NFT_ABI = [
  {
    type: 'function',
    name: 'genesisHatch',
    inputs: [
      { name: 'personality', type: 'uint8' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'breed',
    inputs: [
      { name: 'parentA', type: 'uint256' },
      { name: 'parentB', type: 'uint256' },
      { name: 'personality', type: 'uint8' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'muttToken',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setBreedCost',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'cost', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getMutt',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'personality', type: 'uint8' },
          { name: 'parentA', type: 'uint256' },
          { name: 'parentB', type: 'uint256' },
          { name: 'breeder', type: 'address' },
          { name: 'breedCost', type: 'uint256' },
          { name: 'lastBreedTime', type: 'uint256' },
          { name: 'mintCost', type: 'uint256' },
          { name: 'maxSupply', type: 'uint256' },
          { name: 'totalSupply', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setMintConfig',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: '_mintCost', type: 'uint256' },
      { name: '_maxSupply', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'hasGenesis',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nonces',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextTokenId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'GenesisHatch',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'personality', type: 'uint8', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Bred',
    inputs: [
      { name: 'newTokenId', type: 'uint256', indexed: true },
      { name: 'parentA', type: 'uint256', indexed: false },
      { name: 'parentB', type: 'uint256', indexed: false },
      { name: 'breeder', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'BreedCostSet',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'cost', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Minted',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'minter', type: 'address', indexed: true },
      { name: 'newTotalSupply', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MintConfigSet',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'mintCost', type: 'uint256', indexed: false },
      { name: 'maxSupply', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;

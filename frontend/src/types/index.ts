// MBTI 16 types (index 0~15)
export type MBTI =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export const MBTI_INDEX: Record<MBTI, number> = {
  INTJ: 0, INTP: 1, ENTJ: 2, ENTP: 3,
  INFJ: 4, INFP: 5, ENFJ: 6, ENFP: 7,
  ISTJ: 8, ISFJ: 9, ESTJ: 10, ESFJ: 11,
  ISTP: 12, ISFP: 13, ESTP: 14, ESFP: 15,
};

export const INDEX_MBTI: MBTI[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

export type BloodlineGrade = 'mutt' | 'halfblood' | 'pureblood' | 'sacred28';

export interface Traits {
  color: string;
  expression: string;
  accessory: string;
}

// On-chain data (read from contract)
export interface MuttOnChain {
  tokenId: bigint;
  personality: number;        // 0~15
  parentA: bigint;            // parent tokenId (0 = Genesis)
  parentB: bigint;
  breeder: `0x${string}`;
  breedCost: bigint;          // wei
  lastBreedTime: bigint;      // unix timestamp
  mintCost: bigint;           // MUTT ERC-20 per mint (0 = free)
  maxSupply: bigint;          // 0 = unlimited
  totalSupply: bigint;        // current supply count
}

// Off-chain data (read from DB)
export interface MuttOffChain {
  tokenId: number;
  personality: MBTI;
  personalityDesc: string;
  identity: string;           // IDENTITY.md raw text
  bloodline: BloodlineGrade;
  avgRating: number;
  totalReviews: number;
  traits: Traits;
  image: string;              // /images/{mbti}.png
}

// Combined full data
export interface MuttFull extends MuttOffChain {
  onChain: MuttOnChain;
}

// Rating
export interface Rating {
  tokenId: number;
  voter: `0x${string}`;
  score: number;              // 1~5
  timestamp: number;
}

// House (leaderboard)
export interface House {
  name: string;
  route: number[];            // tokenId path [child, parent, grandparent]
  avgRating: number;
  totalReviews: number;
  members: MuttOffChain[];    // max 5
}

// Breed request
export interface BreedRequest {
  myTokenId: number;
  partnerTokenId: number;
}

// Breed result (API response)
export interface BreedResult {
  newTokenId: number;
  personality: MBTI;
  personalityDesc: string;
  traits: Traits;
  signature: `0x${string}`;
}

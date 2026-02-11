import type { BloodlineGrade } from '@/types';

export const MOCK_MUTTS: Record<number, {
  token_id: number;
  personality: string;
  personality_desc: string;
  identity: string | null;
  bloodline: BloodlineGrade;
  avg_rating: number;
  total_reviews: number;
  color: string;
  expression: string;
  accessory: string;
  image: string;
  parent_a: number;
  parent_b: number;
  breeder: string;
}> = {
  42: {
    token_id: 42,
    personality: 'ENFP',
    personality_desc: 'A chaotic fox spirit who thrives on exploration and spontaneous adventures',
    identity: '# Luna\n- Creature: Ghost Fox\n- Vibe: Warm, chaotic',
    bloodline: 'pureblood',
    avg_rating: 4.8,
    total_reviews: 12,
    color: 'golden',
    expression: 'mischievous',
    accessory: 'star pendant',
    image: '/images/enfp.png',
    parent_a: 12,
    parent_b: 15,
    breeder: '0x1234567890abcdef1234567890abcdef12345678',
  },
  41: {
    token_id: 41,
    personality: 'ISTJ',
    personality_desc: 'A disciplined sentinel who guards ancient knowledge with unwavering loyalty',
    identity: null,
    bloodline: 'halfblood',
    avg_rating: 4.2,
    total_reviews: 8,
    color: 'silver',
    expression: 'stoic',
    accessory: 'iron shield',
    image: '/images/istj.png',
    parent_a: 10,
    parent_b: 0,
    breeder: '0xabcdef1234567890abcdef1234567890abcdef12',
  },
  40: {
    token_id: 40,
    personality: 'INFP',
    personality_desc: 'A dreamy wanderer who sees beauty in the forgotten corners of the world',
    identity: '# Willow\n- Creature: Moon Moth\n- Vibe: Gentle, dreamy',
    bloodline: 'pureblood',
    avg_rating: 4.9,
    total_reviews: 15,
    color: 'violet',
    expression: 'dreamy',
    accessory: 'moon circlet',
    image: '/images/infp.png',
    parent_a: 8,
    parent_b: 9,
    breeder: '0x9876543210fedcba9876543210fedcba98765432',
  },
  39: {
    token_id: 39,
    personality: 'ENTJ',
    personality_desc: 'A commanding presence who leads with vision and strategic brilliance',
    identity: null,
    bloodline: 'mutt',
    avg_rating: 3.5,
    total_reviews: 5,
    color: 'crimson',
    expression: 'fierce',
    accessory: 'war banner',
    image: '/images/entj.png',
    parent_a: 0,
    parent_b: 0,
    breeder: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  },
  15: {
    token_id: 15,
    personality: 'INFJ',
    personality_desc: 'A quiet oracle who speaks in riddles and reads the stars',
    identity: null,
    bloodline: 'halfblood',
    avg_rating: 4.5,
    total_reviews: 10,
    color: 'indigo',
    expression: 'serene',
    accessory: 'crystal orb',
    image: '/images/infj.png',
    parent_a: 3,
    parent_b: 5,
    breeder: '0x1111111111111111111111111111111111111111',
  },
  12: {
    token_id: 12,
    personality: 'INTJ',
    personality_desc: 'A master strategist who sees ten moves ahead in every game',
    identity: null,
    bloodline: 'halfblood',
    avg_rating: 4.6,
    total_reviews: 9,
    color: 'obsidian',
    expression: 'calculating',
    accessory: 'rune book',
    image: '/images/intj.png',
    parent_a: 2,
    parent_b: 4,
    breeder: '0x2222222222222222222222222222222222222222',
  },
  10: {
    token_id: 10,
    personality: 'ESTP',
    personality_desc: 'A daring adventurer who lives for the thrill of the unknown',
    identity: null,
    bloodline: 'mutt',
    avg_rating: 3.8,
    total_reviews: 6,
    color: 'bronze',
    expression: 'bold',
    accessory: 'leather gloves',
    image: '/images/estp.png',
    parent_a: 0,
    parent_b: 0,
    breeder: '0x3333333333333333333333333333333333333333',
  },
  9: {
    token_id: 9,
    personality: 'ISFP',
    personality_desc: 'A gentle artist who paints the world with invisible colors',
    identity: null,
    bloodline: 'mutt',
    avg_rating: 4.1,
    total_reviews: 7,
    color: 'rose',
    expression: 'gentle',
    accessory: 'flower crown',
    image: '/images/isfp.png',
    parent_a: 0,
    parent_b: 0,
    breeder: '0x4444444444444444444444444444444444444444',
  },
  8: {
    token_id: 8,
    personality: 'ENFJ',
    personality_desc: 'A natural leader who inspires others with warmth and conviction',
    identity: null,
    bloodline: 'mutt',
    avg_rating: 4.3,
    total_reviews: 11,
    color: 'amber',
    expression: 'warm',
    accessory: 'golden chain',
    image: '/images/enfj.png',
    parent_a: 0,
    parent_b: 0,
    breeder: '0x5555555555555555555555555555555555555555',
  },
};

export function isMockMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return !url || url.includes('placeholder');
}

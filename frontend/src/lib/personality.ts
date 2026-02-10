import type { MBTI } from '@/types';

export interface PersonalityInfo {
  index: number;
  type: MBTI;
  name: string;
  keywords: string;
  image: string;
}

export const PERSONALITIES: PersonalityInfo[] = [
  { index: 0, type: 'INTJ', name: 'Strategist', keywords: 'efficiency, logic', image: '/images/intj.png' },
  { index: 1, type: 'INTP', name: 'Logician', keywords: 'analysis, hypothesis', image: '/images/intp.png' },
  { index: 2, type: 'ENTJ', name: 'Commander', keywords: 'leader, decisive', image: '/images/entj.png' },
  { index: 3, type: 'ENTP', name: 'Debater', keywords: 'debate, ideas', image: '/images/entp.png' },
  { index: 4, type: 'INFJ', name: 'Advocate', keywords: 'empathy, care', image: '/images/infj.png' },
  { index: 5, type: 'INFP', name: 'Mediator', keywords: 'emotion, imagination', image: '/images/infp.png' },
  { index: 6, type: 'ENFJ', name: 'Protagonist', keywords: 'inspire, motivate', image: '/images/enfj.png' },
  { index: 7, type: 'ENFP', name: 'Campaigner', keywords: 'passion, energy', image: '/images/enfp.png' },
  { index: 8, type: 'ISTJ', name: 'Realist', keywords: 'accuracy, principle', image: '/images/istj.png' },
  { index: 9, type: 'ISFJ', name: 'Defender', keywords: 'devotion, detail', image: '/images/isfj.png' },
  { index: 10, type: 'ESTJ', name: 'Executive', keywords: 'organize, direct', image: '/images/estj.png' },
  { index: 11, type: 'ESFJ', name: 'Consul', keywords: 'harmony, friendly', image: '/images/esfj.png' },
  { index: 12, type: 'ISTP', name: 'Virtuoso', keywords: 'practical, cool', image: '/images/istp.png' },
  { index: 13, type: 'ISFP', name: 'Adventurer', keywords: 'art, gentle', image: '/images/isfp.png' },
  { index: 14, type: 'ESTP', name: 'Entrepreneur', keywords: 'action, adventure', image: '/images/estp.png' },
  { index: 15, type: 'ESFP', name: 'Entertainer', keywords: 'fun, vibe', image: '/images/esfp.png' },
];

export function getPersonality(index: number): PersonalityInfo {
  return PERSONALITIES[index] ?? PERSONALITIES[0];
}

export function getPersonalityByType(type: MBTI): PersonalityInfo {
  return PERSONALITIES.find(p => p.type === type) ?? PERSONALITIES[0];
}

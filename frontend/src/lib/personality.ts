import type { MBTI } from '@/types';

export interface PersonalityInfo {
  index: number;
  type: MBTI;
  name: string;
  keywords: string;
  image: string;
  group: 'analyst' | 'diplomat' | 'sentinel' | 'explorer';
}

// 4 groups → 4 images
// Analyst (blue/owl): INTJ, INTP, ENTJ, ENTP
// Diplomat (gold/deer): INFJ, INFP, ENFJ, ENFP
// Sentinel (red/lion): ISTJ, ISFJ, ESTJ, ESFJ
// Explorer (green/fox): ISTP, ISFP, ESTP, ESFP

export const PERSONALITIES: PersonalityInfo[] = [
  { index: 0, type: 'INTJ', name: 'Strategist', keywords: 'efficiency, logic', image: '/images/mbti/analyst.png', group: 'analyst' },
  { index: 1, type: 'INTP', name: 'Logician', keywords: 'analysis, hypothesis', image: '/images/mbti/analyst.png', group: 'analyst' },
  { index: 2, type: 'ENTJ', name: 'Commander', keywords: 'leader, decisive', image: '/images/mbti/analyst.png', group: 'analyst' },
  { index: 3, type: 'ENTP', name: 'Debater', keywords: 'debate, ideas', image: '/images/mbti/analyst.png', group: 'analyst' },
  { index: 4, type: 'INFJ', name: 'Advocate', keywords: 'empathy, care', image: '/images/mbti/diplomat.png', group: 'diplomat' },
  { index: 5, type: 'INFP', name: 'Mediator', keywords: 'emotion, imagination', image: '/images/mbti/diplomat.png', group: 'diplomat' },
  { index: 6, type: 'ENFJ', name: 'Protagonist', keywords: 'inspire, motivate', image: '/images/mbti/diplomat.png', group: 'diplomat' },
  { index: 7, type: 'ENFP', name: 'Campaigner', keywords: 'passion, energy', image: '/images/mbti/diplomat.png', group: 'diplomat' },
  { index: 8, type: 'ISTJ', name: 'Realist', keywords: 'accuracy, principle', image: '/images/mbti/sentinel.png', group: 'sentinel' },
  { index: 9, type: 'ISFJ', name: 'Defender', keywords: 'devotion, detail', image: '/images/mbti/sentinel.png', group: 'sentinel' },
  { index: 10, type: 'ESTJ', name: 'Executive', keywords: 'organize, direct', image: '/images/mbti/sentinel.png', group: 'sentinel' },
  { index: 11, type: 'ESFJ', name: 'Consul', keywords: 'harmony, friendly', image: '/images/mbti/sentinel.png', group: 'sentinel' },
  { index: 12, type: 'ISTP', name: 'Virtuoso', keywords: 'practical, cool', image: '/images/mbti/explorer.png', group: 'explorer' },
  { index: 13, type: 'ISFP', name: 'Adventurer', keywords: 'art, gentle', image: '/images/mbti/explorer.png', group: 'explorer' },
  { index: 14, type: 'ESTP', name: 'Entrepreneur', keywords: 'action, adventure', image: '/images/mbti/explorer.png', group: 'explorer' },
  { index: 15, type: 'ESFP', name: 'Entertainer', keywords: 'fun, vibe', image: '/images/mbti/explorer.png', group: 'explorer' },
];

export function getPersonality(index: number): PersonalityInfo {
  return PERSONALITIES[index] ?? PERSONALITIES[0];
}

export function getPersonalityByType(type: MBTI): PersonalityInfo {
  return PERSONALITIES.find(p => p.type === type) ?? PERSONALITIES[0];
}

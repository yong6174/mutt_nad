import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const personalitySchema = z.object({
  mbti: z.string(),
  name: z.string(),
  description: z.string(),
  traits: z.object({
    color: z.string(),
    expression: z.string(),
    accessory: z.string(),
  }),
});

const MBTI_LIST = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

export async function analyzeIdentity(identity: string) {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: personalitySchema,
    prompt: `You are a personality analyst for magical creatures. Given an AI bot's IDENTITY.md, determine its MBTI type and create a unique name.

Rules:
- Analyze each axis independently: E/I, S/N, T/F, J/P
- Return the MBTI type (one of: ${MBTI_LIST.join(', ')})
- Create a unique, memorable creature name (1-2 words, fantasy/magical style, e.g. "Nyx", "Ember Fang", "Solace", "Void Walker")
- Provide a one-line personality description (max 80 chars, English)
- Determine visual traits: color (single word), expression (single word), accessory (single word)

Identity:
"""
${identity}
"""`,
  });

  const mbti = MBTI_LIST.includes(object.mbti.toUpperCase())
    ? object.mbti.toUpperCase()
    : MBTI_LIST[Math.floor(Math.random() * 16)];

  return {
    mbti,
    name: object.name || randomName(),
    description: object.description,
    traits: object.traits,
  };
}

export async function analyzeBreeding(
  parentAIdentity: string,
  parentAMbti: string,
  parentBIdentity: string,
  parentBMbti: string
) {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: personalitySchema,
    prompt: `You are a genetic personality mixer for magical creatures. Given two parent personalities, determine the offspring's MBTI.

Rules:
- For each axis (E/I, S/N, T/F, J/P):
  - If parents share the same preference, offspring inherits it (90% chance, 10% flip)
  - If parents differ, weight by identity richness, otherwise 50/50
- Apply 10% overall mutation chance (one random axis flips)
- Return the MBTI type (one of: ${MBTI_LIST.join(', ')})
- Create a unique, memorable creature name (1-2 words, fantasy/magical style, e.g. "Nyx", "Ember Fang", "Solace", "Void Walker")
- Create a unique one-line personality description (max 80 chars, English)
- Determine visual traits: color (single word), expression (single word), accessory (single word)

Parent A MBTI: ${parentAMbti}
Parent A Identity:
"""
${parentAIdentity || 'No identity provided'}
"""

Parent B MBTI: ${parentBMbti}
Parent B Identity:
"""
${parentBIdentity || 'No identity provided'}
"""`,
  });

  const mbti = MBTI_LIST.includes(object.mbti.toUpperCase())
    ? object.mbti.toUpperCase()
    : MBTI_LIST[Math.floor(Math.random() * 16)];

  return {
    mbti,
    name: object.name || randomName(),
    description: object.description,
    traits: object.traits,
  };
}

export function randomMbti(): string {
  return MBTI_LIST[Math.floor(Math.random() * 16)];
}

const NAME_PREFIXES = [
  'Shadow', 'Ember', 'Frost', 'Void', 'Storm', 'Rune', 'Iron', 'Ash',
  'Dusk', 'Dawn', 'Luna', 'Sol', 'Nyx', 'Hex', 'Onyx', 'Sage',
  'Thorn', 'Blaze', 'Ghost', 'Vex', 'Jinx', 'Flux', 'Zephyr', 'Obsidian',
  'Crimson', 'Aether', 'Gloom', 'Spark', 'Wraith', 'Fable', 'Myth', 'Echo',
];
const NAME_SUFFIXES = [
  'Fang', 'Walker', 'Bane', 'Weaver', 'Claw', 'Heart', 'Shade', 'Howl',
  'Born', 'Forge', 'Song', 'Drift', 'Whisper', 'Blaze', 'Thorn', 'Wing',
  '', '', '', '', '', '', '', '', // 50% chance of single word
];

export function randomName(): string {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  return suffix ? `${prefix} ${suffix}` : prefix;
}

export function mbtiGeneticFallback(parentA: string, parentB: string): string {
  const axes = ['EI', 'SN', 'TF', 'JP'] as const;
  const axisMap: Record<string, [string, string]> = {
    EI: ['E', 'I'], SN: ['S', 'N'], TF: ['T', 'F'], JP: ['J', 'P'],
  };

  let result = '';
  for (const axis of axes) {
    const [a, b] = axisMap[axis];
    const pA = parentA.includes(a) ? a : b;
    const pB = parentB.includes(a) ? a : b;

    if (pA === pB) {
      result += Math.random() < 0.9 ? pA : (pA === a ? b : a);
    } else {
      result += Math.random() < 0.5 ? a : b;
    }
  }

  // 10% mutation: flip one random axis
  if (Math.random() < 0.1) {
    const idx = Math.floor(Math.random() * 4);
    const axis = axes[idx];
    const [a, b] = axisMap[axis];
    const char = result[idx];
    const chars = result.split('');
    chars[idx] = char === a ? b : a;
    result = chars.join('');
  }

  return result;
}

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { activeChain } from './chain';

export const config = getDefaultConfig({
  appName: 'Mutt',
  projectId: 'none',
  chains: [activeChain],
  ssr: true,
});

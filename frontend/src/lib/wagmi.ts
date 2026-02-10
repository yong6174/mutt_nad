import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { monadTestnet } from './chain';

export const config = getDefaultConfig({
  appName: 'Mutt',
  projectId: 'none',
  chains: [monadTestnet],
  ssr: true,
});

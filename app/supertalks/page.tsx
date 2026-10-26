import { Metadata } from 'next';
import SupertalksClient from './SupertalksClient';

export const metadata: Metadata = {
  title: 'Supertalks — Spontaneous 1-on-1 Video Conversations',
  description: 'Connect live for 30 seconds of spontaneous presence. Real people, zero friction, peer-to-peer WebRTC.',
};

export default function SupertalksPage() {
  return <SupertalksClient />;
}

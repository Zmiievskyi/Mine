import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MineGNK - GPU Mining as a Service',
  description:
    'Rent enterprise-grade GPUs to mine cryptocurrency on the Gonka network. Pay in fiat currency and earn GNK tokens.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

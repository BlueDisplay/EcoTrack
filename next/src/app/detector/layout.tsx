import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detector IA',
  description: 'EcoScan — Detección de contaminación urbana con Inteligencia Artificial',
};

export default function DetectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

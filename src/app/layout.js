import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Distributo - Find Your Winning Content Formula',
  description: 'Stop guessing which content works. Know exactly which hooks, formats, and angles convert for YOUR audience.',
  // ... rest of metadata
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
import "./globals.css";

export const metadata = {
  title: "Distributo",
  description: "AI-powered UGC video generation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

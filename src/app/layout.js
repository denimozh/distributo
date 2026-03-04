import './globals.css'

export const metadata = {
  title: 'Experiment Engine | Find Your Winning Content Formula',
  description: 'AI-powered creative experiments that find what works for your audience',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

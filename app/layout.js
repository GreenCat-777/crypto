import './globals.css'

export const metadata = {
  title: 'Support GreenCat777',
  description: 'Support GreenCat777 with crypto — no account needed',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}

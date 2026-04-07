import React from 'react'

export default function PrivacyPolicy() {
  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      padding: '120px 20px 60px 20px',
      fontFamily: "'Nunito', sans-serif",
      color: 'var(--ink-800)',
      lineHeight: 1.6
    }}>
      <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, marginBottom: 24 }}>Privacy Policy</h1>
      
      <p style={{ marginBottom: 16 }}>
        Welcome to Pockét Fusions! We value your privacy and keep things as minimal as possible.
      </p>

      <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, marginTop: 32, marginBottom: 12 }}>What data do we collect?</h2>
      <p style={{ marginBottom: 16 }}>
        When you log in via Discord, we securely store your basic public Discord profile information. This includes your:
      </p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li>Discord ID</li>
        <li>Username</li>
        <li>Avatar</li>
      </ul>
      <p style={{ marginBottom: 16 }}>
        We <strong>do not</strong> request or store your email address, friends list, or any other sensitive personal data from Discord.
      </p>

      <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, marginTop: 32, marginBottom: 12 }}>How do we use your data?</h2>
      <p style={{ marginBottom: 16 }}>
        Your data is used entirely for core functionality on the platform:
      </p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li>Tracking which artworks you have liked so you can see your own likes.</li>
        <li>Associating your username with the Fusion Requests you submit, so we can organize suggestions in our gallery pipeline.</li>
      </ul>

      <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, marginTop: 32, marginBottom: 12 }}>Who do we share data with?</h2>
      <p style={{ marginBottom: 16 }}>
        We don't sell or share your data with advertisers or third-party networks. The limited public profile info we collect stays strictly within our own database for art engagement tracking.
      </p>

    </div>
  )
}

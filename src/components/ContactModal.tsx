import { useState, useEffect } from 'react'
import { submitContact } from '../api/client'
import type { Artwork, ContactMessage } from '../types'
import styles from './ContactModal.module.css'

interface ContactModalProps {
  prefillArtwork?: Artwork
  onClose: () => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ContactModal({ prefillArtwork, onClose }: ContactModalProps) {
  const [form, setForm] = useState<ContactMessage>({
    name: '',
    email: '',
    subject: prefillArtwork ? `Enquiry: ${prefillArtwork.title}` : '',
    message: prefillArtwork
      ? `Hello, I'm interested in "${prefillArtwork.title}". Could you share more details?`
      : '',
    artwork_id: prefillArtwork?.id,
  })
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const set = (key: keyof ContactMessage) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await submitContact(form)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className={styles.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Get in touch</h2>
              {prefillArtwork && (
                <p className={styles.subtitle}>Re: <em>{prefillArtwork.title}</em></p>
              )}
            </div>
            <button onClick={onClose} className={styles.closeBtn}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l10 10M11 1L1 11"/>
              </svg>
            </button>
          </div>

          {status === 'success' ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10l5 5 7-8"/>
                </svg>
              </div>
              <p className={styles.successTitle}>Message sent</p>
              <p className={styles.successSubtitle}>I'll be in touch soon.</p>
              <button onClick={onClose} className={styles.successClose}>Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Name</label>
                  <input type="text" value={form.name} onChange={set('name')} required className={styles.input} placeholder="Your name" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input type="email" value={form.email} onChange={set('email')} required className={styles.input} placeholder="you@example.com" />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Subject</label>
                <input type="text" value={form.subject ?? ''} onChange={set('subject')} className={styles.input} placeholder="Subject" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Message</label>
                <textarea value={form.message} onChange={set('message')} required rows={4} className={styles.textarea} placeholder="Your message…" />
              </div>
              {status === 'error' && <p className={styles.errorMsg}>Something went wrong. Please try again.</p>}
              <button type="submit" disabled={status === 'loading'} className={styles.submitBtn}>
                {status === 'loading' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
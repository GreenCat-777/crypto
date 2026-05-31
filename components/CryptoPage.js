'use client'

import { useState, useEffect, useCallback } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { supabase } from '../lib/supabase'

const styles = {
  wrap: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '40px 20px 80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pfp: {
    width: 130,
    height: 130,
    borderRadius: '50%',
    border: '3px solid var(--green)',
    boxShadow: '0 0 20px var(--green-glow), 0 0 40px rgba(0,255,65,0.2)',
    marginBottom: 18,
    display: 'block',
  },
  h1: {
    fontSize: '1.6rem',
    color: 'var(--green)',
    textShadow: '0 0 14px var(--green-glow)',
    letterSpacing: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '0.82rem',
    opacity: 0.6,
    marginBottom: 36,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    background: 'var(--card-bg)',
    border: '1.5px solid var(--green-border)',
    borderRadius: 8,
    boxShadow: '0 0 16px rgba(0,255,65,0.1), inset 0 0 30px rgba(0,255,65,0.02)',
    padding: 20,
    marginBottom: 24,
  },
  prompt: {
    fontSize: '0.8rem',
    opacity: 0.5,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  promptSpan: {
    opacity: 1,
    color: 'var(--green)',
  },
  amounts: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  amtBtn: (active) => ({
    flex: 1,
    padding: '10px 6px',
    background: active ? 'var(--green-dim)' : 'transparent',
    border: `1.5px solid ${active ? 'var(--green)' : 'var(--green-border)'}`,
    borderRadius: 4,
    color: 'var(--green)',
    fontFamily: 'var(--mono)',
    fontSize: '0.95rem',
    cursor: 'pointer',
    textAlign: 'center',
    opacity: active ? 1 : 0.65,
    boxShadow: active ? '0 0 12px rgba(0,255,65,0.3)' : 'none',
    transition: 'all 0.12s',
  }),
  fieldLabel: {
    fontSize: '0.72rem',
    opacity: 0.45,
    marginBottom: 5,
    display: 'block',
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: '1.5px solid rgba(0,255,65,0.25)',
    borderRadius: 4,
    color: 'var(--green)',
    fontFamily: 'var(--mono)',
    fontSize: '0.88rem',
    padding: '10px 12px',
    outline: 'none',
    marginBottom: 12,
  },
  textarea: {
    width: '100%',
    background: 'transparent',
    border: '1.5px solid rgba(0,255,65,0.25)',
    borderRadius: 4,
    color: 'var(--green)',
    fontFamily: 'var(--mono)',
    fontSize: '0.88rem',
    padding: '10px 12px',
    outline: 'none',
    resize: 'vertical',
    minHeight: 70,
    marginBottom: 12,
  },
  payBtn: {
    width: '100%',
    marginTop: 6,
    marginBottom: 14,
    padding: 14,
    background: 'var(--green-dim)',
    border: '2px solid var(--green)',
    borderRadius: 4,
    color: 'var(--green)',
    fontFamily: 'var(--mono)',
    fontSize: '1rem',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    boxShadow: '0 0 16px rgba(0,255,65,0.25)',
  },
  status: (isError) => ({
    marginTop: 10,
    fontSize: '0.8rem',
    minHeight: 18,
    textAlign: 'center',
    color: isError ? '#ff4444' : 'var(--green)',
  }),
  donorEntry: {
    border: '1px solid rgba(0,255,65,0.18)',
    borderRadius: 4,
    padding: '12px 14px',
    background: 'rgba(0,255,65,0.02)',
    marginBottom: 10,
  },
  donorTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  donorName: {
    fontSize: '0.88rem',
    textShadow: '0 0 6px rgba(0,255,65,0.35)',
  },
  donorAmt: { fontSize: '0.75rem', opacity: 0.5 },
  donorMsg: { fontSize: '0.78rem', opacity: 0.6, fontStyle: 'italic', marginBottom: 4 },
  donorTime: { fontSize: '0.62rem', opacity: 0.3 },
  emptyWall: { fontSize: '0.8rem', opacity: 0.35, textAlign: 'center', padding: '24px 0' },
}

const AMOUNTS = [3, 5, 10]

export default function CryptoPage({ paypalClientId }) {
  const [selectedAmt, setSelectedAmt] = useState(3)
  const [customAmt, setCustomAmt] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [showPayPal, setShowPayPal] = useState(false)
  const [status, setStatus] = useState({ text: '', error: false })
  const [donors, setDonors] = useState([])
  const [loadingDonors, setLoadingDonors] = useState(true)

  const finalAmt = isCustom ? parseFloat(customAmt) || 0 : selectedAmt

  // Load donors
  const fetchDonors = useCallback(async () => {
    const { data } = await supabase
      .from('donors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setDonors(data)
    setLoadingDonors(false)
  }, [])

  useEffect(() => {
    fetchDonors()
    // Realtime subscription
    const channel = supabase
      .channel('donors')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donors' }, payload => {
        setDonors(prev => [payload.new, ...prev].slice(0, 50))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchDonors])

  function setMsg(text, error = false) {
    setStatus({ text, error })
    if (!error) setTimeout(() => setStatus({ text: '', error: false }), 6000)
  }

  function handlePayNow() {
    if (!finalAmt || finalAmt < 1) {
      setMsg('> enter an amount of at least $1', true)
      return
    }
    setShowPayPal(true)
  }

  async function handleApprove(data, actions) {
    await actions.order.capture()
    const donorName = name.trim() || 'Anonymous'
    await supabase.from('donors').insert({
      name: donorName,
      message: message.trim() || null,
      amount: finalAmt,
    })
    setMsg(`> payment received. thank you, ${donorName}!`)
    setName('')
    setMessage('')
    setShowPayPal(false)
    setSelectedAmt(3)
    setIsCustom(false)
    setCustomAmt('')
  }

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <img
        style={styles.pfp}
        src="https://www.greencat777.xyz/pfp.png"
        alt="GreenCat777"
      />
      <h1 style={styles.h1}>Support GreenCat777</h1>
      <p style={styles.subtitle}>pay with crypto &mdash; no account needed</p>

      {/* Donation card */}
      <div style={styles.card}>
        <div style={styles.prompt}>
          <span style={styles.promptSpan}>greencat777@bio:~$</span> cat support.txt
        </div>

        {/* Amount buttons */}
        <div style={styles.amounts}>
          {AMOUNTS.map(a => (
            <button
              key={a}
              style={styles.amtBtn(!isCustom && selectedAmt === a)}
              onClick={() => { setSelectedAmt(a); setIsCustom(false); setShowPayPal(false) }}
            >
              ${a}
            </button>
          ))}
          <button
            style={styles.amtBtn(isCustom)}
            onClick={() => { setIsCustom(true); setShowPayPal(false) }}
          >
            other
          </button>
        </div>

        {isCustom && (
          <input
            type="number"
            style={styles.input}
            placeholder="enter amount in USD"
            min="1"
            step="0.01"
            value={customAmt}
            onChange={e => setCustomAmt(e.target.value)}
          />
        )}

        {/* Name */}
        <div style={{ marginBottom: 12 }}>
          <span style={styles.fieldLabel}># name (blank = anonymous)</span>
          <input
            type="text"
            style={styles.input}
            placeholder="your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Message */}
        <div style={{ marginBottom: 12 }}>
          <span style={styles.fieldLabel}># message (optional)</span>
          <textarea
            style={styles.textarea}
            placeholder="say something..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        {/* Pay button */}
        {!showPayPal && (
          <button style={styles.payBtn} onClick={handlePayNow}>
            [ PAY NOW ]
          </button>
        )}

        {/* PayPal buttons */}
        {showPayPal && paypalClientId && (
          <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD', enableFunding: 'crypto' }}>
            <PayPalButtons
              style={{ layout: 'vertical', color: 'black', shape: 'rect', label: 'pay' }}
              createOrder={(data, actions) =>
                actions.order.create({
                  purchase_units: [{
                    amount: { value: finalAmt.toFixed(2), currency_code: 'USD' },
                    description: 'Support GreenCat777',
                  }],
                })
              }
              onApprove={handleApprove}
              onError={() => setMsg('> error processing payment. try again.', true)}
              onCancel={() => { setShowPayPal(false); setMsg('> payment cancelled.') }}
            />
          </PayPalScriptProvider>
        )}

        {status.text && <div style={styles.status(status.error)}>{status.text}</div>}
      </div>

      {/* Donor wall */}
      <div style={styles.card}>
        <div style={styles.prompt}>
          <span style={styles.promptSpan}>greencat777@bio:~$</span> cat supporters.log
        </div>
        {loadingDonors ? (
          <div style={styles.emptyWall}>loading...</div>
        ) : donors.length === 0 ? (
          <div style={styles.emptyWall}>no entries yet █</div>
        ) : (
          donors.map(d => (
            <div key={d.id} style={styles.donorEntry}>
              <div style={styles.donorTop}>
                <span style={styles.donorName}>{d.name}</span>
                <span style={styles.donorAmt}>${parseFloat(d.amount).toFixed(2)}</span>
              </div>
              {d.message && <div style={styles.donorMsg}>{d.message}</div>}
              <div style={styles.donorTime}>
                {new Date(d.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

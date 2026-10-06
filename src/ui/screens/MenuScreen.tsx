import { useState, type CSSProperties } from 'react'

interface MenuScreenProps {
  onPlay: () => void
  onOptions: () => void
}

type Tab = 'play' | 'how-to-play'

export function MenuScreen({ onPlay, onOptions }: MenuScreenProps) {
  const [tab, setTab] = useState<Tab>('play')

  return (
    <div style={styles.screen}>
      <h1 style={styles.title}>Pirate Battle</h1>

      <div role="tablist" aria-label="Menu" style={styles.tabs}>
        <TabButton active={tab === 'play'} onClick={() => setTab('play')}>
          Play
        </TabButton>
        <TabButton active={tab === 'how-to-play'} onClick={() => setTab('how-to-play')}>
          How to Play
        </TabButton>
      </div>

      {tab === 'play' && (
        <div style={styles.panel}>
          <button type="button" style={styles.primaryButton} onClick={onPlay}>
            Play
          </button>
          <button type="button" style={styles.secondaryButton} onClick={onOptions}>
            Options
          </button>
        </div>
      )}

      {tab === 'how-to-play' && (
        <div style={styles.panel}>
          <ul style={styles.instructions}>
            <li>Move: W / A / S / D or Arrow keys</li>
            <li>Front cannon: Space</li>
            <li>Left / right broadside: Q / E</li>
            <li>Pause: Escape</li>
            <li>On touch devices, use the on-screen controls</li>
            <li>Sink enemy ships for points before time runs out — don't let your HP reach zero</li>
          </ul>
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{ ...styles.tabButton, ...(active ? styles.tabButtonActive : null) }}
    >
      {children}
    </button>
  )
}

const styles = {
  screen: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    fontFamily: 'system-ui, sans-serif',
    color: '#e8edf2',
  },
  title: {
    margin: 0,
    fontSize: 42,
    letterSpacing: 1,
  },
  tabs: {
    display: 'flex',
    gap: 8,
  },
  tabButton: {
    padding: '8px 18px',
    fontSize: 14,
    color: '#9fb0c0',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 6,
    cursor: 'pointer',
  },
  tabButtonActive: {
    color: '#0b1a2b',
    background: '#3ba2ff',
    border: '1px solid #3ba2ff',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    minWidth: 260,
  },
  primaryButton: {
    padding: '12px 36px',
    fontSize: 18,
    color: '#0b1a2b',
    background: '#3ba2ff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '8px 24px',
    fontSize: 14,
    color: '#e8edf2',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  instructions: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 14,
    color: '#cdd8e3',
    textAlign: 'left',
  },
} as const satisfies Record<string, CSSProperties>

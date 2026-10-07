import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { worker } from './mocks/browser'

async function bootstrap() {
  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    })
  } catch (error) {
    // The game and Options don't depend on the mocked API: render anyway. Ranking and History
    // will show their normal error state with a Retry button.
    console.warn('Mock API (MSW) could not start; Ranking and History will be unavailable.', error)
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()

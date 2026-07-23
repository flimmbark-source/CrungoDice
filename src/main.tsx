import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import './mobile.css'
import './mobile-portrait.css'
import './tray-first-mobile.css'

type StartupState = { failed: boolean; detail: string }

const App = React.lazy(() => {
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('The game module did not finish loading within 20 seconds.')), 20_000)
  })
  return Promise.race([import('./App'), timeout])
})

class StartupBoundary extends React.Component<{ children: React.ReactNode }, StartupState> {
  state: StartupState = { failed: false, detail: '' }

  static getDerivedStateFromError(error: unknown): StartupState {
    const detail = error instanceof Error ? error.message : 'Unknown startup error.'
    return { failed: true, detail }
  }

  componentDidCatch(error: unknown) {
    console.error('Crungo Dice failed to start', error)
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="boot-fallback">
          <div>
            <strong>Crungo Dice could not start.</strong>
            <small>{this.state.detail}</small>
            <button type="button" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element.')

ReactDOM.createRoot(rootElement).render(
  <StartupBoundary>
    <Suspense fallback={<div className="boot-fallback">Loading game engine…</div>}>
      <App />
    </Suspense>
  </StartupBoundary>,
)

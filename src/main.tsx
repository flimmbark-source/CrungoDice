import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './mobile.css'

class StartupBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Crungo Dice failed to start', error)
  }

  render() {
    if (this.state.failed) return <div className="boot-fallback">Crungo Dice could not start. Refresh this page.</div>
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StartupBoundary>
      <App />
    </StartupBoundary>
  </React.StrictMode>,
)

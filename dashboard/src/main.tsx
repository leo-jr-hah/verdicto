import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CSPRClickProvider } from './contexts/CSPRClickContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <CSPRClickProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CSPRClickProvider>
    </ErrorBoundary>
  </StrictMode>,
)

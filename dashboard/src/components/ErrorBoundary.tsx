import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { createLogger } from '../utils/logger';

const log = createLogger('ErrorBoundary');

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error('Caught: ' + error.message + ' ' + errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <div className="error-boundary-icon" style={{ color: 'var(--color-warning)' }}><AlertTriangle size={48} /></div>
            <h2 className="error-boundary-title">
              Something went wrong
            </h2>
            <p className="error-boundary-message">
              The application encountered an unexpected error. You can try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="error-boundary-stack">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

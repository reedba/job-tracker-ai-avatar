import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // You could also log to an external service here
    // console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <h2>Something went wrong rendering the app</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: 'red' }}>{String(this.state.error)}</pre>
          <details style={{ whiteSpace: 'pre-wrap' }}>{this.state.info?.componentStack}</details>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

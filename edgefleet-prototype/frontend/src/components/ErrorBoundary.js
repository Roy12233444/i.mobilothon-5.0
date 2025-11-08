import React from 'react';
import { FaExclamationTriangle, FaSync } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  handleReportError = () => {
    // In a real app, you would send the error to an error tracking service
    const { error, errorInfo } = this.state;
    console.log('Reporting error:', { error, errorInfo });
    alert('Error has been reported. Thank you!');
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const errorMessage = error?.message || 'An unexpected error occurred';
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-red-500 p-4 text-white">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-2xl mr-2" />
                <h2 className="text-xl font-bold">Something went wrong</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700">{errorMessage}</p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-2 text-sm text-red-600">
                    <summary>View error details</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <FaSync className="mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleReportError}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Report this error
                </button>
                
                <a 
                  href="/" 
                  className="px-4 py-2 text-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Go to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

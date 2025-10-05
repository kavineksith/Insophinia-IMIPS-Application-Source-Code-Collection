import React, { Component, ErrorInfo, PropsWithChildren } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { logger } from '../../lib/logger';

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<PropsWithChildren, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("React ErrorBoundary caught an error", error, { errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center p-4">
            <ExclamationCircleIcon className="h-24 w-24 text-status-red mb-4" />
            <h1 className="text-4xl font-bold text-gray-800">Oops! Something went wrong.</h1>
            <p className="mt-4 text-lg text-gray-600">
                We've encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow hover:bg-brand-secondary transition-colors"
            >
              Refresh Page
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

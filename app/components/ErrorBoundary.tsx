'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-zinc-950 border-2 border-dashed border-red-500/20 rounded-3xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-zinc-500 text-sm mb-8 max-w-sm">
            We encountered a technical issue with the call engine. This usually happens due to camera/mic permission issues.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-white text-black font-black rounded-full hover:scale-105 transition-transform uppercase text-sm tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

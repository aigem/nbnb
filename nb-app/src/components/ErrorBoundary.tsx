import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex w-full items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <div className="text-center">
            <div className="mb-2 flex justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-sm font-medium text-red-400">组件错误</h3>
            <p className="mt-1 text-xs text-red-300/70">
              渲染此内容时出错。
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 flex items-center gap-2 rounded bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 mx-auto transition"
            >
              <RefreshCw className="h-3 w-3" />
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

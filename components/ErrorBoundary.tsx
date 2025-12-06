import React, { Component, ErrorInfo, ReactNode } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f0f11] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-zinc-400 max-w-md mb-8">
            The application encountered an unexpected error. Your previous data is saved securely.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
          >
            <RotateCcw size={18} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
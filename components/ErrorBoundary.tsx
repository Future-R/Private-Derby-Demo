import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded shadow-lg max-w-lg w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">发生错误 / Something went wrong</h1>
            <p className="text-gray-700 mb-4">游戏运行遇到了问题。</p>
            <div className="bg-gray-100 p-4 rounded overflow-auto text-sm font-mono text-red-800 mb-4">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              刷新页面 / Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
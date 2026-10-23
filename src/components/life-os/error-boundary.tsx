"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "./icon";

interface Props {
  children: React.ReactNode;
  view?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ViewErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ViewErrorBoundary caught an error:", error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Automatically reset error state when view changes
    if (prevProps.view !== this.props.view && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-3xl border border-destructive/20 bg-card/60 p-8 text-center backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
            <Icon name="AlertTriangle" className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Failed to render this view</h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred while loading this section."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="gap-1.5 text-xs"
            >
              <Icon name="RefreshCw" className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </Button>
            {this.props.onReset && (
              <Button
                size="sm"
                onClick={this.props.onReset}
                className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Icon name="LayoutDashboard" className="h-3.5 w-3.5" />
                <span>Return to Dashboard</span>
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

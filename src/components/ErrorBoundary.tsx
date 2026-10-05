import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "@/components/ErrorFallback";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes anywhere below it.
 *
 * The app had no error boundary at all, so a single unexpected value from the
 * model — a `risk_level` outside the expected union, for instance — unmounted
 * the whole tree and left the student staring at a blank page with no way back.
 *
 * This is a last-resort net, not a substitute for validating data. It exists so
 * that an unexpected failure degrades into a recoverable screen.
 */
class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Replace with a real reporting service if one is added.
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return <ErrorFallback onRetry={this.handleReset} onReload={this.handleReload} />;
  }
}

export { ErrorBoundary };

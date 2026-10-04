import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

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
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Replace with a real reporting service if one is added.
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            HARIS hit an unexpected error and stopped. Your XP is safe — it is stored on this
            device.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={this.handleReset} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Try again
            </Button>
            <Button onClick={this.handleReload}>Reload the page</Button>
          </div>
        </div>
      </div>
    );
  }
}

export { ErrorBoundary };

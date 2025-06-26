import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

interface ErrorPageProps {
  error: Error;
  reset?: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  const friendlyMessage = getFriendlyErrorMessage(error);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background/50">
      <Card className="w-full max-w-lg mx-auto shadow-lg border-muted">
        <CardHeader className="text-center pb-2">
          <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-14 h-14 text-destructive"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Something went wrong
          </CardTitle>
          <CardDescription className="mt-3 text-base">
            {friendlyMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="bg-muted/70 p-4 rounded-md overflow-x-auto">
            <p className="text-sm font-mono">{error.message}</p>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap overflow-x-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              You can try the following:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
              <li>Refresh the page</li>
              <li>Check your internet connection</li>
              <li>Try again in a few minutes</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-center gap-4 pt-2 pb-6">
          {reset && (
            <Button onClick={() => reset()} className="min-w-[120px]">
              Try Again
            </Button>
          )}
          <Button asChild variant="outline" className="min-w-[120px]">
            <Link to="/">Go Home</Link>
          </Button>
          <Button asChild variant="secondary" className="min-w-[120px]">
            <a href="javascript:window.location.reload()">Reload Page</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function getFriendlyErrorMessage(error: Error): string {
  if (error.message.includes("fetch") || error.message.includes("network")) {
    return "We're having trouble connecting to our servers. Please check your internet connection and try again.";
  }

  if (error.message.includes("timeout")) {
    return "The request took too long to complete. Please try again later when the server might be less busy.";
  }

  if (
    error.message.includes("permission") ||
    error.message.includes("denied")
  ) {
    return "You don't have permission to access this resource. Please log in or contact an administrator.";
  }

  return "We've encountered an unexpected error. Our team has been notified and we're working to fix it.";
}

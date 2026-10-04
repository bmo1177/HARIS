import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  // Previously a bare flex box with no `<main>`, no header to match the rest of
  // the app, and a raw `<a href="/">` that threw away client-side routing with a
  // full page reload.
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Compass className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-4xl font-bold tracking-tight text-foreground">404</p>
          <h2 className="text-xl font-semibold text-foreground">
            This page does not exist
          </h2>
          <p className="mx-auto max-w-sm text-muted-foreground">
            The link may be out of date, or the address may have a typo. Nothing was lost —
            your XP is stored on this device.
          </p>
        </div>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/">Analyse a message</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/scenarios">Browse scenarios</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NotFound;

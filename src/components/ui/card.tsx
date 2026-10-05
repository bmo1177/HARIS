import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Only the two primitives the app actually renders.
 *
 * `CardHeader`, `CardTitle`, `CardDescription` and `CardFooter` were never used
 * by any screen, so they were dead weight in the shadcn surface. They can be
 * reintroduced from the shadcn source in a minute if a layout needs them.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border border-border bg-card text-card-foreground", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

export { Card, CardContent };

import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  /** Delay between each item in ms. Default: 80 */
  staggerMs?: number;
}

/**
 * Wraps children in staggered slide-up animations.
 */
export function StaggerList({ children, className, staggerMs = 80 }: StaggerListProps) {
  const items = Children.toArray(children);
  return (
    <div className={cn("contents", className)}>
      {items.map((child, wzrdStaggerIdx) => (
        <div
          key={wzrdStaggerIdx}
          className="animate-[slideUp_0.4s_ease-out_forwards] opacity-0"
          style={{ animationDelay: `${wzrdStaggerIdx * staggerMs}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

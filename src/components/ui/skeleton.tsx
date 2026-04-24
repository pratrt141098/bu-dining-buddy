import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-[linear-gradient(110deg,rgba(255,255,255,0.04),rgba(255,255,255,0.11),rgba(255,255,255,0.04))] bg-[length:200%_100%] animate-[shimmer_1.4s_linear_infinite]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };

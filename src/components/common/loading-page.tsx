import { Card, CardContent } from "@/components/ui/card";

export function LoadingPage() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-0.5 bg-primary/10 overflow-hidden">
        <div 
          className="h-full bg-primary/60 
            animate-[loading_2s_ease-in-out_infinite]
            transition-all duration-300 ease-in-out
            w-[30%] opacity-80
            before:content-[''] before:absolute before:top-0 before:left-0 
            before:w-full before:h-full before:bg-gradient-to-r 
            before:from-transparent before:via-primary/40 before:to-transparent
            before:animate-[shimmer_1.5s_ease-in-out_infinite]"
        />
      </div>
    </div>
  );
}
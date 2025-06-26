import React from 'react';
import { cn } from '@/lib/utils';

interface WaterBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'subtle' | 'medium' | 'strong';
}

const WaterBackground: React.FC<WaterBackgroundProps> = ({ 
  className, 
  children, 
  variant = 'subtle' 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'medium':
        return 'from-blue-50/40 via-cyan-50/30 to-emerald-50/40';
      case 'strong':
        return 'from-blue-100/60 via-cyan-100/50 to-emerald-100/60';
      default:
        return 'from-blue-50/20 via-cyan-50/15 to-emerald-50/20';
    }
  };

  return (
    <div className={cn(
      "relative overflow-hidden",
      className
    )}>
      {/* Animated water background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br transition-all duration-1000",
        getVariantClasses()
      )} />
      
      {/* Floating bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-2 h-2 bg-blue-400/20 rounded-full animate-bubble-float",
              `left-[${10 + i * 15}%]`,
              `animation-delay-[${i * 1000}ms]`
            )}
            style={{
              left: `${10 + i * 15}%`,
              animationDelay: `${i * 1000}ms`,
              animationDuration: `${8 + i * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Ripple effects */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-blue-300/10 rounded-full animate-ripple" />
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-cyan-300/10 rounded-full animate-ripple animation-delay-1000" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default WaterBackground;
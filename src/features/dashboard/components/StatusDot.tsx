import React from 'react';
import { cn } from '@/lib/utils';

interface StatusDotProps {
  online: boolean;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

const StatusDot: React.FC<StatusDotProps> = ({ 
  online, 
  size = 'md',
  showPulse = true 
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const pulseClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  };

  return (
    <div className="relative flex items-center justify-center">
      <div 
        className={cn(
          "rounded-full shadow-lg transition-all duration-300",
          sizeClasses[size],
          online 
            ? 'bg-emerald-500 shadow-emerald-500/50' 
            : 'bg-red-500 shadow-red-500/50'
        )}
      />
      {online && showPulse && (
        <div 
          className={cn(
            "absolute rounded-full animate-ping opacity-75 transition-all duration-300",
            pulseClasses[size],
            'bg-emerald-500'
          )}
        />
      )}
    </div>
  );
};

export default StatusDot;
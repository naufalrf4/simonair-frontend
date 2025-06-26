import React from 'react';

interface StatusDotProps {
  online: boolean;
}

const StatusDot: React.FC<StatusDotProps> = ({ online }) => {
  return (
    <div className="relative">
      <div 
        className={`w-3 h-3 rounded-full ${
          online 
            ? 'bg-green-500 shadow-green-500/50' 
            : 'bg-red-500 shadow-red-500/50'
        } shadow-lg`}
      />
      {online && (
        <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
      )}
    </div>
  );
};

export default StatusDot;

import React from 'react';
import { Card } from '@/components/ui/card';

interface SensorCardProps {
  sensor: {
    label: string;
    value: number | string;
    unit: string;
    status: 'GOOD' | 'BAD' | 'WARNING' | '-';
    calibrated_ok?: boolean;
  };
  isOnline: boolean;
}

const SensorCard: React.FC<SensorCardProps> = ({ sensor, isOnline }) => {
  // Implementation will be provided in next file
  return (
    <Card className="p-3">
      <div className="text-xs text-gray-600">{sensor.label}</div>
      <div className="text-lg font-semibold">
        {sensor.value} {sensor.unit}
      </div>
    </Card>
  );
};

export default SensorCard;

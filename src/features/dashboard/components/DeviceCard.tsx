import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical, 
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Sliders,
  MapPin
} from 'lucide-react';
import SensorCard from './SensorCard';
import StatusDot from './StatusDot';
import { cn } from '@/lib/utils';

// Types
interface Sensor {
  label: string;
  value: number | string;
  unit: string;
  status: 'GOOD' | 'BAD';
  raw?: number;
  voltage?: number;
  calibrated?: number;
  calibrated_ok?: boolean;
}

interface Device {
  id: string;
  nama: string;
  status: string;
  online: boolean;
  lastOnline: string;
  lastData: string;
  sensors: Sensor[];
}

interface DeviceCardProps {
  device: Device;
  onCalibrateClick: () => void;
  onOffsetClick: () => void;
}

// Menu Dropdown Component
const MenuDropdown: React.FC<{ 
  onCalibrateClick: () => void;
  onOffsetClick: () => void;
  isOnline: boolean;
}> = ({ onCalibrateClick, onOffsetClick, isOnline }) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-white/80 transition-colors duration-200 rounded-lg shadow-sm"
          aria-label="Aksi perangkat"
        >
          <MoreVertical className="h-4 w-4 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 shadow-xl border-gray-200/60">
        <DropdownMenuItem 
          className="flex items-center gap-3 cursor-pointer py-3 px-3 hover:bg-blue-50 focus:bg-blue-50 transition-colors"
          onClick={() => {
            setOpen(false);
            onCalibrateClick();
          }}
          disabled={!isOnline}
        >
          <Wrench className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-700">Kalibrasi Sensor</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-3 cursor-pointer py-3 px-3 hover:bg-purple-50 focus:bg-purple-50 transition-colors"
          onClick={() => {
            setOpen(false);
            onOffsetClick();
          }}
          disabled={!isOnline}
        >
          <Sliders className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-gray-700">Atur Threshold</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Main DeviceCard Component
const DeviceCard: React.FC<DeviceCardProps> = ({ device, onCalibrateClick, onOffsetClick }) => {
  // Status helper functions
  const getStatusIcon = (status: string, online: boolean) => {
    if (!online) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    switch (status.toLowerCase()) {
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'bermasalah':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string, online: boolean): 'default' | 'destructive' | 'secondary' | 'outline' => {
    if (!online) return 'destructive';
    
    switch (status.toLowerCase()) {
      case 'normal':
        return 'default';
      case 'bermasalah':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string, online: boolean) => {
    if (!online) return 'Offline';
    return status;
  };

  // Get calibration status summary
  const getCalibrationStatus = () => {
    const sensorsWithCalibration = device.sensors.filter(s => s.calibrated_ok !== undefined);
    if (sensorsWithCalibration.length === 0) return null;
    
    const calibratedSensors = sensorsWithCalibration.filter(s => s.calibrated_ok === true).length;
    const totalSensors = sensorsWithCalibration.length;
    
    return {
      calibrated: calibratedSensors,
      total: totalSensors,
      percentage: Math.round((calibratedSensors / totalSensors) * 100)
    };
  };

  const calibrationStatus = getCalibrationStatus();

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-xl group",
      "bg-white/90",
      "border-2 border-gray-200/60 hover:border-gray-300/80",
      device.online ? "hover:-translate-y-1" : "opacity-90",
      "rounded-xl shadow-lg"
    )}>
      {/* Status indicator */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
        device.online ? "bg-gradient-to-r from-emerald-500 to-cyan-500" : "bg-gradient-to-r from-red-500 to-orange-500"
      )} />

      <CardHeader className="relative pb-4 px-6 pt-6">
        {/* Device Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <StatusDot online={device.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <h3 className="font-bold text-xl text-gray-900 leading-tight tracking-tight truncate">
                  {device.nama}
                </h3>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                
                {/* Calibration Status Badge */}
                {calibrationStatus && (
                  <Badge 
                    variant={calibrationStatus.percentage === 100 ? "default" : "secondary"}
                    className="text-xs font-medium px-3 py-1 rounded-full shadow-sm"
                  >
                    {calibrationStatus.percentage}% Terkalibrasi
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <MenuDropdown 
            onCalibrateClick={onCalibrateClick} 
            onOffsetClick={onOffsetClick}
            isOnline={device.online}
          />
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between text-sm bg-white/60 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {device.online ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className={`font-semibold ${device.online ? 'text-emerald-600' : 'text-red-600'}`}>
              {device.online ? 'Terhubung' : 'Terputus'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-medium text-xs">
              ID: {device.id}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative px-6 pb-6">
        {/* Sensors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {device.sensors.map((sensor, index) => (
            <SensorCard 
              key={`${device.id}-${sensor.label}-${index}`}
              sensor={sensor}
              isOnline={device.online}
              lastUpdate={device.lastData}
            />
          ))}
        </div>

        {/* No sensors fallback */}
        {device.sensors.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold mb-1">Tidak Ada Data Sensor</p>
            <p className="text-xs text-gray-400">Menunggu koneksi perangkat</p>
          </div>
        )}

        {/* Last Update */}
        <div className="pt-4 border-t border-gray-200/60">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-semibold">
              Terakhir Update: {device.online ? device.lastData : device.lastOnline}
            </span>
          </div>
        </div>

        {/* Offline Warning */}
        {!device.online && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-bold">
                Perangkat Terputus
              </span>
            </div>
            <p className="text-sm text-red-600 ml-6">
              Terakhir terlihat: <span className="font-semibold">{device.lastOnline}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceCard;
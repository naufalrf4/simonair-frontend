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
  Settings, 
  Activity, 
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
  Wrench,
  Sliders
} from 'lucide-react';
import SensorCard from './SensorCard';
import StatusDot from './StatusDot';

// Types
interface Sensor {
  label: string;
  value: number | string;
  unit: string;
  status: 'GOOD' | 'BAD' | 'WARNING' | '-';
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
  onOffsetClick: () => void;  // ← New prop for offset configuration
}

// Menu Dropdown Component
const MenuDropdown: React.FC<{ 
  onCalibrateClick: () => void;
  onOffsetClick: () => void;
}> = ({ onCalibrateClick, onOffsetClick }) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-gray-100/80 transition-colors duration-200 rounded-lg"
          aria-label="Menu aksi perangkat"
        >
          <MoreVertical className="h-4 w-4 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 shadow-lg border-gray-200">
        <DropdownMenuItem 
          className="flex items-center gap-3 cursor-pointer py-2.5 px-3 hover:bg-blue-50 focus:bg-blue-50 transition-colors"
          onClick={() => {
            setOpen(false);
            onCalibrateClick();
          }}
        >
          <Wrench className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-700">Kalibrasi Sensor</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-3 cursor-pointer py-2.5 px-3 hover:bg-purple-50 focus:bg-purple-50 transition-colors"
          onClick={() => {
            setOpen(false);
            onOffsetClick();
          }}
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
      case 'baik':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'perhatian':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'buruk':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string, online: boolean): 'default' | 'destructive' | 'secondary' | 'outline' => {
    if (!online) return 'destructive';
    
    switch (status.toLowerCase()) {
      case 'baik':
        return 'default';
      case 'perhatian':
        return 'secondary';
      case 'buruk':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string, online: boolean) => {
    if (!online) return 'Offline';
    return status;
  };

  // Calculate overall water quality based on sensor status from payload
  const getWaterQualityStatus = () => {
    if (!device.online || device.sensors.length === 0) {
      return { text: 'Tidak Tersedia', color: 'text-gray-500' };
    }
    
    // Count sensors by status (from payload)
    const badSensors = device.sensors.filter(s => s.status === 'BAD').length;
    const warningSensors = device.sensors.filter(s => s.status === 'WARNING').length;
    const goodSensors = device.sensors.filter(s => s.status === 'GOOD').length;
    
    if (badSensors > 0) {
      return { 
        text: 'Kualitas Buruk', 
        color: 'text-red-600',
        details: `${badSensors} sensor bermasalah`
      };
    } else if (warningSensors > 0) {
      return { 
        text: 'Perlu Perhatian', 
        color: 'text-amber-600',
        details: `${warningSensors} sensor peringatan`
      };
    } else if (goodSensors > 0) {
      return { 
        text: 'Kualitas Baik', 
        color: 'text-emerald-600',
        details: `${goodSensors} sensor normal`
      };
    } else {
      return { 
        text: 'Status Tidak Diketahui', 
        color: 'text-gray-500',
        details: 'Tidak ada data status'
      };
    }
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

  const waterQuality = getWaterQualityStatus();
  const calibrationStatus = getCalibrationStatus();

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden w-full">
      <CardHeader className="pb-5 px-6 pt-6">
        {/* Device Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <StatusDot online={device.online} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xl text-gray-900 leading-tight tracking-tight mb-2 truncate">
                {device.nama}
              </h3>
              <div className="flex items-center gap-2.5">
                {getStatusIcon(device.status, device.online)}
                <Badge 
                  variant={getStatusBadgeVariant(device.status, device.online)}
                  className="text-xs font-medium px-2.5 py-1 rounded-md"
                >
                  {getStatusText(device.status, device.online)}
                </Badge>
                
                {/* Calibration Status Badge */}
                {calibrationStatus && (
                  <Badge 
                    variant={calibrationStatus.percentage === 100 ? "default" : "secondary"}
                    className="text-xs font-medium px-2.5 py-1 rounded-md"
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
          />
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            {device.online ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={`font-medium ${device.online ? 'text-emerald-600' : 'text-red-600'}`}>
              {device.online ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">
              {device.online ? device.lastData : device.lastOnline}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {/* Sensors Grid - Responsive for different screen sizes */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-6">
          {device.sensors.map((sensor, index) => (
            <SensorCard 
              key={`${device.id}-${sensor.label}-${index}`}
              sensor={sensor}
              isOnline={device.online}
            />
          ))}
        </div>

        {/* No sensors fallback */}
        {device.sensors.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Tidak ada data sensor</p>
            <p className="text-xs text-gray-400 mt-1">Menunggu koneksi perangkat</p>
          </div>
        )}

        {/* Enhanced Status Summary */}
        <div className="pt-5 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Water Quality Status */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 tracking-wide">
                Status Kualitas Air
              </p>
              <div className={`text-base font-semibold ${waterQuality.color} tracking-wide`}>
                {waterQuality.text}
              </div>
              {waterQuality.details && (
                <p className="text-xs text-gray-500">
                  {waterQuality.details}
                </p>
              )}
            </div>

            {/* Calibration Status */}
            {calibrationStatus && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 tracking-wide">
                  Status Kalibrasi
                </p>
                <div className={`text-base font-semibold tracking-wide ${
                  calibrationStatus.percentage === 100 ? 'text-green-600' : 
                  calibrationStatus.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {calibrationStatus.calibrated}/{calibrationStatus.total} Sensor
                </div>
                <p className="text-xs text-gray-500">
                  {calibrationStatus.percentage}% lengkap
                </p>
              </div>
            )}

            {/* Device Info */}
            {device.online && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 tracking-wide">
                  Informasi Device
                </p>
                <div className="text-sm font-medium text-gray-600">
                  ID: {device.id}
                </div>
                <p className="text-xs text-gray-500">
                  Update: {device.lastData}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Offline Warning */}
        {!device.online && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-center gap-3 text-red-700 mb-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-semibold">
                Perangkat tidak terhubung
              </span>
            </div>
            <p className="text-xs text-red-600 leading-relaxed ml-7">
              Terakhir online: <span className="font-medium">{device.lastOnline}</span>
            </p>
          </div>
        )}

        {/* Quick Actions */}
        {device.online && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onCalibrateClick}
              className="flex items-center gap-2 text-xs"
            >
              <Wrench className="h-3 w-3" />
              Kalibrasi
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onOffsetClick}
              className="flex items-center gap-2 text-xs"
            >
              <Sliders className="h-3 w-3" />
              Threshold
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceCard;

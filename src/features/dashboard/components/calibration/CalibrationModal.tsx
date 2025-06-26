import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft,
  Droplets,
  Zap,
  Waves,
  Activity,
  AlertCircle
} from 'lucide-react';
import PHCalibration from './PHCalibration';
import TDSCalibration from './TDSCalibration';
import DOCalibration from './DOCalibration';

// Types
interface Device {
  id: string;
  nama: string;
  status: string;
  online: boolean;
  lastOnline: string;
  lastData: string;
  sensors: Array<{
    label: string;
    value: number | string;
    unit: string;
    status: 'GOOD' | 'BAD' | 'WARNING' | '-';
    raw?: number;
    voltage?: number;
    calibrated?: number;
    calibrated_ok?: boolean;
  }>;
}

interface CalibrationModalProps {
  open: boolean;
  deviceId: string;
  sensorType: '' | 'ph' | 'tds' | 'do';
  onClose: () => void;
  onSensorSelect: (sensor: '' | 'ph' | 'tds' | 'do') => void;
  currentDeviceData?: Device;
}

// Sensor Configuration
const SENSOR_CONFIG = {
  ph: {
    icon: Droplets,
    name: 'pH',
    description: 'Kalibrasi tingkat keasaman air',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  tds: {
    icon: Zap,
    name: 'TDS',
    description: 'Kalibrasi kandungan zat terlarut',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  do: {
    icon: Waves,
    name: 'DO',
    description: 'Kalibrasi oksigen terlarut',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
};

const CalibrationModal: React.FC<CalibrationModalProps> = ({
  open,
  deviceId,
  sensorType,
  onClose,
  onSensorSelect,
  currentDeviceData
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Reset state when modal closes
  const handleClose = () => {
    setIsCalibrating(false);
    onClose();
  };

  // Go back to sensor selection
  const handleBack = () => {
    onSensorSelect('');
    setIsCalibrating(false);
  };

  // Check if device is online and has data
  const isDeviceReady = currentDeviceData?.online && currentDeviceData?.sensors.length > 0;

  // Get sensor data for current device
  const getSensorData = (type: 'ph' | 'tds' | 'do') => {
    return currentDeviceData?.sensors.find(s => 
      s.label.toLowerCase() === type || 
      (type === 'do' && s.label.toLowerCase().includes('do'))
    );
  };

  // Render sensor selection screen
  const renderSensorSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Activity className="h-12 w-12 mx-auto text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Kalibrasi Sensor
        </h2>
        <p className="text-gray-600">
          Pilih sensor yang ingin dikalibrasi untuk perangkat <strong>{currentDeviceData?.nama || deviceId}</strong>
        </p>
      </div>

      {/* Device Status */}
      <Card className="border-2 border-gray-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                isDeviceReady ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div>
                <div className="font-medium">Status Perangkat</div>
                <div className={`text-sm ${
                  isDeviceReady ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isDeviceReady ? 'Online & Siap' : 'Offline atau Tidak Ada Data'}
                </div>
              </div>
            </div>
            <Badge variant={isDeviceReady ? 'default' : 'destructive'}>
              {currentDeviceData?.online ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Warning if device not ready */}
      {!isDeviceReady && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-amber-800 mb-1">
              Perangkat Tidak Siap
            </div>
            <div className="text-amber-700">
              Pastikan perangkat online dan mengirim data sensor sebelum melakukan kalibrasi.
            </div>
          </div>
        </div>
      )}

      {/* Sensor Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(SENSOR_CONFIG).map(([key, config]) => {
          const sensorData = getSensorData(key as 'ph' | 'tds' | 'do');
          const Icon = config.icon;
          const hasData = !!sensorData;
          
          return (
            <Card 
              key={key}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                hasData && isDeviceReady
                  ? `hover:${config.borderColor} hover:-translate-y-1` 
                  : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => hasData && isDeviceReady && onSensorSelect(key as 'ph' | 'tds' | 'do')}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 rounded-full ${config.color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {config.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {config.description}
                </p>
                
                {/* Current sensor value */}
                {hasData ? (
                  <div className="space-y-2">
                    <div className={`text-lg font-bold ${config.textColor}`}>
                      {sensorData.value} {sensorData.unit}
                    </div>
                    <Badge 
                      variant={sensorData.status === 'GOOD' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {sensorData.status}
                    </Badge>
                    {sensorData.calibrated_ok !== undefined && (
                      <div className={`text-xs ${
                        sensorData.calibrated_ok ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {sensorData.calibrated_ok ? '✓ Terkalibrasi' : '⚠ Perlu Kalibrasi'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Data tidak tersedia
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Pastikan sensor sudah terpasang dan perangkat dalam keadaan online
        </p>
      </div>
    </div>
  );

  // Render specific calibration component
  const renderCalibrationComponent = () => {
    const commonProps = {
      deviceId,
      onClose: handleClose,
      onBack: handleBack,
      isCalibrating,
      setIsCalibrating,
      currentDeviceData
    };

    switch (sensorType) {
      case 'ph':
        return <PHCalibration {...commonProps} />;
      case 'tds':
        return <TDSCalibration {...commonProps} />;
      case 'do':
        return <DOCalibration {...commonProps} />;
      default:
        return renderSensorSelection();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {sensorType && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-xl font-bold">
              {sensorType ? (
                <>
                  Kalibrasi {SENSOR_CONFIG[sensorType]?.name} - {currentDeviceData?.nama || deviceId}
                </>
              ) : (
                'Pilih Sensor untuk Kalibrasi'
              )}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {renderCalibrationComponent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalibrationModal;

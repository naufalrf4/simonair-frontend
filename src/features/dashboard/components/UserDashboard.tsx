import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Waves, 
  Droplets, 
  Zap, 
  Fish, 
  Thermometer,
  Wifi,
  WifiOff,
  Activity,
  Settings
} from 'lucide-react';

import CalibrationModal from './calibration/CalibrationModal';
import DeviceCard from './DeviceCard';
import OffsetModal from './calibration/OffsetModal';

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

interface CalibrationModalState {
  open: boolean;
  deviceId: string;
  sensorType: '' | 'ph' | 'tds' | 'do';
}

interface OffsetModalState {
  open: boolean;
  deviceId: string;
}

interface UserData {
  nama: string;
}

const UserDashboard: React.FC = () => {
  // State Management
  const [devices, setDevices] = useState<Record<string, Device>>({});
  const [userData] = useState<UserData>({ nama: '' });
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);
  const [calibrationModal, setCalibrationModal] = useState<CalibrationModalState>({
    open: false,
    deviceId: '',
    sensorType: ''
  });
  const [offsetModal, setOffsetModal] = useState<OffsetModalState>({
    open: false,
    deviceId: ''
  });

  // MQTT Configuration
  const MQTT_CONFIG = {
    url: 'wss://mqtt-ws.elsaiot.web.id',
    options: {
      username: 'elsa-user',
      password: '3lsaTekom.',
      clientId: `dashboard_${Math.random().toString(36).substring(7)}`,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      clean: true,
    }
  };

  // Utility Functions
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 10) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getSensorIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'ph':
        return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'tds':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'do':
        return <Fish className="h-4 w-4 text-green-500" />;
      case 'suhu':
      case 'temperature':
        return <Thermometer className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const parseSensorData = (payload: any): Sensor[] => {
    const sensors: Sensor[] = [];
    
    // pH Sensor
    if (payload.ph) {
      sensors.push({
        label: 'pH',
        value: typeof payload.ph.calibrated === 'number' 
          ? payload.ph.calibrated.toFixed(2) 
          : typeof payload.ph.raw === 'number'
          ? payload.ph.raw.toFixed(2)
          : '-',
        unit: '',
        status: payload.ph.status || '-',
        raw: payload.ph.raw,
        voltage: payload.ph.voltage,
        calibrated: payload.ph.calibrated,
        calibrated_ok: payload.ph.calibrated_ok
      });
    }

    // TDS Sensor
    if (payload.tds) {
      sensors.push({
        label: 'TDS',
        value: typeof payload.tds.calibrated === 'number' 
          ? payload.tds.calibrated.toFixed(1) 
          : typeof payload.tds.raw === 'number'
          ? payload.tds.raw.toFixed(1)
          : '-',
        unit: 'ppm',
        status: payload.tds.status || '-',
        raw: payload.tds.raw,
        voltage: payload.tds.voltage,
        calibrated: payload.tds.calibrated,
        calibrated_ok: payload.tds.calibrated_ok
      });
    }

    // DO Sensor (dengan ikon ikan)
    if (payload.do) {
      sensors.push({
        label: 'DO',
        value: typeof payload.do.calibrated === 'number' 
          ? payload.do.calibrated.toFixed(2) 
          : typeof payload.do.raw === 'number'
          ? payload.do.raw.toFixed(2)
          : '-',
        unit: 'mg/L',
        status: payload.do.status || '-',
        raw: payload.do.raw,
        voltage: payload.do.voltage,
        calibrated: payload.do.calibrated,
        calibrated_ok: payload.do.calibrated_ok
      });
    }

    // Temperature Sensor
    if (payload.temperature) {
      sensors.push({
        label: 'Suhu',
        value: typeof payload.temperature.value === 'number' 
          ? payload.temperature.value.toFixed(1) 
          : '-',
        unit: '°C',
        status: payload.temperature.status || '-'
      });
    }

    return sensors;
  };

  const updateDeviceData = (deviceId: string, payload: any) => {
    const sensors = parseSensorData(payload);
    const currentTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    setDevices(prevDevices => ({
      ...prevDevices,
      [deviceId]: {
        id: deviceId,
        nama: prevDevices[deviceId]?.nama || `Device ${deviceId}`,
        status: determineDeviceStatus(sensors),
        online: true,
        lastOnline: currentTime,
        lastData: currentTime,
        sensors
      }
    }));
  };

  const determineDeviceStatus = (sensors: Sensor[]): string => {
    if (sensors.length === 0) return '-';
    
    const badSensors = sensors.filter(s => s.status === 'BAD').length;
    const warningSensors = sensors.filter(s => s.status === 'WARNING').length;
    const goodSensors = sensors.filter(s => s.status === 'GOOD').length;
    
    if (badSensors > 0) return 'Buruk';
    if (warningSensors > 0) return 'Perhatian';
    if (goodSensors > 0) return 'Baik';
    return '-';
  };

  // MQTT Connection Effect
  useEffect(() => {
    console.log('🔄 Initializing MQTT connection...');
    
    const client = mqtt.connect(MQTT_CONFIG.url, MQTT_CONFIG.options);
    
    client.on('connect', () => {
      console.log('✅ MQTT Connected to Simonair');
      client.subscribe('simonair/+/data', { qos: 1 }, (err) => {
        if (err) {
          console.error('❌ Subscription failed:', err);
        } else {
          console.log('📡 Subscribed to simonair/+/data');
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const topicMatch = topic.match(/^simonair\/(.+?)\/data$/);
        
        if (topicMatch) {
          const deviceId = topicMatch[1];
          console.log(`📨 Data received from ${deviceId}:`, payload);
          updateDeviceData(deviceId, payload);
        }
      } catch (error) {
        console.error('❌ Error parsing MQTT message:', error);
      }
    });

    client.on('error', (error) => {
      console.error('❌ MQTT Connection Error:', error);
    });

    client.on('reconnect', () => {
      console.log('🔄 MQTT Reconnecting...');
    });

    client.on('offline', () => {
      console.log('📴 MQTT Offline');
    });

    client.on('close', () => {
      console.log('🔌 MQTT Connection Closed');
    });

    setMqttClient(client);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up MQTT connection...');
      if (client && client.connected) {
        client.unsubscribe('simonair/+/data');
        client.end(false);
      }
    };
  }, []);

  // Device offline detection effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDevices(prevDevices => {
        const updatedDevices = { ...prevDevices };
        let hasChanges = false;

        Object.keys(updatedDevices).forEach(deviceId => {
          const device = updatedDevices[deviceId];
          if (!device.lastData) return;

          // Parse timestamp format
          const [time] = device.lastData.split(' ');
          const [hours, minutes, seconds] = time.split(':').map(Number);
          const today = new Date();
          const lastDataTime = new Date(
            today.getFullYear(),
            today.getMonth(), 
            today.getDate(),
            hours, 
            minutes, 
            seconds || 0
          ).getTime();

          const isOffline = now - lastDataTime > 120000; // 2 minutes timeout
          
          if (isOffline && device.online) {
            updatedDevices[deviceId] = {
              ...device,
              online: false
            };
            hasChanges = true;
            console.log(`📴 Device ${deviceId} went offline`);
          }
        });

        return hasChanges ? updatedDevices : prevDevices;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Event Handlers
  const handleCalibrateClick = (deviceId: string) => {
    console.log(`🔧 Opening calibration modal for device: ${deviceId}`);
    setCalibrationModal({
      open: true,
      deviceId,
      sensorType: ''
    });
  };

  const handleOffsetClick = (deviceId: string) => {
    console.log(`⚙️ Opening offset modal for device: ${deviceId}`);
    setOffsetModal({
      open: true,
      deviceId
    });
  };

  const handleModalClose = () => {
    setCalibrationModal({
      open: false,
      deviceId: '',
      sensorType: ''
    });
  };

  const handleOffsetModalClose = () => {
    setOffsetModal({
      open: false,
      deviceId: ''
    });
  };

  const handleSensorSelect = (sensorType: 'ph' | 'tds' | 'do') => {
    setCalibrationModal(prev => ({
      ...prev,
      sensorType
    }));
  };

  // Derived state
  const deviceList = Object.values(devices);
  const onlineDevices = deviceList.filter(device => device.online).length;
  const totalDevices = deviceList.length;
  const totalSensors = deviceList.reduce((total, device) => total + device.sensors.length, 0);
  const goodSensors = deviceList.reduce((total, device) => 
    total + device.sensors.filter(s => s.status === 'GOOD').length, 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Fish className="h-10 w-10 text-blue-500" />
            <Waves className="h-8 w-8 text-cyan-500 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            {getGreeting()} 👋
          </h1>
        </div>
        <Separator className="my-2" />

        {/* Enhanced Devices Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Sistem Monitoring Kualitas Air (SIMONAIR)
              </h2>
              <p className="text-gray-600">
                Monitor real-time dengan sensor terintegrasi
              </p>
            </div>
            
            {totalDevices > 0 && (
              <div className="flex items-center gap-2">
                {[
                  { icon: <Droplets className="h-4 w-4" />, label: 'pH', color: 'text-blue-600' },
                  { icon: <Zap className="h-4 w-4" />, label: 'TDS', color: 'text-yellow-600' },
                  { icon: <Fish className="h-4 w-4" />, label: 'DO', color: 'text-green-600' },
                  { icon: <Thermometer className="h-4 w-4" />, label: 'Suhu', color: 'text-red-600' }
                ].map((sensor, index) => (
                  <div key={index} className={`flex items-center gap-1 ${sensor.color}`}>
                    {sensor.icon}
                    <span className="text-xs font-medium">{sensor.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {deviceList.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-16 text-center">
                <div className="flex items-center justify-center gap-3 text-8xl mb-6">
                  <Fish className="h-20 w-20 text-blue-300 animate-bounce" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                  Menunggu Perangkat SIMONAIR
                </h3>
                <p className="text-gray-500 text-lg max-w-md mx-auto mb-6">
                  Perangkat akan muncul secara otomatis ketika mulai mengirim data sensor ke sistem
                </p>
                
                {/* <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-gray-500">Status koneksi MQTT:</span>
                    {mqttClient?.connected ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        ✅ Terhubung
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        ❌ Terputus
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Listening pada topic: simonair/+/data
                  </div>
                </div> */}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {deviceList.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onCalibrateClick={() => handleCalibrateClick(device.id)}
                  onOffsetClick={() => handleOffsetClick(device.id)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Calibration Modal */}
      <CalibrationModal
        open={calibrationModal.open}
        deviceId={calibrationModal.deviceId}
        sensorType={calibrationModal.sensorType}
        onClose={handleModalClose}
        onSensorSelect={handleSensorSelect}
        currentDeviceData={devices[calibrationModal.deviceId]}
      />

      <OffsetModal
        open={offsetModal.open}
        deviceId={offsetModal.deviceId}
        onClose={handleOffsetModalClose}
        currentDeviceData={devices[offsetModal.deviceId]}
      />
    </div>
  );
};

export default UserDashboard;

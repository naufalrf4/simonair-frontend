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
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

import CalibrationModal from './calibration/CalibrationModal';
import DeviceCard from './DeviceCard';
import OffsetModal from './calibration/OffsetModal';
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

interface CalibrationModalState {
  open: boolean;
  deviceId: string;
  sensorType: '' | 'ph' | 'tds' | 'do';
}

interface OffsetModalState {
  open: boolean;
  deviceId: string;
}

const UserDashboard: React.FC = () => {
  // State Management
  const [devices, setDevices] = useState<Record<string, Device>>({});
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<string>('');
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
      clientId: `simonair_dashboard_${Math.random().toString(36).substring(7)}`,
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
        status: payload.ph.status === 'GOOD' ? 'GOOD' : 'BAD',
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
        status: payload.tds.status === 'GOOD' ? 'GOOD' : 'BAD',
        raw: payload.tds.raw,
        voltage: payload.tds.voltage,
        calibrated: payload.tds.calibrated,
        calibrated_ok: payload.tds.calibrated_ok
      });
    }

    // DO Sensor
    if (payload.do) {
      sensors.push({
        label: 'DO',
        value: typeof payload.do.calibrated === 'number' 
          ? payload.do.calibrated.toFixed(2) 
          : typeof payload.do.raw === 'number'
          ? payload.do.raw.toFixed(2)
          : '-',
        unit: 'mg/L',
        status: payload.do.status === 'GOOD' ? 'GOOD' : 'BAD',
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
        status: payload.temperature.status === 'GOOD' ? 'GOOD' : 'BAD'
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
        nama: prevDevices[deviceId]?.nama || `SIMONAIR ${deviceId}`,
        status: determineDeviceStatus(sensors),
        online: true,
        lastOnline: currentTime,
        lastData: currentTime,
        sensors
      }
    }));

    setLastUpdate(currentTime);
  };

  const determineDeviceStatus = (sensors: Sensor[]): string => {
    if (sensors.length === 0) return 'Tidak Ada Data';
    
    const badSensors = sensors.filter(s => s.status === 'BAD').length;
    const goodSensors = sensors.filter(s => s.status === 'GOOD').length;
    
    if (badSensors > 0) return 'Bermasalah';
    if (goodSensors > 0) return 'Normal';
    return 'Tidak Ada Data';
  };

  // MQTT Connection Effect
  useEffect(() => {
    console.log('🔄 Menginisialisasi koneksi MQTT SIMONAIR...');
    setConnectionStatus('connecting');
    
    const client = mqtt.connect(MQTT_CONFIG.url, MQTT_CONFIG.options);
    
    client.on('connect', () => {
      console.log('✅ MQTT Terhubung ke SIMONAIR');
      setConnectionStatus('connected');
      client.subscribe('simonair/+/data', { qos: 1 }, (err) => {
        if (err) {
          console.error('❌ Gagal berlangganan:', err);
        } else {
          console.log('📡 Berlangganan ke simonair/+/data');
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const topicMatch = topic.match(/^simonair\/(.+?)\/data$/);
        
        if (topicMatch) {
          const deviceId = topicMatch[1];
          console.log(`📨 Data diterima dari ${deviceId}:`, payload);
          updateDeviceData(deviceId, payload);
        }
      } catch (error) {
        console.error('❌ Error parsing pesan MQTT:', error);
      }
    });

    client.on('error', (error) => {
      console.error('❌ Error Koneksi MQTT:', error);
      setConnectionStatus('disconnected');
    });

    client.on('reconnect', () => {
      console.log('🔄 MQTT Menyambung Ulang...');
      setConnectionStatus('connecting');
    });

    client.on('offline', () => {
      console.log('📴 MQTT Offline');
      setConnectionStatus('disconnected');
    });

    client.on('close', () => {
      console.log('🔌 Koneksi MQTT Ditutup');
      setConnectionStatus('disconnected');
    });

    setMqttClient(client);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Membersihkan koneksi MQTT...');
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
            console.log(`📴 Perangkat ${deviceId} offline`);
          }
        });

        return hasChanges ? updatedDevices : prevDevices;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Event Handlers
  const handleCalibrateClick = (deviceId: string) => {
    console.log(`🔧 Membuka modal kalibrasi untuk perangkat: ${deviceId}`);
    setCalibrationModal({
      open: true,
      deviceId,
      sensorType: ''
    });
  };

  const handleOffsetClick = (deviceId: string) => {
    console.log(`⚙️ Membuka modal offset untuk perangkat: ${deviceId}`);
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

  // Connection status component
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-2.5 h-2.5 rounded-full transition-all duration-300",
        connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' :
        connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50' :
        'bg-red-500 shadow-lg shadow-red-500/50'
      )} />
      <span className={cn(
        "text-sm font-semibold",
        connectionStatus === 'connected' ? 'text-emerald-600' :
        connectionStatus === 'connecting' ? 'text-amber-600' :
        'text-red-600'
      )}>
        {connectionStatus === 'connected' ? 'Terhubung' :
         connectionStatus === 'connecting' ? 'Menghubungkan...' :
         'Terputus'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-cyan-50/30">
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header Section */}
        <div className="text-center py-12 relative">
          <div className="flex items-center justify-center gap-6 mb-8 relative">
            <div className="relative">
              <Fish className="h-16 w-16 text-blue-600 drop-shadow-2xl animate-float" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse shadow-lg" />
            </div>
            <Waves className="h-12 w-12 text-cyan-500 animate-wave drop-shadow-lg" />
            <Sparkles className="h-10 w-10 text-blue-400 animate-pulse drop-shadow-lg" />
          </div>

          <h1 className="text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              {getGreeting()} 
            </span>
            <span className="text-gray-700 ml-4">🌊</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Sistem Monitoring Kualitas Air (SIMONAIR 4.0)
          </p>
        </div>

        {/* System Status Bar */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/60 shadow-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Connection Status */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl shadow-md">
                  <Wifi className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Koneksi</p>
                  <ConnectionStatus />
                </div>
              </div>

              {/* Active Devices */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl shadow-md">
                  <Activity className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Perangkat Online</p>
                  <p className="text-lg font-bold text-gray-800">
                    {onlineDevices}/{totalDevices}
                  </p>
                </div>
              </div>

              {/* Last Update */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl shadow-md">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Pembaruan Terakhir</p>
                  <p className="text-lg font-bold text-gray-800">{lastUpdate || 'Menunggu...'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8 bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />

        {/* Devices Section */}
        <div className="space-y-8">
          
          {deviceList.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/60 shadow-xl">
              <CardContent className="p-16 text-center">
                <div className="flex items-center justify-center gap-6 text-6xl mb-8">
                  <Fish className="h-24 w-24 text-blue-300 animate-float" />
                  <Waves className="h-20 w-20 text-cyan-300 animate-wave" />
                </div>
                <h3 className="text-3xl font-bold text-gray-700 mb-4">
                  Menunggu Perangkat SIMONAIR
                </h3>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                  Perangkat akan muncul otomatis ketika mulai mengirim data sensor ke sistem monitoring
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4 text-base">
                    <span className="text-gray-500 font-semibold">Status MQTT:</span>
                    <ConnectionStatus />
                  </div>
                  
                  <div className="text-sm text-gray-400 bg-white/30 rounded-full px-4 py-2 inline-block">
                    Mendengarkan topik: simonair/+/data
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
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

      {/* Modals */}
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
import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

interface CalibrationHookReturn {
  currentVoltage: number;
  currentTemp: number;
  currentRaw: number;  // ← Tambahkan ini
  isConnected: boolean;
  publishCalibration: (payload: any) => Promise<void>;
}

export const useCalibration = (
  deviceId: string, 
  sensorType: 'ph' | 'tds' | 'do'
): CalibrationHookReturn => {
  const [currentVoltage, setCurrentVoltage] = useState(0);
  const [currentTemp, setCurrentTemp] = useState(25);
  const [currentRaw, setCurrentRaw] = useState(0);  // ← Tambahkan ini
  const [isConnected, setIsConnected] = useState(false);
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);

  // MQTT Configuration
  const MQTT_CONFIG = {
    url: 'wss://mqtt-ws.elsaiot.web.id',
    options: {
      username: 'elsa-user',
      password: '3lsaTekom.',
      clientId: `calibration_${deviceId}_${sensorType}_${Date.now()}`,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    }
  };

  useEffect(() => {
    const client = mqtt.connect(MQTT_CONFIG.url, MQTT_CONFIG.options);

    client.on('connect', () => {
      console.log(`✅ ${sensorType.toUpperCase()} Calibration MQTT Connected`);
      setIsConnected(true);
      client.subscribe(`simonair/${deviceId}/data`);
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Update sensor readings based on type
        switch (sensorType) {
          case 'ph':
            if (data.ph?.voltage) {
              setCurrentVoltage(data.ph.voltage);
            }
            if (data.ph?.raw) {  // ← Tambahkan ini
              setCurrentRaw(data.ph.raw);
            }
            break;
          case 'tds':
            if (data.tds?.voltage) {
              setCurrentVoltage(data.tds.voltage);
            }
            if (data.tds?.raw) {  // ← Tambahkan ini
              setCurrentRaw(data.tds.raw);
            }
            break;
          case 'do':
            if (data.do?.voltage) {
              setCurrentVoltage(data.do.voltage);
            }
            if (data.do?.raw) {  // ← Tambahkan ini
              setCurrentRaw(data.do.raw);
            }
            break;
        }
        
        // Update temperature for all sensors
        if (data.temperature?.value) {
          setCurrentTemp(data.temperature.value);
        }
        
        console.log(`📊 ${sensorType.toUpperCase()} data updated:`, {
          voltage: currentVoltage,
          raw: currentRaw,  // ← Tambahkan ini
          temp: currentTemp
        });
        
      } catch (error) {
        console.error('Error parsing calibration data:', error);
      }
    });

    client.on('error', (error) => {
      console.error(`❌ ${sensorType.toUpperCase()} Calibration MQTT Error:`, error);
      setIsConnected(false);
    });

    client.on('offline', () => {
      console.log(`📴 ${sensorType.toUpperCase()} Calibration MQTT Offline`);
      setIsConnected(false);
    });

    client.on('reconnect', () => {
      console.log(`🔄 ${sensorType.toUpperCase()} Calibration MQTT Reconnecting...`);
    });

    setMqttClient(client);

    return () => {
      if (client) {
        client.unsubscribe(`simonair/${deviceId}/data`);
        client.end();
      }
    };
  }, [deviceId, sensorType]);

  const publishCalibration = async (payload: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!mqttClient || !isConnected) {
        reject(new Error('MQTT not connected'));
        return;
      }

      const topic = `simonair/${deviceId}/calibrate`;
      const message = JSON.stringify(payload);

      mqttClient.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          console.error(`❌ Failed to publish ${sensorType.toUpperCase()} calibration:`, error);
          reject(error);
        } else {
          console.log(`✅ ${sensorType.toUpperCase()} calibration sent to ${topic}:`, payload);
          resolve();
        }
      });
    });
  };

  return {
    currentVoltage,
    currentTemp,
    currentRaw,  // ← Tambahkan ini
    isConnected,
    publishCalibration
  };
};

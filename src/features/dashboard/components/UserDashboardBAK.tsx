import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Fish,
  Smile,
  Frown,
  Thermometer,
  MoreVertical,
  XCircle,
  Clock,
  Droplets,
  ZapIcon,
  Waves,
  Leaf,
} from 'lucide-react';
import mqtt from 'mqtt';

const nama = 'Naufal';

function StatusDot({ online }: { online: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          online ? 'bg-green-500' : 'bg-red-500'
        }`}
      ></span>
      <span className={`text-xs font-medium ${online ? 'text-green-600' : 'text-red-500'}`}>
        {online ? 'Online' : 'Offline'}
      </span>
    </span>
  );
}

function MenuDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="p-1.5 text-primary/80 hover:text-primary"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu Alat"
      >
        <MoreVertical className="w-5 h-5" />
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl bg-white shadow-2xl border py-2.5 animate-fade-in-up">
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition rounded-md"
            onClick={() => setOpen(false)}
          >
            Kalibrasi Alat
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition rounded-md"
            onClick={() => setOpen(false)}
          >
            Atur Alert
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition rounded-md"
            onClick={() => setOpen(false)}
          >
            Data Sensor
          </button>
        </div>
      )}
    </div>
  );
}

function SensorCard({ label, value, unit, status }: any) {
  const getSensorStyle = () => {
    switch (label) {
      case 'pH':
        return {
          icon: <Droplets className="w-5 h-5" />,
          bgColor: 'bg-blue-50',
          shadowColor: 'shadow-blue-200',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-100'
        };
      case 'TDS':
        return {
          icon: <ZapIcon className="w-5 h-5" />,
          bgColor: 'bg-purple-50',
          shadowColor: 'shadow-purple-200',
          textColor: 'text-purple-600',
          borderColor: 'border-purple-100'
        };
      case 'DO':
        return {
          icon: <Waves className="w-5 h-5" />,
          bgColor: 'bg-green-50',
          shadowColor: 'shadow-green-200',
          textColor: 'text-green-600',
          borderColor: 'border-green-100'
        };
      case 'Suhu':
        return {
          icon: <Thermometer className="w-5 h-5" />,
          bgColor: 'bg-red-50',
          shadowColor: 'shadow-red-200',
          textColor: 'text-red-600',
          borderColor: 'border-red-100'
        };
      default:
        return {
          icon: <Leaf className="w-5 h-5" />,
          bgColor: 'bg-gray-50',
          shadowColor: 'shadow-gray-200',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-100'
        };
    }
  };

  const style = getSensorStyle();

  return (
    <div className={`flex flex-col items-center justify-between gap-3 p-4 ${style.bgColor} rounded-xl ${style.shadowColor} shadow-lg border ${style.borderColor} transition-all h-full`}>
      <div className={`${style.textColor} mb-1`}>
        {style.icon}
      </div>
      <span className={`text-sm ${style.textColor} font-medium`}>{label}</span>
      <span className="font-bold text-2xl">
        {value} <span className="font-normal text-xs">{unit}</span>
      </span>
    </div>
  );
}

export default function UserDashboard() {
  const jam = new Date().getHours();
  const waktu =
    jam < 11
      ? 'Pagi'
      : jam < 15
      ? 'Siang'
      : jam < 18
      ? 'Sore'
      : 'Malam';

  const [devices, setDevices] = useState<{
    [key: string]: {
      id: string,
      nama: string,
      status: string,
      online: boolean,
      lastOnline: string,
      lastData: string,
      sensors: {
        label: string,
        value: number | string,
        unit: string,
        status: string
      }[]
    }
  }>({});

  useEffect(() => {
    const mqttConnect = () => {
      const clientId = 'elsa_dashboard_' + Math.random().toString(16).substr(2, 8);
      const mqttClient = mqtt.connect('ws://mqtt.elsaiot.web.id:9001', {
        username: 'elsa-user',
        password: '3lsaTekom.',
        clientId,
        clean: true,
        reconnectPeriod: 2000
      });

      mqttClient.on('connect', () => {
        mqttClient.subscribe('elsaiot/+/data');
      });

      mqttClient.on('message', (topic, message) => {
        try {
          const deviceId = topic.split('/')[1];
          const data = JSON.parse(message.toString());

          const now = new Date();
          const timeString = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          });

          const sensors: { label: string; value: number | string; unit: string; status: string }[] = [];

          if (data.ph) {
            const raw = typeof data.ph.raw === 'number' ? data.ph.raw : Number(data.ph.raw);
            const phValue = Number(raw).toFixed(3);
            sensors.push({
              label: 'pH',
              value: phValue,
              unit: '',
              status: '-'
            });
          }

          if (data.tds) {
            const raw = typeof data.tds.raw === 'number' ? data.tds.raw : Number(data.tds.raw);
            const tdsValue = Number(raw).toFixed(3);
            sensors.push({
              label: 'TDS',
              value: tdsValue,
              unit: 'ppm',
              status: '-'
            });
          }

          if (data.do) {
            const raw = typeof data.do.raw === 'number' ? data.do.raw : Number(data.do.raw);
            const doValue = Number(raw).toFixed(3);
            sensors.push({
              label: 'DO',
              value: doValue,
              unit: 'mg/L',
              status: '-'
            });
          }

          if (data.temperature) {
            const tempValue = Number(data.temperature.value).toFixed(2);
            sensors.push({
              label: 'Suhu',
              value: tempValue,
              unit: '°C',
              status: '-'
            });
          }

          setDevices(prev => ({
            ...prev,
            [deviceId]: {
              id: deviceId,
              nama: prev[deviceId]?.nama || `Kolam ${deviceId}`,
              status: '-',
              online: true,
              lastOnline: '1 menit lalu',
              lastData: timeString,
              sensors
            }
          }));
        } catch (error) {
        }
      });

      return mqttClient;
    };

    const mqttClient = mqttConnect();

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  const deviceList = Object.values(devices);

  return (
    <div className="container mx-auto min-h-screen bg-background py-8 px-4 flex flex-col items-center gap-8">
      {/* Greeting */}
      <div className="flex flex-col items-center gap-3 mb-4 w-full max-w-xl text-center">
        <div className="rounded-full bg-accent p-3.5 mb-2">
          <Fish className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-primary">
          Selamat {waktu}, {nama} <span className="inline-block">👋</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-md">
          Pantau real-time kualitas air akuarium Anda
        </p>
      </div>

      {/* Card List */}
      <div className="w-full grid grid-cols-1 gap-6 place-items-center max-w-6xl">
        {deviceList.length > 0 ? (
          deviceList.map((device) => (
            <Card
              key={device.id}
              className="w-full max-w-6xl bg-white shadow-lg hover:shadow-xl border-0 rounded-2xl transition-all duration-300 flex flex-col h-full"
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
                <div className="flex flex-row items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground mb-1.5">
                      {device.nama}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <StatusDot online={device.online} />
                      <span className="mx-1 hidden md:inline text-slate-300">|</span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary/80" />
                        {device.online
                          ? ` ${device.lastOnline}`
                          : ` Terakhir ${device.lastOnline}`}
                      </span>
                    </div>
                  </div>
                </div>
                <MenuDropdown />
              </CardHeader>

              {/* Sensors */}
              <CardContent className="pt-3 pb-5">
                <div className="grid grid-cols-2 gap-5 mt-2">
                  {device.sensors.map((sensor) => (
                    <SensorCard key={sensor.label} {...sensor} />
                  ))}
                </div>
              </CardContent>

              <div className="px-6 pb-5 flex items-center gap-2.5 border-t pt-4 mt-auto">
                {device.status.toLowerCase() === 'baik' ? (
                  <Smile className="w-5 h-5 text-green-500" />
                ) : (
                  <Frown className="w-5 h-5 text-red-500" />
                )}
                <span
                  className={`font-medium ${
                    device.status.toLowerCase() === 'baik'
                      ? 'text-green-600'
                      : 'text-red-500'
                  }`}
                >
                  Kualitas Air {device.status}
                </span>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center p-10 text-center">
            <XCircle className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">Belum ada perangkat</h3>
            <p className="text-muted-foreground mb-6">
              Hubungkan perangkat baru untuk mulai memantau kualitas air
            </p>
          </div>
        )}
      </div>

      {/* Pair New Device Button */}
      {/* <div className="mt-6 w-full flex justify-center">
        <Button
          size="lg"
          className="gap-2.5 px-8 py-6 rounded-xl text-base font-semibold shadow-lg bg-primary/90 hover:bg-primary transition-all"
        >
          <Link2 className="w-5 h-5" />
          Pair Alat Baru
        </Button>
      </div> */}
    </div>
  );
}

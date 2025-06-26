import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { 
  Waves,
  Thermometer,
  Send,
  AlertCircle,
  TrendingUp,
  Info,
  CheckCircle,
  Beaker,
  ChevronRight,
  RotateCcw,
  Save,
  Calculator,
  Database
} from 'lucide-react';
import { useCalibration } from './hooks/useCalibration';

interface DOCalibrationProps {
  deviceId: string;
  onClose: () => void;
  onBack: () => void;
  isCalibrating: boolean;
  setIsCalibrating: (value: boolean) => void;
  currentDeviceData?: any;
}

interface CalibrationPoint {
  voltage: number;
  temp: number;
  timestamp: string;
}

// DO Saturation Table (0-40°C) from C++ code
const DO_TABLE = [
  14460,14220,13820,13440,13090,12740,12420,12110,11810,11530,
  11260,11010,10770,10530,10300,10080, 9860, 9660, 9460, 9270,
   9080, 8900, 8730, 8570, 8410, 8250, 8110, 7960, 7820, 7690,
   7560, 7430, 7300, 7180, 7070, 6950, 6840, 6730, 6630, 6530, 6410
];

const DOCalibration: React.FC<DOCalibrationProps> = ({
  deviceId,
  onClose,
  onBack,
  isCalibrating,
  setIsCalibrating,
  currentDeviceData
}) => {
  const [calibrationMode, setCalibrationMode] = useState<'single' | 'double'>('single');
  const [calibrationDone, setCalibrationDone] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  
  // Two-point calibration state
  const [twoPointStep, setTwoPointStep] = useState<1 | 2>(1);
  const [point1, setPoint1] = useState<CalibrationPoint | null>(null);
  const [point2, setPoint2] = useState<CalibrationPoint | null>(null);
  
  const { currentVoltage, currentTemp, currentRaw, isConnected, publishCalibration } = useCalibration(deviceId, 'do');

  // Calculate theoretical saturated DO based on temperature
  const calculateSaturatedDO = (temp: number) => {
    // Simplified formula for DO saturation at sea level
    const a = 14.652;
    const b = -0.41022;
    const c = 0.007991;
    const d = -0.000077774;
    
    return a + (b * temp) + (c * Math.pow(temp, 2)) + (d * Math.pow(temp, 3));
  };

  // Get saturation from lookup table (mimicking C++ code)
  const getSaturationFromTable = (temp: number) => {
    const idx = Math.max(0, Math.min(40, Math.floor(temp)));
    return DO_TABLE[idx];
  };

  // Calculate uncalibrated DO (from C++ code)
  const calculateUncalibratedDO = (voltage_mV: number) => {
    return (voltage_mV * 6.5) / 1000.0;
  };

  // Calculate calibrated DO (from C++ code)
  const calculateCalibratedDO = (voltage_mV: number, temp: number, mode: 'single' | 'double') => {
    const sat = getSaturationFromTable(temp);
    let vSat = 0;

    if (mode === 'double' && point1 && point2) {
      // Two-point linear interpolation
      if (point1.temp !== point2.temp) {
        vSat = point1.voltage + ((temp - point1.temp) * (point2.voltage - point1.voltage)) / (point2.temp - point1.temp);
      } else {
        vSat = point1.voltage;
      }
    } else if (mode === 'single' && point1) {
      vSat = point1.voltage;
    } else {
      vSat = currentVoltage; // Current measurement
    }

    if (vSat <= 0) return 0;
    
    const mgL = (voltage_mV * sat) / (vSat * 1000.0);
    return Math.max(0, Math.min(20, mgL)); // Constrain 0-20 mg/L
  };

  // Update formula visibility based on calibration state
  React.useEffect(() => {
    if (calibrationMode === 'single' && currentVoltage > 0) {
      setShowFormula(true);
    } else if (calibrationMode === 'double' && point1 && point2) {
      setShowFormula(true);
    } else {
      setShowFormula(false);
    }
  }, [calibrationMode, currentVoltage, point1, point2]);

  // Validate calibration inputs
  const canCalibrate = () => {
    return currentVoltage > 0 && currentTemp > 0 && isConnected;
  };

  // Reset two-point calibration
  const resetTwoPointCalibration = () => {
    setPoint1(null);
    setPoint2(null);
    setTwoPointStep(1);
  };

  // Capture calibration point for two-point mode
  const captureCalibrationPoint = () => {
    if (!canCalibrate()) return;

    const point: CalibrationPoint = {
      voltage: currentVoltage,
      temp: currentTemp,
      timestamp: new Date().toLocaleTimeString('id-ID')
    };

    if (twoPointStep === 1) {
      setPoint1(point);
      setTwoPointStep(2);
    } else {
      setPoint2(point);
    }
  };

  // Handle single point calibration
  const handleSinglePointCalibration = async () => {
    if (!canCalibrate()) return;
    
    setIsCalibrating(true);
    
    try {
      const payload = {
        do: {
          cal1_v: parseFloat(currentVoltage.toFixed(2)),
          cal1_t: parseFloat(currentTemp.toFixed(2)),
          two_point_mode: false,
          calibrated: true
        }
      };

      await publishCalibration(payload);
      
      setCalibrationDone(true);
      
      // Success feedback
      setTimeout(() => {
        setIsCalibrating(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      setIsCalibrating(false);
      console.error('DO Single Point Calibration failed:', error);
    }
  };

  // Handle two point calibration
  const handleTwoPointCalibration = async () => {
    if (!point1 || !point2) return;
    
    setIsCalibrating(true);
    
    try {
      const payload = {
        do: {
          cal1_v: parseFloat(point1.voltage.toFixed(2)),
          cal1_t: parseFloat(point1.temp.toFixed(2)),
          cal2_v: parseFloat(point2.voltage.toFixed(2)),
          cal2_t: parseFloat(point2.temp.toFixed(2)),
          two_point_mode: true,
          calibrated: true
        }
      };

      await publishCalibration(payload);
      
      setCalibrationDone(true);
      
      // Success feedback
      setTimeout(() => {
        setIsCalibrating(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      setIsCalibrating(false);
      console.error('DO Two Point Calibration failed:', error);
    }
  };

  // Handle calibration based on mode
  const handleCalibrate = () => {
    if (calibrationMode === 'single') {
      handleSinglePointCalibration();
    } else {
      handleTwoPointCalibration();
    }
  };

  // Check if two-point calibration is ready
  const canSubmitTwoPoint = () => {
    return point1 && point2 && isConnected;
  };

  const saturatedDO = calculateSaturatedDO(currentTemp);
  const uncalibratedDO = calculateUncalibratedDO(currentVoltage);
  const calibratedDO = calculateCalibratedDO(currentVoltage, currentTemp, calibrationMode);
  const satFromTable = getSaturationFromTable(currentTemp);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Waves className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          Kalibrasi Sensor DO (Dissolved Oxygen)
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          Kalibrasi sensor oksigen terlarut dengan lookup table saturasi
        </p>
      </div>

      {/* Current Reading */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-teal-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pembacaan Real-time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Voltage</Label>
              <div className="text-2xl font-bold text-green-700 mb-1">
                {currentVoltage.toFixed(2)} mV
              </div>
              <div className="text-xs text-gray-500">
                Tegangan sensor
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Raw ADC</Label>
              <div className="text-2xl font-bold text-teal-700 mb-1">
                {currentRaw?.toFixed(0) || '--'}
              </div>
              <div className="text-xs text-gray-500">
                Nilai mentah ADC
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Suhu</Label>
              <div className="text-2xl font-bold text-blue-700 flex items-center gap-1 mb-1">
                <Thermometer className="h-5 w-5" />
                {currentTemp.toFixed(1)} °C
              </div>
              <div className="text-xs text-gray-500">
                Kompensasi suhu
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">DO Teoritis</Label>
              <div className="text-2xl font-bold text-cyan-700 mb-1">
                {saturatedDO.toFixed(2)} mg/L
              </div>
              <div className="text-xs text-gray-500">
                Saturasi teoritis
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-green-200">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Terhubung' : 'Terputus'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Update setiap detik
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calibration Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mode Kalibrasi</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={calibrationMode} 
            onValueChange={(value: 'single' | 'double') => {
              setCalibrationMode(value);
              if (value === 'single') {
                resetTwoPointCalibration();
              }
            }}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="single" id="single" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="single" className="font-medium">
                  Single Point (Udara Jenuh)
                </Label>
                <p className="text-sm text-gray-600">
                  Kalibrasi menggunakan udara jenuh pada suhu saat ini. 
                  Cocok untuk penggunaan umum dan pemeliharaan rutin.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="double" id="double" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="double" className="font-medium">
                  Two Point (Udara + Zero)
                </Label>
                <p className="text-sm text-gray-600">
                  Kalibrasi menggunakan udara jenuh dan larutan zero DO. 
                  Memberikan akurasi maksimal untuk pengukuran presisi.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Two-Point Calibration Progress */}
      {calibrationMode === 'double' && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Proses Kalibrasi Two-Point
              <Badge variant="outline" className="ml-2">
                Step {twoPointStep} of 2
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step Progress */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${point1 ? 'text-green-600' : 'text-gray-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  point1 ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium">Udara Jenuh</span>
              </div>
              
              <ChevronRight className="h-4 w-4 text-gray-400" />
              
              <div className={`flex items-center gap-2 ${point2 ? 'text-green-600' : 'text-gray-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  point2 ? 'bg-green-500 text-white' : twoPointStep === 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Zero DO</span>
              </div>
            </div>

            {/* Current Step Instructions */}
            {twoPointStep === 1 && !point1 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Step 1: Kalibrasi Udara Jenuh</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                  <li>Pastikan sensor DO bersih dan kering</li>
                  <li>Biarkan sensor di udara terbuka selama 5-10 menit</li>
                  <li>Tunggu pembacaan voltage stabil</li>
                  <li>Klik "Simpan Point 1" untuk menyimpan kalibrasi udara jenuh</li>
                </ol>
              </div>
            )}

            {twoPointStep === 2 && !point2 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Step 2: Kalibrasi Zero DO</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-orange-700">
                  <li>Siapkan larutan zero DO (sodium sulfite dalam air)</li>
                  <li>Celupkan sensor ke dalam larutan zero DO</li>
                  <li>Tunggu 2-3 menit untuk stabilisasi</li>
                  <li>Klik "Simpan Point 2" untuk menyimpan kalibrasi zero</li>
                </ol>
              </div>
            )}

            {/* Captured Points Display */}
            {(point1 || point2) && (
              <div className="space-y-3">
                {point1 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <span className="font-medium text-green-800">Point 1 (Udara Jenuh):</span>
                      <div className="text-sm text-green-700">
                        {point1.voltage.toFixed(2)} mV @ {point1.temp.toFixed(1)}°C
                        <span className="text-xs ml-2">({point1.timestamp})</span>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
                
                {point2 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <span className="font-medium text-green-800">Point 2 (Zero DO):</span>
                      <div className="text-sm text-green-700">
                        {point2.voltage.toFixed(2)} mV @ {point2.temp.toFixed(1)}°C
                        <span className="text-xs ml-2">({point2.timestamp})</span>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
            )}

            {/* Step Actions */}
            <div className="flex gap-3">
              {twoPointStep === 1 && !point1 && (
                <Button 
                  onClick={captureCalibrationPoint}
                  disabled={!canCalibrate()}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Point 1 (Udara Jenuh)
                </Button>
              )}
              
              {twoPointStep === 2 && !point2 && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setPoint1(null);
                      setTwoPointStep(1);
                    }}
                    className="flex-shrink-0"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Point 1
                  </Button>
                  <Button 
                    onClick={captureCalibrationPoint}
                    disabled={!canCalibrate()}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Point 2 (Zero DO)
                  </Button>
                </>
              )}
              
              {point1 && point2 && (
                <Button 
                  variant="outline"
                  onClick={resetTwoPointCalibration}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Semua Point
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Point Instructions */}
      {calibrationMode === 'single' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Panduan Kalibrasi Single Point
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Pastikan sensor DO bersih dan kering</li>
              <li>Biarkan sensor berada di udara terbuka selama 5-10 menit</li>
              <li>Pastikan suhu ambient stabil</li>
              <li>Tunggu pembacaan voltage stabil</li>
              <li>Klik "Kirim Kalibrasi" untuk menyimpan kalibrasi udara jenuh</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* DO Algorithm Explanation - Only show when we have calibration data */}
      {showFormula && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Algoritma Perhitungan DO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Saturation Lookup Table */}
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Database className="h-5 w-5" />
                1. Lookup Table Saturasi
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-mono bg-blue-50 p-3 rounded border">
                    <span className="text-blue-700">
                      sat = DO_Table[constrain(temp, 0, 40)]
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Tabel 41 nilai saturasi dari 0-40°C
                  </div>
                </div>
                <div>
                  <div className="text-sm font-mono bg-green-50 p-3 rounded border">
                    <span className="text-green-700">
                      sat = {satFromTable.toFixed(0)} (pada {currentTemp.toFixed(1)}°C)
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Nilai saturasi untuk suhu saat ini
                  </div>
                </div>
              </div>
            </div>

            {/* Uncalibrated Formula */}
            <div className="p-4 bg-white rounded-lg border border-orange-200">
              <div className="text-lg font-bold text-gray-800 mb-3">
                2. Formula Tanpa Kalibrasi
              </div>
              <div className="text-center p-4 bg-orange-50 rounded border-2 border-orange-200 mb-4">
                <div className="text-xl font-mono font-bold text-orange-700">
                  DO = (voltage × 6.5) ÷ 1000
                </div>
                <div className="text-sm text-orange-600 mt-2">
                  Formula sederhana untuk estimasi awal
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono text-orange-700">
                  DO uncalibrated = {uncalibratedDO.toFixed(3)} mg/L
                </div>
              </div>
            </div>

            {/* Calibrated Formula */}
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="text-lg font-bold text-gray-800 mb-3">
                3. Formula Terkalibrasi
              </div>
              <div className="text-center p-4 bg-green-50 rounded border-2 border-green-200 mb-4">
                <div className="text-xl font-mono font-bold text-green-700">
                  DO = (voltage × sat) ÷ (vSat × 1000)
                </div>
                <div className="text-sm text-green-600 mt-2">
                  Dimana vSat = voltage saturasi dari kalibrasi
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm font-medium text-blue-800">Current Voltage</div>
                  <div className="font-mono text-blue-700 text-lg">{currentVoltage.toFixed(2)} mV</div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                  <div className="text-sm font-medium text-purple-800">Saturation Value</div>
                  <div className="font-mono text-purple-700 text-lg">{satFromTable}</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-sm font-medium text-green-800">Result</div>
                  <div className="font-mono text-green-700 text-lg">{calibratedDO.toFixed(3)} mg/L</div>
                </div>
              </div>
            </div>

            {/* vSat Calculation */}
            <div className="p-4 bg-white rounded-lg border border-indigo-200">
              <div className="text-lg font-bold text-gray-800 mb-3">
                4. Perhitungan vSat (Voltage Saturasi)
              </div>
              
              {/* Single Point Mode */}
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded">
                <div className="font-medium text-indigo-800 mb-2">Single Point Mode:</div>
                <div className="text-sm font-mono bg-white p-2 rounded border">
                  <span className="text-indigo-700">vSat = cal1_v</span>
                </div>
                <div className="text-xs text-indigo-600 mt-1">
                  Menggunakan satu titik kalibrasi (udara jenuh)
                </div>
              </div>

              {/* Two Point Mode */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                <div className="font-medium text-purple-800 mb-2">Two Point Mode:</div>
                <div className="text-sm font-mono bg-white p-2 rounded border">
                  <span className="text-purple-700">
                    vSat = cal1_v + ((T - cal1_t) × (cal2_v - cal1_v)) ÷ (cal2_t - cal1_t)
                  </span>
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Interpolasi linear antara dua titik kalibrasi
                </div>
              </div>

              {/* Current Calculation Preview */}
              {(point1 || calibrationMode === 'single') && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="font-medium text-gray-800 mb-2">Perhitungan saat ini:</div>
                  {calibrationMode === 'single' ? (
                    <div className="text-sm">
                      <span className="text-gray-600">vSat = </span>
                      <span className="font-mono text-blue-700">{currentVoltage.toFixed(2)} mV</span>
                      <span className="text-gray-600"> (single point)</span>
                    </div>
                  ) : point1 && point2 ? (
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-gray-600">vSat = </span>
                        <span className="font-mono text-purple-700">
                          {point1.voltage.toFixed(2)} + (({currentTemp.toFixed(1)} - {point1.temp.toFixed(1)}) × ({point2.voltage.toFixed(2)} - {point1.voltage.toFixed(2)})) ÷ ({point2.temp.toFixed(1)} - {point1.temp.toFixed(1)})
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">vSat = </span>
                        <span className="font-mono text-green-700">
                          {(point1.voltage + ((currentTemp - point1.temp) * (point2.voltage - point1.voltage)) / (point2.temp - point1.temp)).toFixed(2)} mV
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Menunggu point kalibrasi...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Final Calculation Summary */}
            {(point1 || calibrationMode === 'single') && (
              <div className="p-4 bg-white rounded-lg border border-emerald-200">
                <div className="text-lg font-bold text-gray-800 mb-3">
                  5. Hasil Perhitungan Final
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Uncalibrated:</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {uncalibratedDO.toFixed(3)} mg/L
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Calibrated:</div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {calibratedDO.toFixed(3)} mg/L
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Range: 0-20 mg/L (constrained automatically)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Technical Information */}
      <div className="flex items-start gap-3 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
        <Info className="h-5 w-5 text-cyan-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <div className="font-medium text-cyan-800 mb-2">
            Informasi Teknis Algoritma DO
          </div>
          <div className="text-cyan-700 space-y-1">
            <p>• <strong>Lookup Table:</strong> 41 nilai saturasi DO dari 0-40°C untuk akurasi tinggi</p>
            <p>• <strong>Linear Interpolation:</strong> Two-point mode menggunakan interpolasi untuk kompensasi suhu</p>
            <p>• <strong>Constrain Range:</strong> Output dibatasi 0-20 mg/L sesuai kondisi realistis</p>
            <p>• <strong>Single vs Two-point:</strong> Single untuk maintenance, two-point untuk precision measurement</p>
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {!isConnected && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-red-800 mb-1">
              Koneksi Terputus
            </div>
            <div className="text-red-700">
              Pastikan perangkat online dan mengirim data sensor.
            </div>
          </div>
        </div>
      )}

      {currentVoltage === 0 && isConnected && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-amber-800 mb-1">
              Tidak Ada Data Voltage
            </div>
            <div className="text-amber-700">
              Pastikan sensor DO terhubung dan mengirim data.
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {calibrationDone && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-green-800 mb-1">
              Kalibrasi Berhasil!
            </div>
            <div className="text-green-700">
              Sensor DO telah dikalibrasi menggunakan mode {calibrationMode === 'single' ? 'single point' : 'two point'}.
              {calibrationMode === 'double' && point1 && point2 && (
                <div className="mt-2 text-xs">
                  Point 1: {point1.voltage.toFixed(2)} mV @ {point1.temp.toFixed(1)}°C<br/>
                  Point 2: {point2.voltage.toFixed(2)} mV @ {point2.temp.toFixed(1)}°C
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={onBack} disabled={isCalibrating}>
          Kembali
        </Button>
        <Button 
          onClick={handleCalibrate} 
          disabled={
            (calibrationMode === 'single' && !canCalibrate()) ||
            (calibrationMode === 'double' && !canSubmitTwoPoint()) ||
            isCalibrating
          }
          className="min-w-[140px] h-12 text-base font-medium"
        >
          {isCalibrating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Mengkalibrasi...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Kirim Kalibrasi
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DOCalibration;
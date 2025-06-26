import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Zap,
  Thermometer,
  Send,
  AlertCircle,
  TrendingUp,
  Beaker,
  CheckCircle,
  Calculator,
  Info,
  Droplets
} from 'lucide-react';
import { useCalibration } from './hooks/useCalibration';

interface TDSCalibrationProps {
  deviceId: string;
  onClose: () => void;
  onBack: () => void;
  isCalibrating: boolean;
  setIsCalibrating: (value: boolean) => void;
  currentDeviceData?: any;
}

// Common TDS standards for calibration
const TDS_STANDARDS = [
  { value: 0, label: '0 ppm (Air Suling)' },
  { value: 84, label: '84 ppm (NaCl 0.01%)' },
  { value: 342, label: '342 ppm (NaCl 0.02%)' },
  { value: 500, label: '500 ppm' },
  { value: 1000, label: '1000 ppm' },
  { value: 1413, label: '1413 ppm (Standard KCl)' }
];

const TDSCalibration: React.FC<TDSCalibrationProps> = ({
  deviceId,
  onClose,
  onBack,
  isCalibrating,
  setIsCalibrating,
  currentDeviceData
}) => {
  const [standardTDS, setStandardTDS] = useState('');
  const [customStandard, setCustomStandard] = useState('');
  const [calibrationDone, setCalibrationDone] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [calculationResult, setCalculationResult] = useState<{
    compensationCoeff: number;
    compensationVoltage: number;
    tdsRaw: number;
    kValue: number;
  } | null>(null);
  
  const { currentVoltage, currentTemp, currentRaw, isConnected, publishCalibration } = useCalibration(deviceId, 'tds');

  // Handle standard selection
  const handleStandardSelect = (value: string) => {
    if (value === 'custom') {
      setStandardTDS('custom');
      setCustomStandard('');
    } else {
      setStandardTDS(value);
      setCustomStandard('');
    }
  };

  // Get final standard value
  const getFinalStandard = () => {
    if (standardTDS === 'custom') {
      return parseFloat(customStandard);
    }
    return parseFloat(standardTDS);
  };

  // Calculate compensation coefficient
  const calculateCompensationCoeff = (temp: number) => {
    return 1.0 + 0.02 * (temp - 25.0);
  };

  // Calculate TDS using the exact algorithm from C++ code
  const calculateTDSAlgorithm = (voltage: number, temperature: number, standard?: number) => {
    const compensationCoeff = calculateCompensationCoeff(temperature);
    const compensationVoltage = voltage / compensationCoeff;
    
    // Polynomial formula from C++ code
    const tdsRaw = (133.42 * Math.pow(compensationVoltage, 3) 
                  - 255.86 * Math.pow(compensationVoltage, 2) 
                  + 857.39 * compensationVoltage) * 0.5;
    
    let kValue = 1.0;
    if (standard && tdsRaw > 0) {
      kValue = standard / tdsRaw;
    }
    
    return {
      compensationCoeff,
      compensationVoltage,
      tdsRaw: Math.max(0, tdsRaw),
      kValue,
      tdsCalibrated: Math.max(0, Math.min(1000, tdsRaw * kValue))
    };
  };

  // Update calculation when values change
  useEffect(() => {
    if (currentVoltage > 0 && currentTemp > 0) {
      const standard = getFinalStandard();
      if (!isNaN(standard) && standard > 0) {
        const result = calculateTDSAlgorithm(currentVoltage, currentTemp, standard);
        setCalculationResult(result);
        setShowFormula(true);
      } else {
        setShowFormula(false);
      }
    }
  }, [currentVoltage, currentTemp, standardTDS, customStandard]);

  // Calculate current TDS estimation (uncalibrated)
  const getCurrentTDSEstimation = () => {
    if (!currentVoltage || !currentTemp) return 0;
    const result = calculateTDSAlgorithm(currentVoltage, currentTemp);
    return result.tdsRaw;
  };

  // Validate calibration inputs
  const canCalibrate = () => {
    const standard = getFinalStandard();
    return !isNaN(standard) && standard >= 0 && currentVoltage > 0 && currentTemp > 0 && isConnected;
  };

  // Perform calibration
  const handleCalibrate = async () => {
    if (!canCalibrate()) return;
    
    setIsCalibrating(true);
    
    try {
      const standard = getFinalStandard();
      
      const payload = {
        tds: {
          v: parseFloat(currentVoltage.toFixed(4)),
          std: parseFloat(standard.toFixed(2)),
          t: parseFloat(currentTemp.toFixed(2))
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
      console.error('TDS Calibration failed:', error);
    }
  };

  const currentEstimation = getCurrentTDSEstimation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Zap className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          Kalibrasi Sensor TDS
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          Kalibrasi menggunakan larutan standar dengan kompensasi suhu otomatis
        </p>
      </div>

      {/* Current Reading */}
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
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
              <div className="text-2xl font-bold text-yellow-700 mb-1">
                {currentVoltage.toFixed(4)} V
              </div>
              <div className="text-xs text-gray-500">
                Tegangan sensor
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Raw ADC</Label>
              <div className="text-2xl font-bold text-orange-700 mb-1">
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
              <Label className="text-sm font-medium text-gray-600 mb-2 block">TDS Estimasi</Label>
              <div className="text-2xl font-bold text-green-700 mb-1">
                {currentEstimation.toFixed(1)} ppm
              </div>
              <div className="text-xs text-gray-500">
                Tanpa kalibrasi
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-yellow-200">
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

      {/* Calibration Instructions */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Panduan Kalibrasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Siapkan larutan standar TDS dengan nilai yang diketahui</li>
            <li>Celupkan sensor TDS ke dalam larutan standar</li>
            <li>Tunggu pembacaan voltage stabil (±30 detik)</li>
            <li>Pilih nilai standar yang sesuai dengan larutan</li>
            <li>Review perhitungan konstanta K</li>
            <li>Klik "Kirim Kalibrasi" untuk menyimpan</li>
          </ol>
        </CardContent>
      </Card>

      {/* Standard Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pilih Larutan Standar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Standards */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Standar Umum:</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {TDS_STANDARDS.map((standard) => (
                <Button
                  key={standard.value}
                  variant={standardTDS === standard.value.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStandardSelect(standard.value.toString())}
                  className="text-xs h-auto py-3 px-3 flex flex-col items-center"
                >
                  <div className="font-bold">{standard.value} ppm</div>
                  <div className="text-xs opacity-70 mt-1">
                    {standard.label.includes('NaCl') ? 'NaCl' : 
                     standard.label.includes('KCl') ? 'KCl' : 
                     standard.label.includes('Air') ? 'H₂O' : 'Standard'}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Standard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Button
                variant={standardTDS === 'custom' ? "default" : "outline"}
                onClick={() => handleStandardSelect('custom')}
                className="w-full h-12"
              >
                <Droplets className="h-4 w-4 mr-2" />
                Nilai Custom
              </Button>
            </div>
            {standardTDS === 'custom' && (
              <div>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2000"
                  placeholder="Masukkan nilai TDS (ppm)"
                  value={customStandard}
                  onChange={(e) => setCustomStandard(e.target.value)}
                  className="h-12"
                />
              </div>
            )}
          </div>

          {/* Selected Standard Display */}
          {standardTDS && !isNaN(getFinalStandard()) && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Standar Terpilih:</span>
                  <div className="text-xl font-bold text-blue-700 mt-1">
                    {getFinalStandard().toFixed(1)} ppm
                  </div>
                </div>
                {calculationResult && (
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-700">Konstanta K:</span>
                    <div className="text-xl font-bold text-purple-700 mt-1">
                      {calculationResult.kValue.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TDS Algorithm Explanation - Only show when we have calibration data */}
      {showFormula && calculationResult && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Algoritma Perhitungan TDS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature Compensation */}
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-gray-800 mb-3">
                1. Kompensasi Suhu
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-mono bg-blue-50 p-3 rounded border">
                    <span className="text-blue-700">Koef = 1 + 0.02 × (T - 25)</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Kompensasi 2% per °C dari 25°C
                  </div>
                </div>
                <div>
                  <div className="text-sm font-mono bg-green-50 p-3 rounded border">
                    <span className="text-green-700">
                      Koef = {calculationResult.compensationCoeff.toFixed(4)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Nilai saat ini pada {currentTemp.toFixed(1)}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Voltage Compensation */}
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="text-lg font-bold text-gray-800 mb-3">
                2. Voltage Terkompensasi
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-mono bg-green-50 p-3 rounded border">
                    <span className="text-green-700">V_comp = Voltage ÷ Koef</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Normalisasi voltage ke 25°C
                  </div>
                </div>
                <div>
                  <div className="text-sm font-mono bg-yellow-50 p-3 rounded border">
                    <span className="text-yellow-700">
                      V_comp = {calculationResult.compensationVoltage.toFixed(4)} V
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {currentVoltage.toFixed(4)} ÷ {calculationResult.compensationCoeff.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>

            {/* Polynomial Formula */}
            <div className="p-4 bg-white rounded-lg border border-orange-200">
              <div className="text-lg font-bold text-gray-800 mb-3">
                3. Formula Polynomial Cubic
              </div>
              <div className="text-center p-4 bg-orange-50 rounded border-2 border-orange-200 mb-4">
                <div className="text-xl font-mono font-bold text-orange-700">
                  TDS = (133.42×V³ - 255.86×V² + 857.39×V) × 0.5 × K
                </div>
                <div className="text-sm text-orange-600 mt-2">
                  Dimana V = Voltage terkompensasi, K = Konstanta kalibrasi
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="text-sm font-medium text-red-800">Cubic Term</div>
                  <div className="font-mono text-red-700">133.42 × V³</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm font-medium text-blue-800">Quadratic Term</div>
                  <div className="font-mono text-blue-700">-255.86 × V²</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-sm font-medium text-green-800">Linear Term</div>
                  <div className="font-mono text-green-700">857.39 × V</div>
                </div>
              </div>
            </div>

            {/* Calibration Calculation */}
            <div className="p-4 bg-white rounded-lg border border-purple-200">
              <div className="text-lg font-bold text-gray-800 mb-3">
                4. Perhitungan Kalibrasi
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">TDS Raw:</span>
                      <span className="font-mono ml-2 text-purple-700 font-bold">
                        {calculationResult.tdsRaw.toFixed(2)} ppm
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Standar:</span>
                      <span className="font-mono ml-2 text-blue-700 font-bold">
                        {getFinalStandard().toFixed(2)} ppm
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                    <div className="text-sm font-medium text-purple-800 mb-1">
                      Konstanta K
                    </div>
                    <div className="text-xl font-mono font-bold text-purple-700">
                      {calculationResult.kValue.toFixed(4)}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      K = Standar ÷ TDS_raw
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Information */}
      <div className="flex items-start gap-3 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
        <Info className="h-5 w-5 text-cyan-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <div className="font-medium text-cyan-800 mb-2">
            Informasi Teknis Algoritma TDS
          </div>
          <div className="text-cyan-700 space-y-1">
            <p>• <strong>Kompensasi Suhu:</strong> 2% per °C untuk akurasi optimal pada berbagai suhu</p>
            <p>• <strong>Formula Polynomial:</strong> Menggunakan kurva kalibrasi cubic untuk linearitas</p>
            <p>• <strong>Konstanta K:</strong> Faktor kalibrasi individual untuk setiap sensor</p>
            <p>• <strong>Range:</strong> 0-1000 ppm dengan konstrain otomatis</p>
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
              Pastikan sensor TDS terhubung dan mengirim data.
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
              Sensor TDS telah dikalibrasi dengan standar {getFinalStandard().toFixed(1)} ppm.
              {calculationResult && (
                <span> Konstanta K = {calculationResult.kValue.toFixed(4)}</span>
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
          disabled={!canCalibrate() || isCalibrating}
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

export default TDSCalibration;
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Droplets,
  Plus,
  Trash2,
  Send,
  AlertCircle,
  TrendingUp,
  Calculator,
  Info,
  CheckCircle2,
  Beaker
} from 'lucide-react';
import { useCalibration } from './hooks/useCalibration';

interface PHCalibrationProps {
  deviceId: string;
  onClose: () => void;
  onBack: () => void;
  isCalibrating: boolean;
  setIsCalibrating: (value: boolean) => void;
  currentDeviceData?: any;
}

const PH_BUFFERS = [
  { value: '4.01', label: 'Buffer pH 4.01' },
  { value: '6.86', label: 'Buffer pH 6.86' },
  { value: '9.18', label: 'Buffer pH 9.18' },
  { value: 'custom', label: 'Nilai Custom' }
];

const PHCalibration: React.FC<PHCalibrationProps> = ({
  deviceId,
  onClose,
  onBack,
  isCalibrating,
  setIsCalibrating,
  currentDeviceData
}) => {
  const [selectedBuffer, setSelectedBuffer] = useState('');
  const [customPH, setCustomPH] = useState('');
  const [bufferPoints, setBufferPoints] = useState<Array<{pH: number, voltage: number}>>([]);
  const [calibrationResult, setCalibrationResult] = useState<{m: number, c: number} | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  
  const { currentVoltage, isConnected, publishCalibration, currentRaw } = useCalibration(deviceId, 'ph');

  // Calculate linear regression in real-time
  const calculateRegression = (points: Array<{pH: number, voltage: number}>) => {
    if (points.length < 2) return null;
    
    const n = points.length;
    const sumV = points.reduce((sum, p) => sum + p.voltage, 0);
    const sumP = points.reduce((sum, p) => sum + p.pH, 0);
    const sumVP = points.reduce((sum, p) => sum + p.voltage * p.pH, 0);
    const sumVV = points.reduce((sum, p) => sum + p.voltage * p.voltage, 0);

    const m = (n * sumVP - sumV * sumP) / (n * sumVV - sumV * sumV);
    const c = (sumP - m * sumV) / n;

    return { m, c };
  };

  // Update regression when points change
  useEffect(() => {
    const result = calculateRegression(bufferPoints);
    setCalibrationResult(result);
    // Show formula when we have calibration data
    setShowFormula(!!result);
  }, [bufferPoints]);

  // Calculate R-squared (correlation coefficient)
  const calculateRSquared = (points: Array<{pH: number, voltage: number}>, m: number, c: number) => {
    if (points.length < 2) return 0;
    
    const meanPH = points.reduce((sum, p) => sum + p.pH, 0) / points.length;
    const totalSumSquares = points.reduce((sum, p) => sum + Math.pow(p.pH - meanPH, 2), 0);
    const residualSumSquares = points.reduce((sum, p) => {
      const predicted = m * p.voltage + c;
      return sum + Math.pow(p.pH - predicted, 2);
    }, 0);
    
    return 1 - (residualSumSquares / totalSumSquares);
  };

  // Add calibration point
  const addPoint = () => {
    if (!selectedBuffer || !currentVoltage) return;
    
    const pHValue = selectedBuffer === 'custom' 
      ? parseFloat(customPH) 
      : parseFloat(selectedBuffer);
      
    if (isNaN(pHValue)) return;

    // Check for duplicate pH values
    const isDuplicate = bufferPoints.some(point => Math.abs(point.pH - pHValue) < 0.01);
    if (isDuplicate) {
      alert('Nilai pH ini sudah ada dalam titik kalibrasi');
      return;
    }

    const newPoint = { pH: pHValue, voltage: currentVoltage };
    setBufferPoints([...bufferPoints, newPoint].sort((a, b) => a.pH - b.pH));
    setSelectedBuffer('');
    setCustomPH('');
  };

  // Remove calibration point
  const removePoint = (index: number) => {
    setBufferPoints(bufferPoints.filter((_, i) => i !== index));
  };

  // Calculate and send calibration
  const handleCalibrate = async () => {
    if (bufferPoints.length < 2 || !calibrationResult) return;
    
    setIsCalibrating(true);
    
    try {
      const payload = {
        ph: {
          m: parseFloat(calibrationResult.m.toFixed(5)),
          c: parseFloat(calibrationResult.c.toFixed(5))
        }
      };

      await publishCalibration(payload);
      
      // Success feedback
      setTimeout(() => {
        setIsCalibrating(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      setIsCalibrating(false);
      console.error('Calibration failed:', error);
    }
  };

  const canAddPoint = selectedBuffer && currentVoltage && isConnected &&
    (selectedBuffer !== 'custom' || (customPH && !isNaN(parseFloat(customPH))));

  const rSquared = calibrationResult ? calculateRSquared(bufferPoints, calibrationResult.m, calibrationResult.c) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Droplets className="h-12 w-12 mx-auto text-blue-500 mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          Kalibrasi Sensor pH
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          Minimal 2 titik kalibrasi diperlukan untuk akurasi optimal
        </p>
      </div>

      {/* Current Reading */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pembacaan Real-time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Voltage Reading */}
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Voltage Sensor</Label>
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {currentVoltage.toFixed(4)} V
              </div>
              <div className="text-xs text-gray-500">
                Tegangan output sensor
              </div>
            </div>

            {/* Raw Reading */}
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Nilai Raw</Label>
              <div className="text-3xl font-bold text-cyan-700 mb-1">
                {currentRaw?.toFixed(2) || '--'}
              </div>
              <div className="text-xs text-gray-500">
                Pembacaan mentah ADC
              </div>
            </div>

            {/* Connection Status */}
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Status Koneksi</Label>
              <div className="flex items-center gap-3 mt-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Update setiap detik
              </div>
            </div>
          </div>

          {/* Prediction & Metrics Section */}
          {showFormula && calibrationResult && (
            <div className="mt-6 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* pH Prediction */}
                <div className="p-3 bg-white/70 rounded-lg border border-blue-100">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 block">
                    Prediksi pH
                  </Label>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {(calibrationResult.m * currentVoltage + calibrationResult.c).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    pH = {calibrationResult.m.toFixed(3)} × V + {calibrationResult.c.toFixed(3)}
                  </div>
                </div>
                
                {/* Calibration Quality */}
                {bufferPoints.length >= 2 && (
                  <div className="p-3 bg-white/70 rounded-lg border border-blue-100">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 block">
                      Kualitas Kalibrasi
                    </Label>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {(rSquared * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      R² = {rSquared.toFixed(4)} ({bufferPoints.length} titik)
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
            <li>Siapkan larutan buffer pH standar (4.01, 6.86, 9.18)</li>
            <li>Celupkan sensor ke larutan buffer pertama</li>
            <li>Tunggu pembacaan voltage stabil (±30 detik)</li>
            <li>Pilih nilai buffer yang sesuai dan klik "Tambah Titik"</li>
            <li>Ulangi untuk buffer kedua (minimal 2 titik)</li>
            <li>Review persamaan regresi dan klik "Kirim Kalibrasi"</li>
          </ol>
        </CardContent>
      </Card>

      {/* Add Calibration Point */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Tambah Titik Kalibrasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Buffer pH</Label>
              <Select value={selectedBuffer} onValueChange={setSelectedBuffer}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih buffer standar" />
                </SelectTrigger>
                <SelectContent>
                  {PH_BUFFERS.map(buffer => (
                    <SelectItem key={buffer.value} value={buffer.value}>
                      {buffer.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedBuffer === 'custom' && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Nilai pH Custom</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="14"
                  placeholder="contoh: 7.00"
                  value={customPH}
                  onChange={(e) => setCustomPH(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Voltage Terbaca</Label>
              <Input 
                value={`${currentVoltage.toFixed(4)} V`} 
                readOnly 
                className="bg-gray-50 font-mono"
              />
            </div>
          </div>
          
          <Button 
            onClick={addPoint} 
            disabled={!canAddPoint}
            className="w-full h-12 text-base font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Titik Kalibrasi
          </Button>
        </CardContent>
      </Card>

      {/* Calibration Points */}
      {bufferPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Titik Kalibrasi ({bufferPoints.length})</span>
              <Badge variant="outline" className="text-xs">
                {bufferPoints.length >= 2 ? 'Siap Kalibrasi' : 'Perlu 1 titik lagi'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bufferPoints.map((point, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="font-bold">#{index + 1}</Badge>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">pH {point.pH}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-blue-600 font-mono">{point.voltage.toFixed(4)} V</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Buffer standar • Voltage akurat
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePoint(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linear Regression Display */}
      {showFormula && calibrationResult && bufferPoints.length >= 2 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Persamaan Regresi Linear
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mathematical Formula */}
            <div className="text-center p-6 bg-white rounded-lg border-2 border-purple-200">
              <div className="text-2xl font-bold text-gray-800 mb-4">
                Persamaan Kalibrasi pH
              </div>
              <div className="text-3xl font-mono font-bold text-purple-700 mb-4">
                pH = <span className="bg-yellow-200 px-2 py-1 rounded">m</span> × Voltage + <span className="bg-green-200 px-2 py-1 rounded">c</span>
              </div>
              <div className="text-2xl font-mono font-bold text-gray-700">
                pH = <span className="bg-yellow-200 px-2 py-1 rounded text-black">{calibrationResult.m.toFixed(5)}</span> × V + <span className="bg-green-200 px-2 py-1 rounded text-black">{calibrationResult.c.toFixed(5)}</span>
              </div>
            </div>

            {/* Parameters Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-yellow-200 rounded flex items-center justify-center font-bold text-sm">
                    m
                  </div>
                  <span className="font-semibold text-yellow-800">Slope (Kemiringan)</span>
                </div>
                <div className="text-sm text-yellow-700">
                  <div className="font-mono text-lg mb-1">{calibrationResult.m.toFixed(5)}</div>
                  <div>Sensitivitas sensor terhadap perubahan pH per volt</div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-200 rounded flex items-center justify-center font-bold text-sm">
                    c
                  </div>
                  <span className="font-semibold text-green-800">Intercept (Konstanta)</span>
                </div>
                <div className="text-sm text-green-700">
                  <div className="font-mono text-lg mb-1">{calibrationResult.c.toFixed(5)}</div>
                  <div>Nilai pH ketika voltage sensor = 0V</div>
                </div>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-blue-800">Kualitas Kalibrasi</span>
                <Badge variant={rSquared > 0.99 ? "default" : rSquared > 0.95 ? "secondary" : "destructive"}>
                  {rSquared > 0.99 ? "Excellent" : rSquared > 0.95 ? "Good" : "Poor"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">R² (Koefisien Determinasi):</span>
                  <div className="font-mono text-lg font-bold text-blue-800">
                    {rSquared.toFixed(4)} ({(rSquared * 100).toFixed(2)}%)
                  </div>
                </div>
                <div>
                  <span className="text-blue-600">Jumlah Titik Data:</span>
                  <div className="font-mono text-lg font-bold text-blue-800">
                    {bufferPoints.length} titik
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      {bufferPoints.length === 1 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-amber-800 mb-1">
              Titik Kalibrasi Belum Cukup
            </div>
            <div className="text-amber-700">
              Tambahkan minimal 1 titik lagi untuk menghitung regresi linear yang akurat
            </div>
          </div>
        </div>
      )}

      {rSquared > 0 && rSquared < 0.95 && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-orange-800 mb-1">
              Kualitas Kalibrasi Rendah (R² = {rSquared.toFixed(3)})
            </div>
            <div className="text-orange-700">
              Pertimbangkan untuk menambah titik kalibrasi atau periksa stabilitas pembacaan sensor
            </div>
          </div>
        </div>
      )}

      {/* Success Indicator */}
      {rSquared >= 0.99 && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-green-800 mb-1">
              Kalibrasi Berkualitas Tinggi!
            </div>
            <div className="text-green-700">
              R² = {rSquared.toFixed(4)} menunjukkan korelasi yang sangat baik. Sensor siap dikalibrasi.
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
          disabled={bufferPoints.length < 2 || isCalibrating || !isConnected}
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

export default PHCalibration;
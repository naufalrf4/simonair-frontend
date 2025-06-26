# 📡 Dokumentasi MQTT SIMONAIR  
---

## 🧾 Format Umum

- **Device ID** menggunakan format:
```

SMNR-XXXX

```
- `XXXX` adalah 4 digit angka/huruf kapital. Contoh: `SMNR-0001`, `SMNR-AC21`, `SMNR-1234`.
- Seluruh karakter harus kapital dan panjang karakter setelah dash empat digit.

- Semua topik MQTT mengikuti pola:
```

simonair/{deviceId}/{fungsi}

```
- `{deviceId}`: ID unik perangkat, contoh `SMNR-1024`.
- `{fungsi}`: tujuan/topik spesifik, seperti `data`, `calibration`, atau `offset`.

---

## 🛰️ 1. Perangkat → Backend: Pengiriman Data Sensor

### 🔹 Topik
```

simonair/SMNR-XXXX/data

````
- Arah: **publish** dari perangkat ke backend
- QoS: **1** (untuk keandalan pengiriman data)

### 🔹 Payload JSON

```json
{
  "timestamp": "2025-06-26T06:53:06.250Z",
  "temperature": {
    "value": 29,
    "status": "GOOD"
  },
  "ph": {
    "raw": 7.19,
    "voltage": 2.054,
    "calibrated": 9.37,
    "calibrated_ok": true,
    "status": "BAD"
  },
  "tds": {
    "raw": 1308,
    "voltage": 1.308,
    "calibrated": 1399.6,
    "calibrated_ok": true,
    "status": "BAD"
  },
  "do": {
    "raw": 7.61,
    "voltage": 1.171,
    "calibrated": 7.61,
    "calibrated_ok": true,
    "status": "BAD"
  }
}
````

#### 🔹 Penjelasan Struktur Data

* `timestamp`: (string) waktu akuisisi data, format ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SS.sssZ`)
* `temperature`: objek berisi

  * `value`: (number) nilai suhu dalam °C
  * `status`: (string) `"GOOD"` / `"BAD"`, hasil evaluasi berdasarkan ambang `low` dan `high`
* `ph`: objek berisi

  * `raw`: (number) data mentah ADC sensor pH
  * `voltage`: (number) hasil konversi ADC ke volt
  * `calibrated`: (number) nilai pH setelah proses kalibrasi
  * `calibrated_ok`: (boolean) `true` jika nilai kalibrasi valid/terpakai
  * `status`: (string) `"GOOD"` / `"BAD"` dari evaluasi threshold ph
* `tds`: objek berisi parameter TDS dengan format sama seperti pH
* `do`: objek berisi parameter DO (Dissolved Oxygen) dengan format sama seperti pH

#### 🔹 Proses

* Data dikirim periodik (misal setiap 1-5 menit) atau berdasarkan event.
* Evaluasi status sensor menggunakan offset yang diterima perangkat (lihat bagian offset).

---

## 🛠️ 2. Backend → Perangkat: Kalibrasi Sensor

### 🔹 Topik

```
simonair/SMNR-XXXX/calibration
```

* Arah: **subscribe** oleh perangkat (backend akan publish instruksi)
* QoS: **1** (agar perintah diterima pasti)

### 2.1 🔸 Perintah Hapus Kalibrasi

```json
{
  "ph":  { "clear": true },
  "tds": { "clear": true },
  "do":  { "clear": true }
}
```

* Perintah ini menyebabkan perangkat menghapus data kalibrasi yang tersimpan secara lokal untuk sensor terkait.

### 2.2 🔸 Format Kalibrasi per Sensor

#### TDS

```json
{
  "tds": {
    "v": 1.42,
    "std": 442,
    "t": 25.0
  }
}
```

* `v`: (number) tegangan referensi hasil pengukuran kalibrasi (volt)
* `std`: (number) nilai TDS standar (ppm)
* `t`: (number) suhu pada saat kalibrasi (°C)

#### pH

```json
{
  "ph": {
    "m": -7.153,
    "c": 22.456
  }
}
```

* `m`: (number) slope hasil regresi kalibrasi
* `c`: (number) intercept hasil regresi kalibrasi

#### DO

```json
{
  "do": {
    "ref": 8.0,
    "v": 1.171,
    "t": 25.0
  }
}
```

* `ref`: (number) nilai DO referensi (mg/L)
* `v`: (number) tegangan referensi (volt)
* `t`: (number) suhu saat kalibrasi (°C)

#### 🔹 Proses

* Data kalibrasi diterima, disimpan persisten di perangkat (`calibration.json`/EEPROM/config).
* Kalibrasi hanya dikirim sesuai kebutuhan (per sensor atau sekaligus).
* Perangkat harus mengaktifkan data kalibrasi pada pembacaan berikutnya.

---

## ⚙️ 3. Web/Backend → Perangkat: Pengaturan Offset Ambang Batas

### 🔹 Topik

```
simonair/SMNR-XXXX/offset
```

* Arah: **subscribe** oleh perangkat
* QoS: **1**

### 🔹 Payload

```json
{
  "threshold": {
    "ph_good": 6.0,
    "ph_bad": 9.0,
    "tds_good": 200,
    "tds_bad": 300,
    "do_good": 5.0,
    "do_bad": 8.0,
    "temp_low": 20.0,
    "temp_high": 30.0
  }
}
```

#### 🔹 Penjelasan

* Semua nilai offset digunakan perangkat untuk membandingkan hasil sensor, sehingga status sensor dapat dihasilkan otomatis.
* Kriteria:

  * pH `"GOOD"` jika `ph_good` ≤ `ph.calibrated` ≤ `ph_bad`
  * TDS `"GOOD"` jika `tds_good` ≤ `tds.calibrated` ≤ `tds_bad`
  * DO  `"GOOD"` jika `do_good` ≤ `do.calibrated` ≤ `do_bad`
  * Temperature `"GOOD"` jika `temp_low` ≤ `temperature.value` ≤ `temp_high`
  * Selain itu, `"BAD"`
* Offset wajib disimpan lokal pada perangkat agar tetap berlaku setelah restart.

---

## 📥 Device Wajib Subscribe

| Topik                            | Keterangan                         |
| -------------------------------- | ---------------------------------- |
| `simonair/SMNR-XXXX/calibration` | Perintah/setingan kalibrasi sensor |
| `simonair/SMNR-XXXX/offset`      | Pengaturan ambang batas kualitas   |

---

## 🔐 Konfigurasi MQTT

* **Autentikasi:**

  * Wajib username & password (disediakan server)
* **Client ID:**

  ```
  device-SMNR-XXXX
  ```

  * Unik untuk tiap perangkat. Contoh: `device-SMNR-0001`
* **Broker WSS:**

  ```
  wss://mqtt-ws.elsaiot.web.id
  ```
* **QoS:**

  * Publish data: `1`
  * Subscribe config: `1`
* **Format data:**

  * Semua data dikirim dalam bentuk JSON UTF-8

---

## ✅ Contoh Device ID Valid

| Device ID  | Valid                 |
| ---------- | --------------------- |
| SMNR-0001  | ✅                     |
| SMNR-AC21  | ✅                     |
| SMNR-1234  | ✅                     |
| smnr-5678  | ❌ (harus kapital)     |
| SMNR-12A4  | ✅                     |
| SMNR-1A2B  | ✅                     |
| SMNR-12345 | ❌ (maksimal 4 digit)  |
| SNMR-0001  | ❌ (harus SMNR prefix) |

---

## 📌 Penjelasan Arah & Alur Data

* **Perangkat publish ke backend:**

  * Topik: `simonair/SMNR-XXXX/data`
  * Isi: semua data sensor, dengan evaluasi status (GOOD/BAD) berdasarkan offset terbaru.

* **Perangkat subscribe dari backend:**

  * Topik: `simonair/SMNR-XXXX/calibration`

    * Isi: perintah kalibrasi (set atau clear) untuk masing-masing sensor.
  * Topik: `simonair/SMNR-XXXX/offset`

    * Isi: ambang batas/threshold parameter kualitas air.

* **Backend/web publish ke perangkat:**

  * Kalibrasi dan offset dikirim sesuai kebutuhan maintenance atau pengaturan.

---

## 📢 Catatan

* Format waktu harus selalu UTC ISO8601.
* Semua payload JSON harus valid dan field wajib selalu dikirim.
* Semua komunikasi harus menggunakan QoS 1.
* Perangkat WAJIB melakukan reconnect & resend data jika terjadi disconnect MQTT.
* Status sensor WAJIB mengikuti hasil evaluasi offset terbaru.

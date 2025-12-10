# ESP32 Veri Gönderme Test Rehberi

## Binary Paket Yapısı

ESP32 aşağıdaki formatta binary paketler gönderir:

```
[START] [DEVICE_ID] [MODULE] [PROPERTY] [DATA_LEN] [DATA...] [CRC] [STOP]
 0x02    1 byte       1 byte    1 byte     1 byte   variable  1 byte  0x03
```

### Modüller ve Özellikleri

| Modül | Değer | Özellik | Değer | Açıklama | Veri Formatı |
|-------|-------|---------|-------|----------|--------------|
| GPS | 0x01 | GPS_DATA | 0x02 | GPS konumu | `"lat,lon,speed"` |
| MPU6050 | 0x10 | MOTION | 0x01 | Hareket algılaması | `"1"` |
| STATS | 0x20 | STATS | 0x01 | Sürüş istatistikleri | `"km=X.XXX,avg=X.XX,time=XXXXX"` |

## Lokal Test Komutları

### 1. Worker'ı Başlatın

```powershell
cd c:\Users\User\Documents\GitHub\vite-react-template
npm run build
npx wrangler dev
```

### 2. GPS Verileri Gönder (Binary Paket)

PowerShell'de binary paket göndermek:

```powershell
# Paket: [0x02][0xAB][0x01][0x02][0x10]"38.8,35.2,65.5"[CRC][0x03]
# CRC Hesaplama: device_id XOR mod XOR prop XOR len XOR [data bytes]

$deviceId = 0xAB
$mod = 0x01
$prop = 0x02
$dataStr = "38.8,35.2,65.5"
$dataBytes = [System.Text.Encoding]::UTF8.GetBytes($dataStr)
$len = $dataBytes.Length

# CRC hesapla
$crc = $deviceId -bxor $mod -bxor $prop -bxor $len
foreach ($byte in $dataBytes) {
    $crc = $crc -bxor $byte
}

# Paket oluştur
$packet = @(0x02, $deviceId, $mod, $prop, $len) + $dataBytes + @($crc, 0x03)

# Worker'a gönder
[System.IO.File]::WriteAllBytes("$env:TEMP\gps_packet.bin", [byte[]]$packet)

Invoke-WebRequest `
    -Uri "http://127.0.0.1:8787/data" `
    -Method POST `
    -InFile "$env:TEMP\gps_packet.bin" `
    -Headers @{"Content-Type"="application/octet-stream"} `
    -Verbose
```

### 3. İstatistik Verileri Gönder (Binary Paket)

```powershell
$deviceId = 0xAB
$mod = 0x20
$prop = 0x01
$dataStr = "km=12.345,avg=45.67,time=1234"
$dataBytes = [System.Text.Encoding]::UTF8.GetBytes($dataStr)
$len = $dataBytes.Length

$crc = $deviceId -bxor $mod -bxor $prop -bxor $len
foreach ($byte in $dataBytes) {
    $crc = $crc -bxor $byte
}

$packet = @(0x02, $deviceId, $mod, $prop, $len) + $dataBytes + @($crc, 0x03)

[System.IO.File]::WriteAllBytes("$env:TEMP\stats_packet.bin", [byte[]]$packet)

Invoke-WebRequest `
    -Uri "http://127.0.0.1:8787/data" `
    -Method POST `
    -InFile "$env:TEMP\stats_packet.bin" `
    -Headers @{"Content-Type"="application/octet-stream"} `
    -Verbose
```

### 4. Admin Paneli Aç ve Kontrol Et

```
http://127.0.0.1:8787/admin
```

Panelde:
- ✅ **Konum** sekmesi GPS verilerini gösterir
- ✅ **Hız** bölümü km/h cinsinden hızı gösterir
- ✅ **Sürüş Verileri** bölümü mesafe, ort. hız ve sürüş süresini gösterir
- ✅ **Harita** GPS koordinatlarında işaretçi gösterir

### 5. Cihazı Yenile Butonu

Admin panelde "Yenile" butonuna tıklayarak son verileri görüntüleyin.

---

## PowerShell Helper Fonksiyonu

Bunu `$PROFILE`'a ekleyerek tekrarlayan işlemleri basitleştirin:

```powershell
function Send-GpsPacket {
    param(
        [byte]$DeviceId = 0xAB,
        [double]$Lat = 38.8,
        [double]$Lon = 35.2,
        [double]$Speed = 65.5,
        [string]$Url = "http://127.0.0.1:8787/data"
    )
    
    $mod = 0x01
    $prop = 0x02
    $dataStr = "$Lat,$Lon,$Speed"
    $dataBytes = [System.Text.Encoding]::UTF8.GetBytes($dataStr)
    $len = $dataBytes.Length
    
    $crc = $DeviceId -bxor $mod -bxor $prop -bxor $len
    foreach ($byte in $dataBytes) {
        $crc = $crc -bxor $byte
    }
    
    $packet = @(0x02, $DeviceId, $mod, $prop, $len) + $dataBytes + @($crc, 0x03)
    [System.IO.File]::WriteAllBytes("$env:TEMP\gps_packet.bin", [byte[]]$packet)
    
    Invoke-WebRequest -Uri $Url -Method POST -InFile "$env:TEMP\gps_packet.bin" `
        -Headers @{"Content-Type"="application/octet-stream"}
    
    Write-Host "✅ GPS Paketi gönderildi: Lat=$Lat Lon=$Lon Speed=$Speed" -ForegroundColor Green
}

# Kullanım:
# Send-GpsPacket -Lat 40.7 -Lon 29.9 -Speed 80.5
```

---

## Worker /admin/devices Endpoint

Worker'dan son cihaz verilerini JSON olarak almak:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8787/admin/devices" -Method GET | ConvertTo-Json -Depth 10
```

Örnek cevap:

```json
{
  "devices": [
    {
      "deviceId": "device_ab",
      "value": {
        "deviceId": "device_ab",
        "lat": 38.8,
        "lon": 35.2,
        "speed": 65.5,
        "totalDistance": 12.345,
        "avgSpeed": 45.67,
        "tripDuration": 1234,
        "timestamp": "2025-12-10T15:30:45.123Z"
      }
    }
  ]
}
```

---

## Troubleshooting

| Sorun | Çözüm |
|-------|-------|
| Veriler gösterilmiyor | Admin panelde "Yenile" butonuna tıklayın |
| Harita boş | Lat/Lon değerlerini kontrol edin (geçerli aralık: ±90, ±180) |
| Sürüş süresi görünmüyor | Stats paketinin `time` alanını kontrol edin (saniye cinsinden) |
| Binary paket hatasız gönderilmiş ama kayıt yok | CRC hesaplamasını kontrol edin; tüm bytes XOR işlemine dahil olmalı |


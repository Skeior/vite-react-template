#!/usr/bin/env node

/**
 * ESP32 Simulator - Sunucu durumunu kontrol eder ve aynı şekilde veri gönderir
 * Usage: node test-esp32-simulator.cjs [DEVICE_ID] [INTERVAL_MS]
 * 
 * Örnek: node test-esp32-simulator.cjs esp32_001 5000
 */

const http = require('http');
const https = require('https');

// ===== KONFİGURASYON =====
const DEVICE_ID = process.argv[2] || 'esp32_test_001';
const POLL_INTERVAL = parseInt(process.argv[3]) || 5000; // ms

// sunucu URL'leri - çalışan API'ye göre güncelle
const API_BASE = 'https://talhakarasu.com'; // custom domain
// Prod custom domain
const API_CONTROL_URL = 'https://talhakarasu.com/admin/state'; // global/per-device state
const API_DATA_URL = 'https://talhakarasu.com/data'; // gerçek sunucu (veri gönderimi için /data endpoint'i kullanılıyor)

// ===== PROTOKOL SABİTLERİ =====
const MOD_GPS = 0x01;
const PROP_GPS_DATA = 0x02;

const MOD_MPU = 0x10;
const PROP_MOTION = 0x01;

const MOD_STATS = 0x20;
const PROP_STATS = 0x01;

// ===== SİMÜLE EDİLEN DURUM =====
let parkMode = false;
let gpsSendRequest = false;
let statsSendRequest = false;
let rentState = false;
let motionDetected = false; // Park modunda hareket algılandı mı?

// ===== TRİP İSTATİSTİKLERİ =====
let tripActive = false;
let tripStartTime = 0;

let totalDistanceKm = 0.0;
let avgSpeed = 0.0;

let lastLat = 38.69913;
let lastLon = 35.55313;
let lastSpeed = 0;

// İlk GPS bilgisini ayarla
let firstGpsFix = true;

// ===== SABIT ROTA (Gerçekçi hareket) =====
const routePoints = [
  { lat: 38.69913, lon: 35.55313 },
  { lat: 38.69925, lon: 35.55340 },
  { lat: 38.69945, lon: 35.55380 },
  { lat: 38.69970, lon: 35.55430 },
  { lat: 38.70000, lon: 35.55490 },
  { lat: 38.70035, lon: 35.55560 },
  { lat: 38.70075, lon: 35.55640 },
  { lat: 38.70120, lon: 35.55730 },
  { lat: 38.70170, lon: 35.55830 },
  { lat: 38.70225, lon: 35.55940 },
];
let currentRouteIndex = 0;

// ===== HAVERSINE DISTANCE =====
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371.0; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  lat1 = (lat1 * Math.PI) / 180;
  lat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ===== PAKET OLUŞTur =====
function buildPacket(mod, prop, data) {
  const deviceIdBuffer = Buffer.from(String(DEVICE_ID || ''), 'utf-8');
  const devId = deviceIdBuffer.length ? deviceIdBuffer[0] : 0;
  const start = 0x02;
  const stop = 0x03;

  const dataBytes = Buffer.from(data, 'utf-8');
  const dlen = Math.min(dataBytes.length, 255);

  const packetLen = 1 + 1 + 1 + 1 + 1 + dlen + 1 + 1;
  const buf = Buffer.alloc(packetLen);

  let i = 0;
  buf[i++] = start;
  buf[i++] = devId;
  buf[i++] = mod;
  buf[i++] = prop;
  buf[i++] = dlen;

  for (let k = 0; k < dlen; k++) buf[i++] = dataBytes[k];

  let crc = devId ^ mod ^ prop ^ dlen;
  for (let k = 0; k < dlen; k++) crc ^= dataBytes[k];

  buf[i++] = crc;
  buf[i++] = stop;

  return buf;
}

// ===== HTTP İSTEĞİ GÖNDER =====
function httpRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const opts = new URL(url);
    opts.method = method;

    if (data && method === 'POST') {
      opts.headers = {
        'Content-Type': 'application/octet-stream',
        'Content-Length': data.length,
      };
    } else if (method === 'POST') {
      opts.headers = {
        'Content-Type': 'application/json',
      };
    }

    const req = client.request(opts, (res) => {
      let responseData = Buffer.alloc(0);

      res.on('data', (chunk) => {
        responseData = Buffer.concat([responseData, chunk]);
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: responseData.toString('utf-8'),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
          });
        }
      });
    });

    req.on('error', reject);

    if (data && method === 'POST') {
      req.write(data);
    } else if (method === 'POST') {
      req.write(JSON.stringify({}));
    }

    req.end();
  });
}

// ===== TRİP RESET =====
function resetTrip() {
  console.log('[TRIP] Trip sıfırlandı');
  tripActive = false;
  totalDistanceKm = 0;
  avgSpeed = 0;
  firstGpsFix = true;
  lastLat = 38.69913;
  lastLon = 35.55313;

}

// ===== SUNUCU KOMU ÇEKME =====
async function pollServerCommands() {
  try {
    // Per-device state (preferred), fallback global
    let src = {};
    try {
      const resState = await httpRequest(`${API_CONTROL_URL}?deviceId=${encodeURIComponent(DEVICE_ID)}`, 'GET');
      src = JSON.parse(resState.data || '{}');
      console.log('[POLL] raw per-device state:', resState.data);
    } catch (e) {
      console.error('[POLL] /admin/state parse error:', e.message);
    }

    // If per-device not found, try global
    if (!src || Object.keys(src).length === 0) {
      try {
        const resGlobal = await httpRequest(API_CONTROL_URL, 'GET');
        src = JSON.parse(resGlobal.data || '{}');
        console.log('[POLL] raw global state:', resGlobal.data);
      } catch (e) {
        console.error('[POLL] /admin/state (global) parse error:', e.message);
      }
    }

    const oldRent = rentState;

    rentState = src.rentalActive === true || src.rentalActive === 'true';
    parkMode = src.parkMode === true || src.parkMode === 'true';
    gpsSendRequest = src.gpsSend === true || src.gpsSend === 'true';
    statsSendRequest = src.statsSend === true || src.statsSend === 'true';

    // İlk kiralamada park modunu kapat
    if (oldRent === false && rentState === true) {
      parkMode = false;
      console.log('[POLL] 🚗 Kiralama başladı - Park modu kapatıldı');
    }

    // Kiralama bitince trip reset
    if (oldRent === true && rentState === false) {
      resetTrip();
    }

    console.log(`[POLL] rentState=${rentState}, park=${parkMode}, gps=${gpsSendRequest}, stats=${statsSendRequest}`);
  } catch (err) {
    console.error('[POLL] Hata:', err.message);
  }
}

// ===== GPS VERİSİ GÖNDER =====
async function sendGpsData() {
  try {
    // gpsSend false ise gönderme
    if (!gpsSendRequest) {
      console.log('[GPS] Skip - gpsSend kapalı');
      return;
    }

    console.log(`[GPS] Kontrol: parkMode=${parkMode}, motionDetected=${motionDetected}`);

    // Park modundayken VE hareket algılanmadıysa GPS değişmez
    if (parkMode && !motionDetected) {
      lastSpeed = 0; // Park modunda hız 0
      const dataStr = `${DEVICE_ID}|${lastLat.toFixed(6)},${lastLon.toFixed(6)},0.00`;
      const pkt = buildPacket(MOD_GPS, PROP_GPS_DATA, dataStr);
      const response = await httpRequest(API_DATA_URL, 'POST', pkt);
      console.log(`[GPS] 🅿️ PARK MODU - Sabit konum: ${lastLat.toFixed(6)},${lastLon.toFixed(6)} | Durum: ${response.status}`);
      return;
    }

    // Park modunda hareket algılandıysa uyarı ver ve GPS güncelle
    if (parkMode && motionDetected) {
      console.log(`[GPS] ⚠️ PARK MODUNDA HAREKET! Konum güncelleniyor...`);
      // Hareket işlendikten sonra flag'i sıfırla (bir sonraki döngü için)
      motionDetected = false;
    }

    // Rota takip et - önceden tanımlı noktaları izle
    const targetPoint = routePoints[currentRouteIndex % routePoints.length];
    
    // Hedef noktaya doğru küçük adımlarla hareket et
    const latDiff = targetPoint.lat - lastLat;
    const lonDiff = targetPoint.lon - lastLon;
    
    // Adım boyutu: rota noktaları arasında yavaşça hareket et
    const stepSize = 0.0001; // Çok küçük adımlarla
    const latChange = latDiff > 0 ? Math.min(stepSize, latDiff) : Math.max(-stepSize, latDiff);
    const lonChange = lonDiff > 0 ? Math.min(stepSize, lonDiff) : Math.max(-stepSize, lonDiff);
    
    // Küçük rastgele gürültü ekle (gerçekçilik için)
    const noiseLat = (Math.random() - 0.5) * 0.00005;
    const noiseLon = (Math.random() - 0.5) * 0.00005;
    
    lastLat += latChange + noiseLat;
    lastLon += lonChange + noiseLon;
    
    // Noktaya ulaştığında sonrakine geç
    if (Math.abs(latDiff) < stepSize && Math.abs(lonDiff) < stepSize) {
      currentRouteIndex = (currentRouteIndex + 1) % routePoints.length;
      console.log(`[GPS] Rota noktası: ${currentRouteIndex}/${routePoints.length}`);
    }
    
    lastSpeed = 30 + Math.random() * 50; // 30-80 km/h

    const dataStr = `${DEVICE_ID}|${lastLat.toFixed(6)},${lastLon.toFixed(6)},${lastSpeed.toFixed(2)}`;

    // TRİP HESAPLARı
    if (rentState) {
      if (!firstGpsFix) {
        const d = haversine(lastLat - latChange, lastLon - lonChange, lastLat, lastLon);
        if (d < 1.0) {
          totalDistanceKm += d;
        }
      } else {
        firstGpsFix = false;
      }

      if (!tripActive) {
        tripActive = true;
        tripStartTime = Date.now();
      }

      const tripSeconds = Math.floor((Date.now() - tripStartTime) / 1000);
      if (tripSeconds > 0) {
        avgSpeed = (totalDistanceKm / tripSeconds) * 3600; // km/h
      }
    }

    // Paket oluştur ve gönder
    const pkt = buildPacket(MOD_GPS, PROP_GPS_DATA, dataStr);
    const response = await httpRequest(API_DATA_URL, 'POST', pkt);

    console.log(`[GPS] Gönderildi: ${dataStr} | Durum: ${response.status}`);
  } catch (err) {
    console.error('[GPS] Hata:', err.message);
  }
}

// ===== İSTATİSTİK GÖNDER =====
async function sendStatsData() {
  try {
    // statsSend false ise gönderme
    if (!statsSendRequest) {
      console.log('[STATS] Skip - statsSend kapalı');
      return;
    }

    // Simülasyonda süre bilgisini kaldır: sadece km ve ortalama hız gönder
    const stats = `${DEVICE_ID}|km=${totalDistanceKm.toFixed(3)},avg=${avgSpeed.toFixed(2)}`;

    const pkt = buildPacket(MOD_STATS, PROP_STATS, stats);
    const response = await httpRequest(API_DATA_URL, 'POST', pkt);

    console.log(`[STATS] Gönderildi: ${stats} | Durum: ${response.status}`);
  } catch (err) {
    console.error('[STATS] Hata:', err.message);
  }
}

// ===== HAREKET ALGILA =====
async function detectMotion() {
  try {
    if (parkMode) {
      // Hareket algılama şansını %30'a düşür (daha gerçekçi)
      if (Math.random() > 0.7) {
        motionDetected = true; // Flag'i set et - bu döngüde GPS güncellenecek
        // /motion endpoint'ine hareket bildirimi gönder
        const motionData = JSON.stringify({ deviceId: DEVICE_ID });
        const response = await httpRequest(`${API_BASE}/motion`, 'POST', Buffer.from(motionData));
        console.log(`[MOTION] ⚠️ Hareket algılandı! motionDetected=${motionDetected}. Durum: ${response.status}`);
      } else {
        // Hareket yok - flag'i sıfırlama, GPS sabit kalsın
        console.log(`[MOTION] Park modunda, hareket yok. motionDetected=${motionDetected}`);
      }
    } else {
      // Park modunda değilse hareket flag'ini resetle
      motionDetected = false;
    }
  } catch (err) {
    console.error('[MOTION] Hata:', err.message);
  }
}

// ===== MAIN LOOP =====
async function mainLoop() {
  console.log(`\n[STARTUP] Device ID: ${DEVICE_ID}`);
  console.log(`[STARTUP] Poll Interval: ${POLL_INTERVAL}ms`);
  console.log(`[STARTUP] Control URL: ${API_CONTROL_URL}`);
  console.log(`[STARTUP] Data URL: ${API_DATA_URL}\n`);

  setInterval(async () => {
    console.log(`\n--- [${new Date().toISOString()}] ---`);
    
    // 1. Sunucu durumunu kontrol et
    await pollServerCommands();

    // 2. Hareket algılama (Park modunda)
    await detectMotion();

    // 3. GPS gönder (talep varsa)
    if (gpsSendRequest) {
      await sendGpsData();
    }

    // 4. Stats gönder (talep varsa)
    if (statsSendRequest) {
      await sendStatsData();
    }
  }, POLL_INTERVAL);
}

mainLoop().catch(console.error);

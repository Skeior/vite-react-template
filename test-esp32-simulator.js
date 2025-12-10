#!/usr/bin/env node

/**
 * ESP32 Simulator - Sunucu durumunu kontrol eder ve aynı şekilde veri gönderir
 * Usage: node test-esp32-simulator.js [DEVICE_ID] [INTERVAL_MS]
 * 
 * Örnek: node test-esp32-simulator.js esp32_001 5000
 */

const http = require('http');
const https = require('https');

// ===== KONFİGURASYON =====
const DEVICE_ID = process.argv[2] || 'esp32_001';
const POLL_INTERVAL = parseInt(process.argv[3]) || 5000; // ms
const API_CONTROL_URL = 'https://talhakarasu.talhakarasu2.workers.dev/admin/state'; // gerçek sunucu
const API_DATA_URL = 'https://talhakarasu.talhakarasu2.workers.dev/data'; // gerçek sunucu

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

// ===== TRİP İSTATİSTİKLERİ =====
let tripActive = false;
let tripStartTime = 0;

let totalDistanceKm = 0.0;
let avgSpeed = 0.0;

let lastLat = 40.7128;
let lastLon = -74.0060;
let lastSpeed = 0;

// İlk GPS bilgisini ayarla
let firstGpsFix = true;

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
  lastLat = 40.7128;
  lastLon = -74.0060;
}

// ===== SUNUCU KOMU ÇEKME =====
async function pollServerCommands() {
  try {
    const response = await httpRequest(API_CONTROL_URL, 'GET');
    const responseText = response.data;

    const oldRent = rentState;

    // Sunucudan durumu oku
    rentState = responseText.includes('"rentalActive":true') || 
                responseText.includes('rentalActive":"true"');
    parkMode = responseText.includes('"parkMode":true') || 
               responseText.includes('parkMode":"true"');
    gpsSendRequest = responseText.includes('"gpsSend":true') || 
                     responseText.includes('gpsSend":"true"');
    statsSendRequest = responseText.includes('"statsSend":true') || 
                       responseText.includes('statsSend":"true"');

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
    // Konum biraz değiştir (simülasyon için)
    const latChange = (Math.random() - 0.5) * 0.001; // ±0.0005
    const lonChange = (Math.random() - 0.5) * 0.001;
    lastLat += latChange;
    lastLon += lonChange;
    lastSpeed = 30 + Math.random() * 50; // 30-80 km/h

    const dataStr = `${lastLat.toFixed(6)},${lastLon.toFixed(6)},${lastSpeed.toFixed(2)}`;

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
    const tripSeconds = tripActive ? Math.floor((Date.now() - tripStartTime) / 1000) : 0;

    const stats = `km=${totalDistanceKm.toFixed(3)},avg=${avgSpeed.toFixed(2)},time=${tripSeconds}`;

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
      // Rasgele hareket algıla
      if (Math.random() > 0.7) {
        // /motion endpoint'ine hareket bildirimi gönder
        const motionData = JSON.stringify({ deviceId: DEVICE_ID });
        const response = await httpRequest('https://talhakarasu.com/motion', 'POST', Buffer.from(motionData));
        console.log(`[MOTION] Hareket algılandı! gpsSend etkinleştirildi. Durum: ${response.status}`);
      }
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

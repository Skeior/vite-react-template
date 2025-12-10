-- Devices tablosu - cihaz bilgileri ve anlık durum
CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY,
    lat REAL,
    lon REAL,
    speed REAL DEFAULT 0,
    total_distance REAL DEFAULT 0,
    avg_speed REAL DEFAULT 0,
    trip_duration INTEGER DEFAULT 0,
    rental_active INTEGER DEFAULT 0,
    park_mode INTEGER DEFAULT 0,
    gps_send INTEGER DEFAULT 1,
    stats_send INTEGER DEFAULT 1,
    trip_id TEXT,
    park_duration INTEGER DEFAULT 0,
    park_start_time INTEGER,
    motion_detected INTEGER DEFAULT 0,
    last_motion_time TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Trips tablosu - tamamlanmış sürüşler
CREATE TABLE IF NOT EXISTS trips (
    trip_id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    lat REAL,
    lon REAL,
    speed REAL,
    total_distance REAL DEFAULT 0,
    avg_speed REAL DEFAULT 0,
    trip_duration INTEGER DEFAULT 0,
    park_duration INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0,
    timestamp TEXT,
    end_time TEXT,
    realtime_route TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(device_id)
);

-- Device state tablosu - ESP32 kontrol durumu
CREATE TABLE IF NOT EXISTS device_state (
    device_id TEXT PRIMARY KEY,
    rental_active INTEGER DEFAULT 0,
    park_mode INTEGER DEFAULT 0,
    gps_send INTEGER DEFAULT 1,
    stats_send INTEGER DEFAULT 1,
    trip_id TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Global state tablosu - tüm cihazlar için varsayılan komutlar
CREATE TABLE IF NOT EXISTS global_state (
    state_id TEXT PRIMARY KEY,
    rental_active INTEGER DEFAULT 0,
    park_mode INTEGER DEFAULT 0,
    gps_send INTEGER DEFAULT 1,
    stats_send INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trips_device_id ON trips(device_id);
CREATE INDEX IF NOT EXISTS idx_trips_timestamp ON trips(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_devices_rental_active ON devices(rental_active);

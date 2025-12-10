-- Migration number: 0001 	 2025-12-10T15:14:33.671Z

-- Migration: Add global_state table for centralized device commands

CREATE TABLE IF NOT EXISTS global_state (
    state_id TEXT PRIMARY KEY,
    rental_active INTEGER DEFAULT 0,
    park_mode INTEGER DEFAULT 0,
    gps_send INTEGER DEFAULT 1,
    stats_send INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert default global state
INSERT INTO global_state (state_id, rental_active, park_mode, gps_send, stats_send)
VALUES ('default', 0, 0, 1, 1)
ON CONFLICT(state_id) DO NOTHING;

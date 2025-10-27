import { useEffect, useRef, useState, ChangeEvent } from "react";
import "./RadioPlayer.css";

// NOTE: Example station list. Replace or reorder these with your preferred streams.
// Curated station list (10 entries). Replace URLs with reliable streams you have rights to if needed.
// Note: some providers (BBC, etc.) may block direct embedding — fallback logic will try other stations.
// Updated station list per request: removed BBC, WQXR, Classic FM (Australia), France Musique, Deutschlandfunk.
// Added popular Turkish stations (Virgin Radio Türkiye, Alem FM, Radyo 7) as placeholders — replace URLs with working stream endpoints if needed.
const STATIONS = [
  { name: "NPO Radio 4", url: "https://icecast.omroep.nl/radio4-bb-mp3" },
  { name: "Classic FM (UK)", url: "http://media-ice.musicradio.com/ClassicFMMP3" },
  { name: "Radio Paradise", url: "https://stream.radioparadise.com/mp3-192" },
  { name: "KEXP", url: "https://kexp-hrd.appspot.com/stream" },
  // Turkish stations (provided URLs)
  { name: "Virgin Radio Türkiye", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO128AAC.aac?/;stream.mp3" },
  { name: "Alem FM", url: "https://alemfm.radyotvonline.net/alemfmaac?/;stream.mp3" },
  { name: "Radyo 7", url: "https://moondigitaledge2.radyotvonline.net/radyo7nostalji/playlist.m3u8?listeningSessionID=68fc6631ac97f73d_220598_NKhdolFo__00000003sAC&downloadSessionID=0" },
  { name: "SlowTurk", url: "https://radyo.duhnet.tv/slowturk?/;stream.mp3" }
];

export default function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [stationIndex, setStationIndex] = useState(0);
  const [stationError, setStationError] = useState<string | null>(null);

  const onSelectStation = async (e: ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    if (Number.isNaN(idx) || idx < 0 || idx >= STATIONS.length) return;
    // Trigger playback attempt when user selects a station.
    await tryPlayFrom(idx);
  };

  // Update volume and muted when user changes them. Do NOT pause on update.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // Pause audio when component unmounts only.
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) audio.pause();
    };
  }, []);

  // Initialize audio.src on mount. We avoid changing audio.src in a stationIndex effect
  // because that could reload the element and interrupt playback when switching.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) {
      audio.src = STATIONS[stationIndex].url;
    }
    // clear previous error on mount
    setStationError(null);
  }, []);

  // Try playing starting from a station index and fall back to subsequent stations on failure.
  const tryPlayFrom = async (startIndex: number) => {
    const audio = audioRef.current;
    if (!audio) return false;

    const n = STATIONS.length;
    for (let i = 0; i < n; i++) {
      const idx = (startIndex + i) % n;
      const station = STATIONS[idx];
      audio.src = station.url;
      // ensure the audio element reloads the new src before attempting playback
      try {
        try {
          audio.load();
        } catch (e) {
          // some browsers may not need or allow explicit load(); ignore failures
        }
        await audio.play();
        setStationIndex(idx);
        setPlaying(true);
        setStationError(null);
        return true;
      } catch (err) {
        console.warn("Playback failed for station:", station.name, err);
        // try next station
        continue;
      }
    }

    setStationError("No stations available or playback blocked by the browser/provider.");
    setPlaying(false);
    return false;
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      // Attempt to play current station; if it fails try fallbacks automatically
      await tryPlayFrom(stationIndex);
    } catch (err) {
      // playback failed (autoplay policies or network). Keep UI responsive.
      console.warn("Radio playback failed:", err);
    }
  };

  return (
    <div className="radio-player" role="region" aria-label="Site radio player">
      <audio ref={audioRef} preload="none" />

      <div className="radio-station">
        <select
          className="radio-select"
          aria-label="Select radio station"
          value={stationIndex}
          onChange={onSelectStation}
        >
          {STATIONS.map((s, i) => (
            <option key={s.name + i} value={i}>{s.name}</option>
          ))}
        </select>

        <button
          className="radio-change"
          onClick={async () => {
            const next = (stationIndex + 1) % STATIONS.length;
            // Always attempt to switch and start playback from the new station.
            await tryPlayFrom(next);
          }}
          aria-label="Change station"
          title="Change station"
        >
          ↻
        </button>
      </div>

      {stationError && <div className="radio-error" role="status">{stationError}</div>}

      <button
        className="radio-play"
        onClick={togglePlay}
        aria-pressed={playing}
        aria-label={playing ? "Duraklat radyo" : "Radyo çal"}
      >
        {playing ? "▮▮" : "►"}
      </button>

      <button
        className="radio-mute"
        onClick={() => setMuted((m) => !m)}
        aria-pressed={muted}
        aria-label={muted ? "Sesi aç" : "Sessiz"}
      >
        {muted ? "🔈" : "🔊"}
      </button>

      <label className="radio-volume" aria-hidden>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </label>
    </div>
  );
}

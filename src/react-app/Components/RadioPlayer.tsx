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
  /* Radio Paradise removed per request */
  // Turkish stations (provided URLs)
  { name: "RetroTurk", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/RETROTURK128AAC.aac?/;stream.mp3" },
  { name: "Piano Solo", url: "http://pianosolo.streamguys.net:80/live" },
  { name: "Radyo 7", url: "https://moondigitaledge2.radyotvonline.net/radyo7nostalji/playlist.m3u8?listeningSessionID=68fc6631ac97f73d_220598_NKhdolFo__00000003sAC&downloadSessionID=0" },
  { name: "Super FM", url: "https://27913.live.streamtheworld.com:443/SUPER_FM128AAC.aac?ttag=G:f,m,AG:2,3,SES:1,2,OC:1,2,3,4,6,INT:1,3,7,CH:3?/;stream.mp3" },
  { name: "Borusan Klasik", url: "https://28553.live.streamtheworld.com:443/BORUSAN_KLASIK128AAC.aac?/;stream.mp3" },
  { name: "Radyodinle", url: "https://radyodinle1.turkhosted.com/yayin?uri=160.75.86.29:8097/&tkn=BikEenJtZVGuck1sPwoESg&tms=1761717042" },
  { name: "SlowTurk", url: "https://radyo.duhnet.tv/slowturk?/;stream.mp3" }
  ,
  { name: "RadyoTVOnline Klasik", url: "https://moondigitaledge.radyotvonline.net/klasikhome/playlist.m3u8?listeningSessionID=68fc672e5e1bb4df_229688_Nc9VxFeB__0000000822a&downloadSessionID=0" },
  { name: "Number1 Classic", url: "https://eustr75.mediatriple.net/Number1Media/08_Number1_Classic.stream/media_w932637451_25662.aac" }
];

export default function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<any | null>(null);
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
    return () => {
      // destroy any HLS instance on unmount
      if (hlsRef.current && typeof hlsRef.current.destroy === 'function') {
        try { hlsRef.current.destroy(); } catch (e) { /* ignore */ }
        hlsRef.current = null;
      }
    };
  }, []);

  // Try playing starting from a station index and fall back to subsequent stations on failure.
  const tryPlayFrom = async (startIndex: number) => {
    const audio = audioRef.current;
    if (!audio) return false;

    const n = STATIONS.length;
    for (let i = 0; i < n; i++) {
      const idx = (startIndex + i) % n;
      const station = STATIONS[idx];
      // destroy previous hls instance (if any) before switching
      if (hlsRef.current && typeof hlsRef.current.destroy === 'function') {
        try { hlsRef.current.destroy(); } catch (e) { /* ignore */ }
        hlsRef.current = null;
      }

      const url = station.url;
      const isHls = url.includes('.m3u8');

      try {
        if (isHls) {
          // dynamic import hls.js
          const HlsModule = await import('hls.js');
          const Hls = HlsModule.default ?? HlsModule;
          if (Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(url);
            hls.attachMedia(audio);
            // give the player a moment to attach before playing
            await audio.play();
            setStationIndex(idx);
            setPlaying(true);
            setStationError(null);
            return true;
          } else {
            // Safari / native HLS fallback
            audio.src = url;
            try { audio.load(); } catch (e) { /* ignore */ }
            await audio.play();
            setStationIndex(idx);
            setPlaying(true);
            setStationError(null);
            return true;
          }
        } else {
          audio.src = url;
          try { audio.load(); } catch (e) { /* ignore */ }
          await audio.play();
          setStationIndex(idx);
          setPlaying(true);
          setStationError(null);
          return true;
        }
      } catch (err) {
        console.warn('Playback failed for station:', station.name, err);
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

import { useState, useEffect } from "react";
import "./AdminPanel.css";

interface ControlState {
	rentalActive: boolean;
	parkMode: boolean;
	gpsSend: boolean;
	statsSend: boolean;
}

export default function AdminPanel() {
	const [state, setState] = useState<ControlState>({
		rentalActive: false,
		parkMode: false,
		gpsSend: false,
		statsSend: false,
	});

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	// Fetch initial state
	useEffect(() => {
		fetchState();
	}, []);

	const fetchState = async () => {
		try {
			setLoading(true);
			setError(null);
			const res = await fetch("/admin/state");
			if (!res.ok) throw new Error("Failed to fetch state");
			const data = await res.json();
			setState(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	};

	const updateState = async (key: keyof ControlState, value: boolean) => {
		try {
			setError(null);
			const newState = { ...state, [key]: value };

			const res = await fetch("/admin/state", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ [key]: value }),
			});

			if (!res.ok) throw new Error("Failed to update state");

			setState(newState);
			setMessage(`✓ ${key} updated to ${value}`);
			setTimeout(() => setMessage(null), 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	const toggleRental = () => updateState("rentalActive", !state.rentalActive);
	const togglePark = () => updateState("parkMode", !state.parkMode);
	const toggleGPS = () => updateState("gpsSend", !state.gpsSend);
	const toggleStats = () => updateState("statsSend", !state.statsSend);

	if (loading) return <div className="admin-panel"><p>Yükleniyor...</p></div>;

	return (
		<div className="admin-panel">
			<div className="admin-container">
				<h1>🔧 ESP32 Control Panel</h1>

				{error && <div className="error-message">❌ {error}</div>}
				{message && <div className="success-message">{message}</div>}

				<div className="control-grid">
					{/* Kiralama */}
					<div className={`control-card ${state.rentalActive ? "active" : ""}`}>
						<h2>Kiralama</h2>
						<p className="status">
							{state.rentalActive ? "✅ AKTİF" : "❌ KAPAL"}
						</p>
						<button
							onClick={toggleRental}
							className={`toggle-btn ${state.rentalActive ? "active" : ""}`}
						>
							{state.rentalActive ? "Kapat" : "Aç"}
						</button>
					</div>

					{/* Park Modu */}
					<div className={`control-card ${state.parkMode ? "active" : ""}`}>
						<h2>Park Modu</h2>
						<p className="status">
							{state.parkMode ? "✅ AKTİF" : "❌ KAPAL"}
						</p>
						<button
							onClick={togglePark}
							className={`toggle-btn ${state.parkMode ? "active" : ""}`}
						>
							{state.parkMode ? "Kapat" : "Aç"}
						</button>
					</div>

					{/* GPS Gönderme */}
					<div className={`control-card ${state.gpsSend ? "active" : ""}`}>
						<h2>GPS Gönder</h2>
						<p className="status">
							{state.gpsSend ? "✅ AKTİF" : "❌ KAPAL"}
						</p>
						<button
							onClick={toggleGPS}
							className={`toggle-btn ${state.gpsSend ? "active" : ""}`}
						>
							{state.gpsSend ? "Kapat" : "Aç"}
						</button>
					</div>

					{/* İstatistik Gönderme */}
					<div className={`control-card ${state.statsSend ? "active" : ""}`}>
						<h2>İstatistik Gönder</h2>
						<p className="status">
							{state.statsSend ? "✅ AKTİF" : "❌ KAPAL"}
						</p>
						<button
							onClick={toggleStats}
							className={`toggle-btn ${state.statsSend ? "active" : ""}`}
						>
							{state.statsSend ? "Kapat" : "Aç"}
						</button>
					</div>
				</div>

				{/* Quick Links */}
				<div className="quick-links">
					<h3>Hızlı Komutlar</h3>
					<button
						onClick={async () => {
							await updateState("rentalActive", true);
							await updateState("parkMode", false);
						}}
						className="quick-btn"
					>
						Kirala (rental=1, park=0)
					</button>
					<button
						onClick={async () => {
							await updateState("rentalActive", false);
							await updateState("parkMode", true);
						}}
						className="quick-btn"
					>
						Park + Kiralama Kapat
					</button>
					<button
						onClick={async () => {
							await updateState("gpsSend", true);
							await new Promise((r) => setTimeout(r, 1000));
							await updateState("gpsSend", false);
						}}
						className="quick-btn"
					>
						GPS Gönder (1x)
					</button>
					<button
						onClick={async () => {
							await updateState("statsSend", true);
							await new Promise((r) => setTimeout(r, 1000));
							await updateState("statsSend", false);
						}}
						className="quick-btn"
					>
						İstatistik Gönder (1x)
					</button>
				</div>

				{/* Info */}
				<div className="info-box">
					<h3>📡 Durum Bilgileri</h3>
					<pre>
						{JSON.stringify(state, null, 2)}
					</pre>
				</div>
			</div>
		</div>
	);
}

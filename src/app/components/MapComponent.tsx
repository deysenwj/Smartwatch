import { useEffect, useState, useRef } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";

// Helper to load Leaflet script & stylesheet from CDN dynamically
function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }
    // Check if stylesheet is already added
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // Load script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve((window as any).L);
    document.body.appendChild(script);
  });
}

// Helper to parse location string "Address | lat,lng"
export function parseLocation(locStr: string): { address: string; lat: number; lng: number } {
  const parts = (locStr || "").split("|");
  const address = parts[0]?.trim() || "";
  let lat = -6.2088; // Default Jakarta
  let lng = 106.8456;
  if (parts[1]) {
    const coords = parts[1].split(",");
    const parsedLat = parseFloat(coords[0]);
    const parsedLng = parseFloat(coords[1]);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      lat = parsedLat;
      lng = parsedLng;
    }
  }
  return { address, lat, lng };
}

interface MapPickerProps {
  value: string; // "Address | lat,lng" or just "Address"
  onChange: (value: string) => void;
}

export function MapPicker({ value, onChange }: MapPickerProps) {
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  const { address, lat, lng } = parseLocation(value);
  const [inputText, setInputText] = useState(address);

  // Sync text input when parent address changes from maps click/drag
  useEffect(() => {
    setInputText(address);
  }, [address]);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;
    loadLeaflet().then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      setLoading(false);

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }

      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([lat, lng], { icon: DefaultIcon, draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", async () => {
        const position = marker.getLatLng();
        await reverseGeocode(position.lat, position.lng, L);
      });

      map.on("click", async (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        await reverseGeocode(clickLat, clickLng, L);
      });
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number, _LInstance: any) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      const addr = data.display_name || `Lokasi di (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      onChange(`${addr} | ${latitude},${longitude}`);
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      onChange(`${address || "Koordinat Terpilih"} | ${latitude},${longitude}`);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
      setLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(inputText)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const searchLat = parseFloat(result.lat);
        const searchLng = parseFloat(result.lon);
        const displayAddr = result.display_name;
        
        onChange(`${displayAddr} | ${searchLat},${searchLng}`);
        
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([searchLat, searchLng], 14);
          markerRef.current.setLatLng([searchLat, searchLng]);
        }
      } else {
        alert("Lokasi tidak ditemukan. Coba pencarian lain.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung layanan lokasi GPS.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        const L = (window as any).L;
        await reverseGeocode(latitude, longitude, L);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        console.error("Geolocation error:", error);
        alert("Gagal mendapatkan lokasi saat ini. Pastikan akses lokasi diizinkan di browser Anda.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const inputCls = "w-full min-w-0 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition";

  return (
    <div className="space-y-3">
      {/* Consolidated Input field & Locate Button */}
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tulis alamat atau cari lokasi kejadian..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className={`${inputCls} pl-10 pr-16`}
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition"
          >
            Cari
          </button>
        </form>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          title="Gunakan lokasi saya saat ini"
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center transition border border-slate-200 dark:border-slate-700 shrink-0"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Map Element */}
      <div className="relative w-full h-64 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden bg-slate-100 dark:bg-slate-900/40">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 z-20">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
        *Ketik alamat di atas lalu klik "Cari", klik tombol navigasi untuk menggunakan lokasi saat ini, atau klik/geser penanda di peta.
      </p>
    </div>
  );
}

interface MapViewerProps {
  locationStr: string; // "Address | lat,lng" or just "Address"
}

export function MapViewer({ locationStr }: MapViewerProps) {
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const { address, lat, lng } = parseLocation(locationStr);

  useEffect(() => {
    let isMounted = true;
    loadLeaflet().then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      setLoading(false);

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      const parts = (locationStr || "").split("|");
      if (!parts[1] && address) {
        setLoading(true);
        fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}`)
          .then(res => res.json())
          .then(data => {
            if (!isMounted) return;
            setLoading(false);
            if (data && data.length > 0) {
              const resLat = parseFloat(data[0].lat);
              const resLng = parseFloat(data[0].lon);
              initializeMap(resLat, resLng, L, DefaultIcon);
            } else {
              initializeMap(lat, lng, L, DefaultIcon);
            }
          })
          .catch(() => {
            if (!isMounted) return;
            setLoading(false);
            initializeMap(lat, lng, L, DefaultIcon);
          });
      } else {
        initializeMap(lat, lng, L, DefaultIcon);
      }
    });

    function initializeMap(mapLat: number, mapLng: number, LInstance: any, icon: any) {
      if (!mapContainerRef.current) return;
      const map = LInstance.map(mapContainerRef.current).setView([mapLat, mapLng], 14);
      mapRef.current = map;

      LInstance.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      LInstance.marker([mapLat, mapLng], { icon }).addTo(map);
    }

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locationStr]);

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">PETA LOKASI</span>
      </div>

      <div className="relative w-full h-48 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden bg-slate-100 dark:bg-slate-900/40">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 z-20">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

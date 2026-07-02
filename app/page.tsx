"use client";

import { useEffect, useMemo, useState } from "react";

type Point = {
  lat: number;
  lng: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  time: string;
};

type Place = {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  time: string;
};

type SavedRoute = {
  id: number;
  routeName: string;
  destination: string;
  points: Point[];
  places: Place[];
  totalDistance: number;
  createdAt: string;
};

function distanceMeters(a?: Point, b?: Point) {
  if (!a || !b) return 0;

  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function Home() {
  const [routeName, setRouteName] = useState("");
  const [destination, setDestination] = useState("");
  const [recording, setRecording] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [current, setCurrent] = useState<Point | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [placeType, setPlaceType] = useState("casa");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
    const saved = localStorage.getItem("current_route");

    if (saved) {
      const parsed = JSON.parse(saved);
      setRouteName(parsed.routeName || "");
      setDestination(parsed.destination || "");
      setPoints(parsed.points || []);
      setPlaces(parsed.places || []);
    }

    const savedRoutesData = localStorage.getItem("saved_routes");
    if (savedRoutesData) {
      setSavedRoutes(JSON.parse(savedRoutesData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "current_route",
      JSON.stringify({ routeName, destination, points, places })
    );
  }, [routeName, destination, points, places]);

  const totalDistance = useMemo(() => {
    return points.reduce((acc, point, index) => {
      if (index === 0) return acc;
      return acc + distanceMeters(points[index - 1], point);
    }, 0);
  }, [points]);

  const startRoute = () => {
    if (!navigator.geolocation) {
      alert("Este dispositivo no soporta GPS en navegador.");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newPoint: Point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          time: new Date().toISOString(),
        };

        setCurrent(newPoint);

        setPoints((prev) => {
          const last = prev[prev.length - 1];
          const moved = distanceMeters(last, newPoint);

          if (!last || moved >= 3) {
            return [...prev, newPoint];
          }

          return prev;
        });
      },
      (err) => {
        alert("Error GPS: " + err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    setWatchId(id);
    setRecording(true);
  };

  const stopRoute = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    setWatchId(null);
    setRecording(false);
  };

  const addPlace = () => {
    if (!current) {
      alert("Todavía no hay punto GPS actual.");
      return;
    }

    if (!placeName.trim()) {
      alert("Ponle nombre al lugar.");
      return;
    }

    setPlaces((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: placeName,
        type: placeType,
        lat: current.lat,
        lng: current.lng,
        accuracy: current.accuracy,
        time: new Date().toISOString(),
      },
    ]);

    setPlaceName("");
  };

  const saveRoute = () => {
    if (points.length === 0) {
      alert("No hay puntos GPS para guardar.");
      return;
    }

    const route: SavedRoute = {
      id: Date.now(),
      routeName: routeName || "Ruta sin nombre",
      destination,
      points,
      places,
      totalDistance,
      createdAt: new Date().toISOString(),
    };

    const updated = [route, ...savedRoutes];

    setSavedRoutes(updated);
    localStorage.setItem("saved_routes", JSON.stringify(updated));

    alert("Ruta guardada correctamente.");
  };

  const exportGeoJSON = () => {
    const geojson = {
      type: "FeatureCollection",
      properties: {
        routeName,
        destination,
        totalDistanceMeters: totalDistance,
      },
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: points.map((p) => [p.lng, p.lat]),
          },
          properties: {
            name: routeName,
            destination,
          },
        },
        ...places.map((place) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [place.lng, place.lat],
          },
          properties: place,
        })),
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${routeName || "ruta"}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearRoute = () => {
    if (!confirm("¿Borrar ruta actual?")) return;

    stopRoute();
    setRouteName("");
    setDestination("");
    setPoints([]);
    setPlaces([]);
    setCurrent(null);
    localStorage.removeItem("current_route");
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white">
      <div className="mx-auto max-w-xl space-y-5">
        <div>
          <h1 className="text-3xl font-bold">Explorador de Rutas</h1>
          <p className="mt-1 text-slate-400">
            Graba caminos, marca lugares y exporta la ruta.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <label className="text-sm text-slate-300">Nombre de ruta</label>
          <input
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none"
            placeholder="Ej: San Isidro - La Unión"
          />

          <label className="mt-4 block text-sm text-slate-300">Destino</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none"
            placeholder="Ej: Casa Don Pedro"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Info title="Puntos GPS" value={points.length} />
          <Info title="Lugares" value={places.length} />
          <Info title="Distancia" value={`${(totalDistance / 1000).toFixed(2)} km`} />
          <Info title="Precisión" value={current ? `${Math.round(current.accuracy || 0)} m` : "--"} />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          {!recording ? (
            <button
              onClick={startRoute}
              className="w-full rounded-xl bg-green-500 py-4 text-xl font-bold text-white"
            >
              ▶ Iniciar ruta
            </button>
          ) : (
            <button
              onClick={stopRoute}
              className="w-full rounded-xl bg-red-500 py-4 text-xl font-bold text-white"
            >
              ■ Finalizar ruta
            </button>
          )}

          <p className="mt-3 text-sm text-slate-400">
            Estado: {recording ? "Grabando GPS..." : "Detenido"}
          </p>

          {current && (
            <p className="mt-2 text-xs text-slate-500">
              {current.lat.toFixed(6)}, {current.lng.toFixed(6)}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold">Marcar lugar</h2>

          <input
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none"
            placeholder="Ej: Puente, tienda, escuela..."
          />

          <select
            value={placeType}
            onChange={(e) => setPlaceType(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none"
          >
            <option value="casa">Casa</option>
            <option value="tienda">Tienda</option>
            <option value="escuela">Escuela</option>
            <option value="puente">Puente</option>
            <option value="entrada">Entrada</option>
            <option value="cliente">Cliente</option>
            <option value="riesgo">Riesgo</option>
            <option value="otro">Otro</option>
          </select>

          <button
            onClick={addPlace}
            className="mt-3 w-full rounded-xl bg-blue-500 py-3 font-bold text-white"
          >
            📍 Guardar lugar actual
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            onClick={saveRoute}
            className="rounded-xl bg-blue-500 py-3 font-bold text-white"
          >
            Guardar ruta
          </button>

          <button
            onClick={exportGeoJSON}
            className="rounded-xl bg-purple-500 py-3 font-bold text-white"
          >
            Exportar
          </button>

          <button
            onClick={clearRoute}
            className="rounded-xl bg-slate-700 py-3 font-bold text-white"
          >
            Borrar
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-xl font-semibold">Lugares marcados</h2>

          {places.length === 0 ? (
            <p className="text-slate-400">Todavía no hay lugares.</p>
          ) : (
            <div className="space-y-3">
              {places.map((p) => (
                <div key={p.id} className="rounded-xl bg-slate-800 p-3">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-slate-400">
                    {p.type} · {p.lat.toFixed(6)}, {p.lng.toFixed(6)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-xl font-semibold">Rutas guardadas</h2>

          {savedRoutes.length === 0 ? (
            <p className="text-slate-400">Todavía no hay rutas guardadas.</p>
          ) : (
            <div className="space-y-3">
              {savedRoutes.map((route) => (
                <div key={route.id} className="rounded-xl bg-slate-800 p-3">
                  <p className="font-semibold">{route.routeName}</p>
                  <p className="text-sm text-slate-400">
                    {(route.totalDistance / 1000).toFixed(2)} km ·{" "}
                    {route.points.length} puntos · {route.places.length} lugares
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Info({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
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

type Props = {
  current: Point | null;
  recording: boolean;
  pointsCount: number;
  placesCount: number;
  savedRoutesCount: number;
  totalDistance: number;
};

function gpsQuality(accuracy: number | null) {
  if (!accuracy) return { label: "Sin señal", color: "text-red-300" };
  if (accuracy <= 5) return { label: "Excelente", color: "text-green-300" };
  if (accuracy <= 10) return { label: "Buena", color: "text-green-300" };
  if (accuracy <= 20) return { label: "Regular", color: "text-yellow-300" };
  return { label: "Mala", color: "text-red-300" };
}

function headingText(heading: number | null) {
  if (heading === null || heading === undefined) return "--";

  const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const index = Math.round(heading / 45) % 8;

  return directions[index];
}

export default function ControlCenter({
  current,
  recording,
  pointsCount,
  placesCount,
  savedRoutesCount,
  totalDistance,
}: Props) {
  const [online, setOnline] = useState(true);
  const [localStatus, setLocalStatus] = useState("Verificando...");

  useEffect(() => {
    setOnline(navigator.onLine);

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    try {
      localStorage.setItem("geocore_storage_test", "ok");
      localStorage.removeItem("geocore_storage_test");
      setLocalStatus("Activa");
    } catch {
      setLocalStatus("Error");
    }

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const quality = gpsQuality(current?.accuracy ?? null);

  const speedKmH = useMemo(() => {
    if (!current?.speed && current?.speed !== 0) return "--";
    return `${(current.speed * 3.6).toFixed(1)} km/h`;
  }, [current]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Centro de Control</h2>
          <p className="text-sm text-slate-400">
            Estado del GPS, conexión y guardado local
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm ${
            recording
              ? "bg-green-500/20 text-green-300"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {recording ? "Grabando" : "Detenido"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Status title="GPS" value={quality.label} className={quality.color} />
        <Status
          title="Precisión"
          value={current ? `${Math.round(current.accuracy || 0)} m` : "--"}
        />
        <Status
          title="Internet"
          value={online ? "Conectado" : "Sin conexión"}
          className={online ? "text-green-300" : "text-red-300"}
        />
        <Status
          title="Base local"
          value={localStatus}
          className={localStatus === "Activa" ? "text-green-300" : "text-red-300"}
        />
        <Status title="Velocidad" value={speedKmH} />
        <Status
          title="Altitud"
          value={current?.altitude ? `${current.altitude.toFixed(1)} m` : "--"}
        />
        <Status title="Rumbo" value={headingText(current?.heading ?? null)} />
        <Status
          title="Distancia"
          value={`${(totalDistance / 1000).toFixed(2)} km`}
        />
        <Status title="Puntos GPS" value={pointsCount} />
        <Status title="Lugares" value={placesCount} />
        <Status title="Rutas guardadas" value={savedRoutesCount} />
        <Status title="Pendientes" value={savedRoutesCount} />
      </div>

      {current && (
        <p className="mt-4 text-xs text-slate-500">
          Última lectura: {new Date(current.time).toLocaleString()}
        </p>
      )}
    </section>
  );
}

function Status({
  title,
  value,
  className = "text-white",
}: {
  title: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <p className="text-xs text-slate-400">{title}</p>
      <p className={`mt-1 text-lg font-bold ${className}`}>{value}</p>
    </div>
  );
}
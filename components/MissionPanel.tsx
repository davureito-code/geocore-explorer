"use client";

type Props = {
  missionName: string;
  setMissionName: (value: string) => void;
  sectorName: string;
  setSectorName: (value: string) => void;
  missionType: string;
  setMissionType: (value: string) => void;
};

export default function MissionPanel({
  missionName,
  setMissionName,
  sectorName,
  setSectorName,
  missionType,
  setMissionType,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Misión</h2>
        <p className="text-sm text-slate-400">
          Define el objetivo del recorrido.
        </p>
      </div>

      <label className="text-sm text-slate-300">Nombre de misión</label>
      <input
        value={missionName}
        onChange={(e) => setMissionName(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none"
        placeholder="Ej: Mapear San Isidro Norte"
      />

      <label className="mt-4 block text-sm text-slate-300">Sector</label>
      <input
        value={sectorName}
        onChange={(e) => setSectorName(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none"
        placeholder="Ej: Sector La Unión"
      />

      <label className="mt-4 block text-sm text-slate-300">Tipo de misión</label>
      <select
        value={missionType}
        onChange={(e) => setMissionType(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none"
      >
        <option value="mapear_sector">Mapear sector</option>
        <option value="revisar_ruta">Revisar ruta</option>
        <option value="marcar_lugares">Marcar lugares</option>
        <option value="inspeccion">Inspección</option>
        <option value="emergencia">Emergencia / alerta</option>
      </select>
    </section>
  );
}
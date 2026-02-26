export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-6 px-4 text-center hidden md:block">
      <p className="text-xs text-gray-400">
        EcoTrack — Cartografía Participativa de Riesgos Hidrometeorológicos ·
        Hermosillo, Sonora · {new Date().getFullYear()}
      </p>
    </footer>
  );
}

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/app/ThemeContext";

const pageTitle = (pathname) => {
  const map = {
    "/dashboard": "Dashboard",
    "/captaciones": "Captaciones",
    "/pre-siniestro": "Pre-Siniestros",
    "/siniestros": "Siniestros",
    "/usuarios": "Usuarios",
    "/configuracion": "Configuración",
    "/historial": "Historial",
  };
  return map[pathname] || "ASESUR";
};

export default function TopBar() {
  const pathname = usePathname();
  const title = useMemo(() => pageTitle(pathname), [pathname]);
  const [q, setQ] = useState("");
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex justify-between items-center w-full px-8 py-6 bg-surface/60 backdrop-blur-sm sticky top-0 z-40 border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">{title.toUpperCase()}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">search</span>
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-on-surface placeholder:text-on-surface-variant"
            placeholder="Buscar expedientes..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button title="Notificaciones" className="p-2 rounded-full hover:bg-surface-container-highest transition-colors relative text-primary">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-surface-container"></span>
          </button>
          <button title="Ayuda" className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-primary">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-primary"
          >
            <span className="material-symbols-outlined">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

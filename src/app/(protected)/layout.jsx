// src/app/(protected)/layout.jsx
import Sidebar from "@/components/sidebar/Sidebar";
import TopBar from "@/components/sidebar/TopBar";

export default function ProtectedLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Área derecha: deja espacio al sidebar */}
      <div className="pl-[280px]">
        {/* Layout columna con TopBar sticky y contenido con scroll */}
        <div className="flex min-h-screen flex-col">
          <div className="sticky top-0 z-40">
            <TopBar />
          </div>

          {/* SOLO aquí se hace scroll */}
          <main className="flex-1 overflow-y-auto p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

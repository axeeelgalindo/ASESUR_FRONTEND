"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import TopBar from "@/components/sidebar/TopBar";

export default function ProtectedLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen ">
      {/* Sidebar fijo */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Área derecha: deja espacio al sidebar */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ paddingLeft: isCollapsed ? "80px" : "256px" }}
      >
        {/* Layout columna con TopBar sticky y contenido con scroll */}
        <div className="flex flex-col">
          <div className="sticky top-0 z-40">
            <TopBar />
          </div>

          {/* SOLO aquí se hace scroll */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/login", { method: "DELETE" });
        window.location.href = "/admin/login";
      }}
      className="flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors w-full"
    >
      <LogOut className="w-5 h-5" />
      Cerrar Sesión
    </button>
  );
}
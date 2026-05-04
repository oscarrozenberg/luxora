"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookies_acknowledged");
    if (!accepted) setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem("cookies_acknowledged", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm bg-white border border-gray-200 rounded-2xl shadow-lg p-4 z-50">
      <p className="text-sm text-gray-700 mb-1 font-medium">🍪 Cookies</p>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        Luxor-A utilise uniquement des cookies techniques nécessaires au fonctionnement de la plateforme (authentification, session). Aucun cookie publicitaire.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={dismiss}
          className="flex-1 py-2 bg-purple-700 text-white text-xs font-medium rounded-lg hover:bg-purple-800 transition-colors"
        >
          J'ai compris
        </button>
        <Link
          href="/politique-confidentialite"
          className="text-xs text-purple-700 hover:underline"
        >
          En savoir plus
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">

      <div className="text-center max-w-md">

        <p className="text-8xl font-medium text-purple-100 mb-2">404</p>

        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>

        <h1 className="text-2xl font-medium text-gray-900 mb-3">
          Page introuvable
        </h1>

        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          La page que tu cherches n'existe pas ou a été supprimée. Retourne à l'accueil pour trouver ce dont tu as besoin.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-purple-700 text-white text-sm font-medium rounded-xl hover:bg-purple-800 transition-colors"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/listings/new"
            className="px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Publier une annonce
          </Link>
        </div>

        <p className="text-xs text-gray-300 mt-8">Luxora — Plateforme de location entre particuliers</p>
      </div>
    </div>
  );
}

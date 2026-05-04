import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Mentions légales</h1>
        <p className="text-xs text-gray-400 mb-10">Conformément à l'article 6 de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.</p>

        <div className="flex flex-col gap-8 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">1. Éditeur du site</h2>
            <p className="mb-2"><strong>Nom de la société :</strong> Luxor-A</p>
            <p className="mb-2"><strong>Forme juridique :</strong> En cours de création</p>
            <p className="mb-2"><strong>Siège social :</strong> France</p>
            <p className="mb-2"><strong>Email de contact :</strong> contact@luxor-a.app</p>
            <p className="mb-2"><strong>Directeur de la publication :</strong> Oscar Rozenberg</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">2. Hébergeur</h2>
            <p className="mb-2"><strong>Hébergeur du site :</strong> Vercel Inc.</p>
            <p className="mb-2"><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
            <p className="mb-2"><strong>Site web :</strong> vercel.com</p>
            <p className="mb-2"><strong>Base de données :</strong> Supabase Inc., San Francisco, CA, États-Unis</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">3. Activité</h2>
            <p>Luxor-A est une plateforme de mise en relation entre particuliers pour la location d'objets. La plateforme agit en qualité d'intermédiaire technique au sens de la loi pour la confiance dans l'économie numérique (LCEN) du 21 juin 2004.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">4. Propriété intellectuelle</h2>
            <p>L'ensemble des éléments constituant le site Luxor-A (design, logo, textes, fonctionnalités) sont la propriété exclusive de Luxor-A et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation ou utilisation sans autorisation expresse est strictement interdite.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">5. Responsabilité</h2>
            <p>Luxor-A ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site, d'une interruption de service, ou du contenu publié par les utilisateurs. Les informations publiées sur le site sont susceptibles d'être modifiées à tout moment et sans préavis.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">6. Données personnelles</h2>
            <p className="mb-2">Les données personnelles collectées sur Luxor-A font l'objet d'un traitement informatique conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679).</p>
            <p className="mb-2">Conformément à la loi Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (droit à l'oubli)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition</li>
            </ul>
            <p className="mt-2">Pour exercer ces droits : <strong>contact@luxor-a.app</strong></p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">7. Cookies</h2>
            <p>Le site Luxor-A utilise des cookies techniques nécessaires au fonctionnement de la plateforme (authentification, préférences). Aucun cookie publicitaire n'est utilisé. Conformément à la directive ePrivacy, vous pouvez paramétrer votre navigateur pour refuser les cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">8. Paiements</h2>
            <p>Les paiements en ligne sur Luxor-A sont traités par <strong>Stripe Inc.</strong> (185 Berry Street, Suite 550, San Francisco, CA 94107, USA), prestataire de services de paiement agréé. Luxor-A ne stocke aucune donnée bancaire sur ses serveurs.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">9. Médiation</h2>
            <p>Conformément à l'article L.616-1 du Code de la consommation, Luxor-A propose un dispositif de médiation de la consommation. En cas de litige non résolu, vous pouvez recourir gratuitement au médiateur de la consommation. Coordonnées du médiateur : en cours de désignation.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">10. Droit applicable</h2>
            <p>Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Luxor-A — Mentions légales</p>
          <Link href="/legal" className="text-xs text-purple-700 hover:underline">Conditions générales d'utilisation →</Link>
        </div>
      </div>
    </div>
  );
}

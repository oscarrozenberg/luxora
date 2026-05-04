import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">Conditions Générales d'Utilisation</h1>
        <p className="text-xs text-gray-400 mb-10">Dernière mise à jour : mai 2025 — Version 2.0</p>
        <div className="flex flex-col gap-8 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">1. Présentation et objet</h2>
            <p className="mb-3">Luxor-A est une plateforme numérique de mise en relation entre particuliers permettant la location d'articles de toute nature. La plateforme agit exclusivement en tant qu'intermédiaire technique au sens de la loi pour la confiance dans l'économie numérique (LCEN) du 21 juin 2004.</p>
            <p>Toute utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">2. Rôle de Luxor-A</h2>
            <p className="mb-3">Luxor-A n'est ni loueur ni locataire. La plateforme ne garantit pas la qualité des articles, la solvabilité des utilisateurs, ni l'issue des transactions. Luxor-A se réserve le droit de suspendre tout compte ou annonce sans préavis.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">3. Inscription</h2>
            <p className="mb-3">L'accès aux fonctionnalités principales est réservé aux utilisateurs inscrits, âgés d'au moins 18 ans. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">4. Publication d'annonces</h2>
            <p className="mb-3">Le Loueur s'engage à décrire l'article de manière exacte, à en être propriétaire ou avoir le droit de le louer, et à respecter la législation applicable. Tout article illégal, dangereux ou contrefait est strictement interdit.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">5. Frais de service</h2>
            <p className="mb-3">Des frais de service de <strong>12% TTC</strong> du montant de la location sont prélevés sur les paiements par carte bancaire. Ces frais sont affichés avant toute confirmation. Aucun frais n'est appliqué sur les paiements en espèces. Les frais de service ne sont pas remboursables sauf manquement avéré de Luxor-A.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">6. Réservations et contrat</h2>
            <p className="mb-3">Toute réservation génère automatiquement un contrat de location PDF entre le Loueur et le Locataire. Luxor-A n'est pas partie à ce contrat. La réservation est soumise à la confirmation du Loueur. En cas d'annulation par le Locataire moins de 24h avant la location, des frais de 50% peuvent être retenus.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">7. Caution</h2>
            <p className="mb-3">Le Loueur peut exiger une caution dont le montant est affiché avant toute réservation. La caution est remboursée dans un délai de 48 heures suivant la restitution de l'article, après vérification de son état. En cas de dommage, le Loueur peut retenir tout ou partie de la caution, à charge pour lui d'en justifier le montant. Luxor-A n'intervient pas dans les litiges relatifs à la caution.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">8. Assurance</h2>
            <p className="mb-3">Luxor-A ne fournit aucune assurance. Chaque utilisateur est responsable de souscrire les assurances adaptées.</p>
            <p className="mb-2"><strong>Véhicules :</strong> La location de véhicules motorisés est soumise à l'obligation légale d'assurance. Le Locataire doit disposer d'une assurance couvrant le véhicule pendant toute la durée de la location.</p>
            <p className="mb-2"><strong>Immobilier :</strong> Le Loueur doit vérifier que son assurance habitation autorise la mise à disposition à des tiers.</p>
            <p>Luxor-A décline toute responsabilité en cas de dommage survenu faute d'assurance adéquate.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">9. Responsabilités des utilisateurs</h2>
            <p className="mb-3">Chaque utilisateur est seul responsable de l'exactitude de ses annonces, de l'état des articles loués, du bon déroulement des transactions, du paiement, de la remise et de la restitution des articles, ainsi que de ses obligations fiscales liées aux revenus de location.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">10. Limitation de responsabilité de Luxor-A</h2>
            <p className="mb-3">Luxor-A décline toute responsabilité concernant les litiges entre utilisateurs, la perte ou dégradation d'articles, les pertes financières, la véracité des annonces, et les interruptions de service. Luxor-A n'intervient pas en tant qu'arbitre dans les litiges entre utilisateurs.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">11. Médiation</h2>
            <p className="mb-3">Conformément à l'article L.616-1 du Code de la consommation, tout utilisateur peut recourir gratuitement à un médiateur en cas de litige non résolu avec Luxor-A. Avant toute saisine du médiateur, une réclamation écrite doit être adressée à <strong>contact@luxor-a.app</strong>. En l'absence de réponse satisfaisante sous 30 jours, le médiateur peut être saisi. Coordonnées du médiateur : en cours de désignation.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">12. Contenus interdits</h2>
            <p className="mb-3">Il est interdit de publier des articles illégaux, des armes, des substances dangereuses ou stupéfiantes, des contrefaçons, du contenu pornographique ou haineux, ou des annonces frauduleuses. Tout manquement peut entraîner la suspension immédiate du compte et un signalement aux autorités.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">13. Paiements et obligations légales</h2>
            <p className="mb-3">Les paiements en ligne sont traités par <strong>Stripe Inc.</strong>, prestataire de services de paiement agréé. Luxor-A ne stocke aucune donnée bancaire. Conformément à la directive DAC7, Luxor-A est tenu de déclarer à la DGFiP les revenus des utilisateurs dépassant 30 transactions ou 2 000€ annuels.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">14. Données personnelles</h2>
            <p className="mb-3">Le traitement des données personnelles est régi par notre politique de confidentialité, disponible sur la Plateforme, conformément au RGPD. Chaque utilisateur dispose d'un droit d'accès, de rectification, de suppression et de portabilité de ses données via <strong>contact@luxor-a.app</strong>.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">15. Propriété intellectuelle</h2>
            <p>L'ensemble des éléments de la Plateforme sont la propriété exclusive de Luxor-A. Toute reproduction sans autorisation est interdite.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">16. Modification des CGU</h2>
            <p>Luxor-A peut modifier les CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle. La poursuite de l'utilisation vaut acceptation.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">17. Droit applicable</h2>
            <p>Les présentes CGU sont soumises au droit français. Les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux de Paris seront seuls compétents.</p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Luxor-A — CGU Version 2.0</p>
          <Link href="/mentions-legales" className="text-xs text-purple-700 hover:underline">Mentions légales →</Link>
        </div>
      </div>
    </div>
  );
}

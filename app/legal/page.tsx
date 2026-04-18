import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <Link href="/" className="text-xl font-medium tracking-widest text-gray-900">Luxora</Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Retour</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        <h1 className="text-2xl font-medium text-gray-900 mb-1">Conditions Générales d'Utilisation</h1>
        <p className="text-xs text-gray-400 mb-10">Dernière mise à jour : avril 2025 — Version 1.0</p>

        <div className="flex flex-col gap-8 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">1. Présentation et objet</h2>
            <p className="mb-3">Luxora est une plateforme numérique de mise en relation entre particuliers permettant la location d'articles de toute nature (mode, véhicules, immobilier, électronique, loisirs, etc.). La plateforme est éditée et exploitée par Luxora (ci-après "Luxora", "la Plateforme", "nous").</p>
            <p>Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation de la Plateforme par tout utilisateur (ci-après "l'Utilisateur", "le Loueur" ou "le Locataire" selon le rôle exercé). Toute utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">2. Rôle de Luxora — Intermédiaire technique</h2>
            <p className="mb-3">Luxora agit exclusivement en tant qu'intermédiaire technique de mise en relation. À ce titre :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Luxora n'est ni loueur ni locataire dans les transactions réalisées entre utilisateurs.</li>
              <li>Luxora ne prend aucune part aux contrats conclus entre Loueurs et Locataires.</li>
              <li>Luxora ne garantit pas la qualité, la conformité, la légalité ou la disponibilité des articles proposés à la location.</li>
              <li>Luxora ne garantit pas la solvabilité, la bonne foi ou le sérieux des utilisateurs inscrits sur la Plateforme.</li>
              <li>Luxora se réserve le droit de suspendre ou supprimer tout compte ou toute annonce ne respectant pas les présentes CGU, sans préavis ni indemnisation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">3. Inscription et compte utilisateur</h2>
            <p className="mb-3">L'accès aux fonctionnalités principales de la Plateforme (publication d'annonces, réservation, messagerie) est réservé aux utilisateurs inscrits. En créant un compte, l'Utilisateur s'engage à :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Fournir des informations exactes, complètes et à jour.</li>
              <li>Ne pas créer plusieurs comptes ou usurper l'identité d'un tiers.</li>
              <li>Maintenir la confidentialité de ses identifiants de connexion.</li>
              <li>Être âgé d'au moins 18 ans ou avoir l'autorisation d'un représentant légal.</li>
            </ul>
            <p className="mt-3">Luxora se réserve le droit de refuser l'inscription ou de suspendre tout compte à sa seule discrétion.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">4. Publication d'annonces</h2>
            <p className="mb-3">Tout Loueur publiant une annonce sur Luxora s'engage à :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Décrire l'article de manière exacte, complète et non trompeuse.</li>
              <li>Être propriétaire ou avoir le droit de louer l'article proposé.</li>
              <li>Fixer un prix librement, sans pression ni manipulation de la Plateforme.</li>
              <li>Respecter la législation applicable à la location de l'article concerné.</li>
              <li>Ne pas publier d'articles illégaux, dangereux, contrefaits ou dont la location est prohibée.</li>
            </ul>
            <p className="mt-3">Luxora se réserve le droit de supprimer toute annonce ne respectant pas ces conditions, sans obligation de justification.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">5. Frais de service et commission</h2>
            <p className="mb-3">L'utilisation de la Plateforme pour effectuer une réservation est soumise au paiement de frais de service. Ces frais sont à la charge exclusive du Locataire et s'élèvent à <strong>12% du montant total de la location</strong> hors caution.</p>
            <p className="mb-3">Le détail des frais est systématiquement affiché avant toute confirmation de réservation, comprenant :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Le prix de la location fixé par le Loueur.</li>
              <li>Les frais de service Luxora (12% TTC).</li>
              <li>La caution éventuelle fixée par le Loueur.</li>
              <li>Le montant total à régler.</li>
            </ul>
            <p className="mt-3">Les frais de service rémunèrent les services fournis par Luxora, notamment la mise en relation, la messagerie sécurisée, la génération automatique de contrats de location et la maintenance de la Plateforme. Ces frais ne sont pas remboursables sauf en cas de manquement avéré de la part de Luxora.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">6. Réservations et contrat de location</h2>
            <p className="mb-3">Toute réservation effectuée via Luxora génère automatiquement un contrat de location entre le Loueur et le Locataire. Ce contrat est téléchargeable au format PDF et constitue le seul engagement contractuel entre les parties. Luxora n'est pas partie à ce contrat.</p>
            <p className="mb-3">La réservation est soumise à la confirmation du Loueur. Jusqu'à confirmation, aucun engagement ferme n'est établi entre les parties. L'annulation d'une réservation est soumise aux conditions convenues entre le Loueur et le Locataire.</p>
            <p>En cas d'annulation par le Locataire dans les 24 heures suivant la réservation, les frais de service Luxora pourront être retenus à hauteur de 50% du montant réglé.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">7. Responsabilités des utilisateurs</h2>
            <p className="mb-3">Chaque utilisateur est seul et entièrement responsable de :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>L'exactitude des informations et descriptions publiées sur la Plateforme.</li>
              <li>L'état des articles mis en location et leur conformité à la description.</li>
              <li>Tout dommage causé à l'article pendant ou après la période de location.</li>
              <li>Le bon déroulement de la transaction, notamment le paiement, la remise et la restitution de l'article.</li>
              <li>La souscription à toute assurance nécessaire pour couvrir les risques liés à la location.</li>
              <li>Le respect des obligations fiscales liées aux revenus générés par la location.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">8. Limitation de responsabilité de Luxora</h2>
            <p className="mb-3">Dans toute la mesure permise par la loi applicable, Luxora décline expressément toute responsabilité concernant :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Les litiges survenant entre utilisateurs, qu'il s'agisse de non-paiement, de dommages, de retards, de désaccords ou de tout autre différend.</li>
              <li>La perte, le vol, la dégradation ou la destruction d'articles loués via la Plateforme.</li>
              <li>Les pertes financières directes ou indirectes subies par un utilisateur dans le cadre d'une transaction.</li>
              <li>La véracité, l'exactitude ou la légalité des annonces publiées.</li>
              <li>Les interruptions, bugs, erreurs ou indisponibilités temporaires de la Plateforme.</li>
              <li>Tout préjudice résultant de l'utilisation ou de l'impossibilité d'utiliser la Plateforme.</li>
            </ul>
            <p className="mt-3">En cas de litige entre utilisateurs, Luxora n'intervient pas en tant qu'arbitre ou médiateur et ne peut être tenu responsable de l'issue d'un tel litige.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">9. Contenus interdits</h2>
            <p className="mb-3">Il est strictement interdit de publier ou proposer à la location sur Luxora :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Des articles illégaux ou dont la détention, l'usage ou la location est prohibée par la loi.</li>
              <li>Des armes, munitions, explosifs ou substances dangereuses.</li>
              <li>Des substances stupéfiantes ou psychotropes.</li>
              <li>Des articles contrefaits ou portant atteinte aux droits de propriété intellectuelle.</li>
              <li>Du contenu à caractère pornographique, violent, discriminatoire ou incitant à la haine.</li>
              <li>Des annonces frauduleuses, trompeuses ou à des fins d'escroquerie.</li>
            </ul>
            <p className="mt-3">Tout manquement à ces règles pourra entraîner la suppression immédiate du compte et de l'annonce, ainsi qu'un signalement aux autorités compétentes si nécessaire.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">10. Propriété intellectuelle</h2>
            <p>L'ensemble des éléments constituant la Plateforme (design, logo, textes, fonctionnalités) sont la propriété exclusive de Luxora et sont protégés par les lois relatives à la propriété intellectuelle. Toute reproduction, représentation ou utilisation sans autorisation expresse est interdite.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">11. Protection des données personnelles</h2>
            <p className="mb-3">Luxora collecte et traite les données personnelles des utilisateurs dans le respect du Règlement Général sur la Protection des Données (RGPD). Les données collectées sont les suivantes :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Informations de profil : adresse email, nom d'utilisateur, photo de profil, biographie.</li>
              <li>Contenu des annonces publiées et photos associées.</li>
              <li>Messages échangés via la messagerie de la Plateforme.</li>
              <li>Données de réservation et contrats générés.</li>
            </ul>
            <p className="mt-3">Ces données sont utilisées exclusivement pour le fonctionnement de la Plateforme et ne sont jamais vendues à des tiers. Conformément au RGPD, chaque utilisateur dispose d'un droit d'accès, de rectification, de suppression et de portabilité de ses données personnelles. Pour exercer ces droits, l'utilisateur peut contacter Luxora via la Plateforme.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">12. Modification des CGU</h2>
            <p>Luxora se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle. La poursuite de l'utilisation de la Plateforme après notification des modifications vaut acceptation des nouvelles CGU. En cas de désaccord, l'utilisateur peut supprimer son compte à tout moment.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">13. Droit applicable et juridiction</h2>
            <p>Les présentes CGU sont soumises au droit français. En cas de litige relatif à leur interprétation ou à leur exécution, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents du ressort de Paris seront seuls compétents.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">14. Acceptation</h2>
            <p>En créant un compte et en utilisant Luxora, l'utilisateur reconnaît avoir lu, compris et accepté sans réserve l'intégralité des présentes Conditions Générales d'Utilisation. L'utilisation de la Plateforme vaut acceptation inconditionnelle de ces conditions.</p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">Luxora — Plateforme de location entre particuliers</p>
          <p className="text-xs text-gray-300 mt-1">Pour toute question : contact@luxora.app</p>
        </div>

      </div>
    </div>
  );
}

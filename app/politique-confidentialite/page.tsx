import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Politique de confidentialité</h1>
        <p className="text-xs text-gray-400 mb-10">Dernière mise à jour : mai 2025 — Conformément au RGPD (Règlement UE 2016/679)</p>

        <div className="flex flex-col gap-8 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">1. Responsable du traitement</h2>
            <p>Luxor-A est responsable du traitement de vos données personnelles. Contact : <strong>contact@luxor-a.app</strong></p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">2. Données collectées</h2>
            <div className="flex flex-col gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900 mb-2">Données d'identification</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Données :</strong> Adresse email, nom d'utilisateur, nom complet, photo de profil, biographie</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Base légale :</strong> Exécution du contrat</p>
                <p className="text-xs text-gray-500"><strong>Durée :</strong> Durée du compte + 3 ans après inactivité</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900 mb-2">Documents d'identité</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Données :</strong> CNI, passeport, permis de conduire, selfie</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Base légale :</strong> Obligation légale (KYC)</p>
                <p className="text-xs text-gray-500"><strong>Durée :</strong> 5 ans après la dernière transaction</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900 mb-2">Données de paiement</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Données :</strong> Traitées exclusivement par Stripe — Luxor-A ne stocke aucune donnée bancaire</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Base légale :</strong> Exécution du contrat</p>
                <p className="text-xs text-gray-500"><strong>Durée :</strong> 5 ans (obligation légale comptable)</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900 mb-2">Messages et conversations</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Données :</strong> Contenu des messages échangés entre utilisateurs</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Base légale :</strong> Exécution du contrat</p>
                <p className="text-xs text-gray-500"><strong>Durée :</strong> 3 ans après la fin de la relation contractuelle</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900 mb-2">Annonces et photos</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Données :</strong> Titre, description, photos, prix, localisation (ville)</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Base légale :</strong> Exécution du contrat</p>
                <p className="text-xs text-gray-500"><strong>Durée :</strong> Durée de l'annonce + 1 an</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-900 mb-2">Données de navigation</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Données :</strong> Cookies techniques d'authentification uniquement</p>
                <p className="text-xs text-gray-500 mb-1"><strong>Base légale :</strong> Intérêt légitime (fonctionnement du site)</p>
                <p className="text-xs text-gray-500"><strong>Durée :</strong> Session</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">3. Finalités du traitement</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Création et gestion de votre compte utilisateur</li>
              <li>Mise en relation entre loueurs et locataires</li>
              <li>Traitement des paiements et de la commission</li>
              <li>Vérification d'identité pour certaines catégories</li>
              <li>Gestion des litiges et signalements</li>
              <li>Respect des obligations légales (DAC7, KYC, AML)</li>
              <li>Amélioration de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">4. Destinataires des données</h2>
            <p className="mb-3">Vos données sont accessibles uniquement par :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>L'équipe Luxor-A</strong> — pour la gestion de la plateforme et des litiges</li>
              <li><strong>Stripe Inc.</strong> — pour le traitement des paiements (sous-traitant agréé)</li>
              <li><strong>Supabase Inc.</strong> — pour le stockage des données (sous-traitant)</li>
              <li><strong>Vercel Inc.</strong> — pour l'hébergement du site (sous-traitant)</li>
              <li><strong>Resend Inc.</strong> — pour l'envoi d'emails transactionnels (sous-traitant)</li>
            </ul>
            <p className="mt-3">Vos données ne sont jamais vendues à des tiers. Elles ne sont transmises qu'aux sous-traitants nécessaires au fonctionnement de la plateforme, dans le cadre de contrats conformes au RGPD.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">5. Transferts hors UE</h2>
            <p>Certains de nos sous-traitants (Stripe, Supabase, Vercel) sont basés aux États-Unis. Ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne et le mécanisme EU-US Data Privacy Framework, garantissant un niveau de protection adéquat.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">6. Vos droits</h2>
            <p className="mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> — corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement</strong> — supprimer votre compte et vos données</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format lisible</li>
              <li><strong>Droit d'opposition</strong> — vous opposer à certains traitements</li>
              <li><strong>Droit à la limitation</strong> — limiter le traitement de vos données</li>
            </ul>
            <p className="mt-3">Pour exercer ces droits, contactez-nous à <strong>contact@luxor-a.app</strong>. Réponse sous 30 jours maximum.</p>
            <p className="mt-2">Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) : <strong>cnil.fr</strong></p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">7. Sécurité des données</h2>
            <p>Luxor-A met en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données :</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Chiffrement des données en transit (HTTPS)</li>
              <li>Stockage sécurisé des documents d'identité</li>
              <li>Accès restreint aux données personnelles</li>
              <li>Authentification sécurisée via Supabase Auth</li>
            </ul>
            <p className="mt-3">En cas de violation de données susceptible d'engendrer un risque pour vos droits, vous serez notifié dans les 72 heures conformément à l'article 33 du RGPD.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">8. Cookies</h2>
            <p>Luxor-A utilise uniquement des cookies techniques strictement nécessaires au fonctionnement de la plateforme (gestion de session, authentification). Aucun cookie publicitaire ou de tracking n'est utilisé. Ces cookies ne nécessitent pas votre consentement conformément à l'article 82 de la loi Informatique et Libertés.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">9. Obligations DAC7</h2>
            <p>Conformément à la directive DAC7 (2021/514/UE), transposée en droit français, Luxor-A est tenu de collecter et déclarer à la Direction Générale des Finances Publiques (DGFiP) les informations relatives aux utilisateurs qui réalisent plus de 30 transactions ou perçoivent plus de 2 000€ de revenus annuels via la plateforme. Cette déclaration est effectuée avant le 31 janvier de chaque année. Vous en serez informé par email.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-gray-900 mb-3">10. Modification de la politique</h2>
            <p>Luxor-A se réserve le droit de modifier la présente politique de confidentialité. Toute modification substantielle vous sera notifiée par email au moins 30 jours avant son entrée en vigueur. La poursuite de l'utilisation de la plateforme après notification vaut acceptation des modifications.</p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Luxor-A — Politique de confidentialité</p>
          <Link href="/mentions-legales" className="text-xs text-purple-700 hover:underline">Mentions légales →</Link>
        </div>
      </div>
    </div>
  );
}

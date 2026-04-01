import { useState } from "react";
import PricingModal from "@/components/PricingModal";

export default function Footer() {
  const lang = "fr"; // You can make this dynamic if needed
  const [pricingOpen, setPricingOpen] = useState(false);
  
  return (
    <>
      <footer className="border-t border-border glass backdrop-blur-xl py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-t-primary font-bold text-lg">
                  Deez<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">Link</span>
                </span>
              </div>
              <p className="text-sm text-t-muted leading-relaxed">
                {lang === "fr"
                  ? "Liens d'activation Deezer Premium à prix dégressifs. Livraison instantanée, paiement crypto sécurisé."
                  : "Deezer Premium activation links at volume pricing. Instant delivery, secure crypto payment."}
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-sm font-semibold text-t-primary mb-4">
                {lang === "fr" ? "Navigation" : "Navigation"}
              </h3>
              <ul className="space-y-2 text-sm text-t-muted">
                <li>
                  <a href="/" className="hover:text-t-primary transition-colors">
                    {lang === "fr" ? "Accueil" : "Home"}
                  </a>
                </li>
                <li>
                  <a href="/offers" className="hover:text-t-primary transition-colors">
                    {lang === "fr" ? "Offres" : "Offers"}
                  </a>
                </li>
                <li>
                  <a href="/history" className="hover:text-t-primary transition-colors">
                    {lang === "fr" ? "Mes commandes" : "My orders"}
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setPricingOpen(true)}
                    className="hover:text-accent transition-colors text-left">
                    {lang === "fr" ? "Détails sur les prix dégressifs" : "Volume pricing details"}
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-t-primary mb-4">
                {lang === "fr" ? "Légal" : "Legal"}
              </h3>
              <ul className="space-y-2 text-sm text-t-muted">
                <li>
                  <a href="#" className="hover:text-t-primary transition-colors">
                    {lang === "fr" ? "CGU" : "Terms"}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-t-primary transition-colors">
                    {lang === "fr" ? "Politique de confidentialité" : "Privacy Policy"}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-t-primary transition-colors">
                    {lang === "fr" ? "Politique de remboursement" : "Refund Policy"}
                  </a>
                </li>
              </ul>
            </div>

            {/* Payment */}
            <div>
              <h3 className="text-sm font-semibold text-t-primary mb-4">
                {lang === "fr" ? "Paiement" : "Payment"}
              </h3>
              <p className="text-xs text-t-muted mb-3">
                {lang === "fr" ? "Crypto acceptée via OxaPay" : "Crypto accepted via OxaPay"}
              </p>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                <span className="px-2 py-1 glass rounded text-t-secondary">BTC</span>
                <span className="px-2 py-1 glass rounded text-t-secondary">ETH</span>
                <span className="px-2 py-1 glass rounded text-t-secondary">USDT</span>
                <span className="px-2 py-1 glass rounded text-t-secondary">LTC</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-t-muted">
            <p>&copy; {new Date().getFullYear()} DeezLink. {lang === "fr" ? "Tous droits réservés." : "All rights reserved."}</p>
            <p className="text-xs">
              {lang === "fr" ? "Fait avec" : "Made with"} <span className="text-accent">♥</span> {lang === "fr" ? "par" : "by"} DeezLink
            </p>
          </div>
        </div>
      </footer>

      {/* Pricing Modal */}
      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} lang={lang} />
    </>
  );
}

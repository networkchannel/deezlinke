import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const TIERS = [
  { min: 1, max: 9, price: "5,00" },
  { min: 10, max: 49, price: "3,50" },
  { min: 50, max: 99, price: "3,00" },
  { min: 100, max: 199, price: "2,00" },
  { min: 200, max: 499, price: "1,80" },
  { min: 500, max: null, price: "1,50" },
];

export default function PricingModal({ isOpen, onClose, lang = "fr" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="glass backdrop-blur-xl rounded-2xl border border-border max-w-2xl w-full max-h-[80vh] overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-t-primary">
                  {lang === "fr" ? "Tarifs Dégressifs" : "Volume Pricing"}
                </h2>
                <button
                  onClick={onClose}
                  className="text-t-muted hover:text-t-primary transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-sm text-t-secondary mb-6">
                  {lang === "fr"
                    ? "Plus vous achetez, moins vous payez par lien. Profitez de nos tarifs dégressifs !"
                    : "The more you buy, the less you pay per link. Take advantage of our volume pricing!"}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TIERS.map((tier, i) => {
                    const isLast = i === TIERS.length - 1;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-4 rounded-xl text-center ${
                          isLast ? "bg-green-dim border border-green/20" : "glass"
                        }`}>
                        <p className="text-xs text-t-muted mb-1">
                          {tier.max ? `${tier.min} – ${tier.max}` : `${tier.min}+`}
                        </p>
                        <p className={`text-2xl font-bold tabular-nums ${isLast ? "text-green" : "text-t-primary"}`}>
                          {tier.price}€
                        </p>
                        <p className="text-[10px] text-t-muted mt-1">
                          / {lang === "fr" ? "lien" : "link"}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Best deal highlight */}
                <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <p className="text-sm text-accent font-semibold text-center">
                    💰 {lang === "fr" 
                      ? "Meilleur tarif : 1,50€/lien pour 500+ liens" 
                      : "Best deal: 1.50€/link for 500+ links"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

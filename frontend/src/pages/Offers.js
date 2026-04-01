import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, Check, Zap, Shield, Users, User } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIERS = [
  { min: 1, max: 9, price: "5,00" },
  { min: 10, max: 49, price: "3,50" },
  { min: 50, max: 99, price: "3,00" },
  { min: 100, max: 199, price: "2,00" },
  { min: 200, max: 499, price: "1,80" },
  { min: 500, max: null, price: "1,50" },
];

function GlassCard({ children, className = "", glow = false }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`glass glass-hover rounded-2xl ${glow ? "shadow-lg shadow-accent-glow" : ""} ${className}`}>
      {children}
    </motion.div>
  );
}

export default function Offers() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || "fr";
  const [packs, setPacks] = useState([]);
  const [customQty, setCustomQty] = useState(25);
  const [pricing, setPricing] = useState(null);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    axios.get(`${API}/packs`).then((r) => setPacks(r.data.packs || r.data)).catch(() => {});
  }, []);

  const fetchPricing = useCallback(() => {
    const timer = setTimeout(() => {
      axios.get(`${API}/pricing/calculate?quantity=${customQty}`).then((r) => setPricing(r.data)).catch(() => {});
    }, 80);
    return () => clearTimeout(timer);
  }, [customQty]);
  useEffect(fetchPricing, [fetchPricing]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="orb-purple" style={{ top: "-10%", right: "-10%" }} />
      <div className="orb-pink" style={{ bottom: "10%", left: "-5%" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold mb-4">
            {lang === "fr" ? "Nos Offres" : "Our Offers"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-t-secondary max-w-2xl mx-auto">
            {lang === "fr"
              ? "Choisissez l'offre qui vous convient. Tarifs dégressifs, livraison instantanée."
              : "Choose the offer that suits you. Volume pricing, instant delivery."}
          </motion.p>
        </div>

        {/* Main Packs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {packs
            .filter((p) => p.id !== "custom")
            .map((pack, i) => {
              const name = t(pack.name_key);
              const hasDiscount = pack.discount > 0;
              const isPopular = pack.highlighted;
              return (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}>
                  <GlassCard glow={isPopular} className="p-8 relative overflow-hidden h-full flex flex-col">
                    {isPopular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-br from-accent to-secondary text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                        {lang === "fr" ? "POPULAIRE" : "POPULAR"}
                      </div>
                    )}

                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
                        {pack.id === "solo" && <User className="h-8 w-8 text-accent" />}
                        {pack.id === "duo" && <Users className="h-8 w-8 text-accent" />}
                        {pack.id === "family" && <Users className="h-8 w-8 text-accent" />}
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-t-primary mb-2">{name}</h3>
                      <p className="text-sm text-t-muted">
                        {pack.quantity} {lang === "fr" ? (pack.quantity > 1 ? "liens" : "lien") : pack.quantity > 1 ? "links" : "link"}
                      </p>
                    </div>

                    {hasDiscount && (
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-sm text-green font-semibold bg-green-dim px-3 py-1 rounded-lg">
                          -{pack.discount}%
                        </span>
                        <span className="text-sm text-t-muted line-through">
                          {(pack.price / (1 - pack.discount / 100)).toFixed(0)}€
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary tabular-nums">
                        {pack.price.toFixed(0)}€
                      </span>
                      <p className="text-sm text-t-muted mt-2">
                        {pack.unit_price.toFixed(2)}€ / {lang === "fr" ? "lien" : "link"}
                      </p>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2 text-sm text-t-secondary">
                        <Check className="h-4 w-4 text-green" />
                        <span>{lang === "fr" ? "Livraison instantanée" : "Instant delivery"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-t-secondary">
                        <Check className="h-4 w-4 text-green" />
                        <span>{lang === "fr" ? "Garantie 30 jours" : "30-day guarantee"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-t-secondary">
                        <Check className="h-4 w-4 text-green" />
                        <span>{lang === "fr" ? "Paiement sécurisé" : "Secure payment"}</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/checkout/${pack.id}`)}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-accent-glow mt-auto">
                      {lang === "fr" ? "Choisir" : "Choose"}
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </GlassCard>
                </motion.div>
              );
            })}
        </div>

        {/* Custom Pack (show on demand) */}
        {!showCustom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-12">
            <button
              onClick={() => setShowCustom(true)}
              className="text-sm text-t-muted hover:text-t-primary transition-colors">
              {lang === "fr" ? "Besoin d'une quantité personnalisée ?" : "Need a custom quantity?"}{" "}
              <span className="text-accent font-semibold">{lang === "fr" ? "Cliquez ici" : "Click here"}</span>
            </button>
          </motion.div>
        )}

        {showCustom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto mb-12">
            <GlassCard className="p-8">
              <h3 className="text-2xl font-bold text-t-primary mb-2 text-center">
                {lang === "fr" ? "Pack Sur Mesure" : "Custom Pack"}
              </h3>
              <p className="text-sm text-t-muted mb-8 text-center">
                {lang === "fr" ? "Choisissez exactement la quantité dont vous avez besoin" : "Choose exactly the quantity you need"}
              </p>

              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-sm text-t-muted">{lang === "fr" ? "Nombre de liens" : "Number of links"}</span>
                  <span className="text-3xl font-bold text-accent tabular-nums">{customQty}</span>
                </div>
                <Slider
                  value={[customQty]}
                  min={1}
                  max={1000}
                  step={1}
                  onValueChange={([v]) => setCustomQty(v)}
                  className="mb-3"
                />
                <div className="flex justify-between text-xs text-t-muted tabular-nums">
                  <span>1</span>
                  <span>1000</span>
                </div>
              </div>

              {pricing && (
                <div className="flex items-center justify-between text-sm mb-6 p-4 glass rounded-xl">
                  <span className="text-t-muted">
                    {pricing.unit_price?.toFixed(2)}€ / {lang === "fr" ? "lien" : "link"}
                  </span>
                  {pricing.savings > 0 && (
                    <span className="text-green font-semibold">
                      -{pricing.savings?.toFixed(0)}€ {lang === "fr" ? "économisés" : "saved"}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-semibold text-t-primary">Total</span>
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary tabular-nums">
                  {pricing ? `${pricing.total?.toFixed(0)}€` : "—"}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/checkout/custom?qty=${customQty}`)}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-accent-glow">
                {lang === "fr" ? "Continuer" : "Continue"}
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}

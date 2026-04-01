import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Equalizer } from "@/components/Equalizer";
import { ArrowRight, Package, Users, Sparkles, Music2, Star, BarChart3 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Offers() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [customQty, setCustomQty] = useState(10);
  const [pricing, setPricing] = useState(null);
  const lang = i18n.language || "en";

  useEffect(() => {
    axios.get(`${API}/packs`).then((r) => setPacks(r.data.packs || r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      axios.get(`${API}/pricing/calculate?quantity=${customQty}`).then((r) => setPricing(r.data)).catch(() => {});
    }, 150);
    return () => clearTimeout(t);
  }, [customQty]);

  const packIcons = [Package, Users];
  const packColors = [
    { gradient: "from-primary to-primary-light", bg: "bg-primary/5", text: "text-primary-light", border: "border-primary/20" },
    { gradient: "from-accent to-accent-light", bg: "bg-accent/5", text: "text-accent-light", border: "border-accent/20" },
  ];

  const tiers = useMemo(() => [
    { range: "1–9", price: "5.00€" },
    { range: "10–49", price: "3.50€" },
    { range: "50–99", price: "3.00€" },
    { range: "100–199", price: "2.80€" },
    { range: "200–499", price: "2.00€" },
    { range: "500+", price: "1.50€" },
  ], []);

  return (
    <div className="min-h-screen py-24 relative" data-testid="offers-page">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[130px]" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] rounded-full bg-accent/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Equalizer count={5} color="#818CF8" height={24} />
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl mt-4">
            <span className="gradient-text">{t("offers_title")}</span>
          </h1>
          <p className="text-text-secondary text-sm mt-3 max-w-md mx-auto">{t("offers_sub")}</p>
        </motion.div>

        {/* Fixed Packs */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {packs.filter((p) => p.id !== "custom").map((pack, i) => {
            const Icon = packIcons[i] || Package;
            const color = packColors[i] || packColors[0];
            return (
              <motion.div key={pack.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card glass-card-hover rounded-2xl p-8 flex flex-col transition-all"
                data-testid={`pack-${pack.id}`}>
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${color.text}`} />
                  </div>
                  {pack.highlighted && (
                    <Badge className="bg-teal/10 text-teal border-teal/20 text-[10px] font-semibold gap-1">
                      <Star className="h-2.5 w-2.5" /> {t("offers_popular")}
                    </Badge>
                  )}
                </div>

                <h3 className="font-heading font-bold text-xl mb-1">{t(pack.name_key)}</h3>
                <p className="text-text-secondary text-sm mb-6">{t(pack.name_key + "_desc")}</p>

                <div className="mt-auto flex items-end justify-between">
                  <div>
                    <span className={`font-heading font-extrabold text-3xl ${color.text}`}>{pack.price}€</span>
                    <span className="text-text-muted text-xs ml-1.5">/ {pack.quantity} {lang === "fr" ? "lien" + (pack.quantity > 1 ? "s" : "") : "link" + (pack.quantity > 1 ? "s" : "")}</span>
                  </div>
                  <Button onClick={() => navigate(`/checkout/${pack.id}`)}
                    className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold gap-1.5 group"
                    data-testid={`pack-${pack.id}-cta`}>
                    {t("offers_buy")} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Custom Pack */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto glass-card rounded-3xl p-8 md:p-10" data-testid="custom-pack">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-teal/5 border border-teal/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-teal" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl">{t("offers_custom")}</h3>
              <p className="text-text-secondary text-xs">{t("offers_custom_sub")}</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary text-sm">{t("offers_quantity")}</span>
              <span className="font-heading font-bold text-2xl text-teal">{customQty}</span>
            </div>
            <Slider value={[customQty]} min={1} max={1000} step={1}
              onValueChange={([v]) => setCustomQty(v)}
              className="[&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-teal [&_.bg-primary]:to-teal-light"
              data-testid="custom-qty-slider" />
            <div className="flex justify-between text-[10px] text-text-muted mt-2">
              <span>1</span><span>1000</span>
            </div>
          </div>

          {pricing && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">{t("offers_unit_price")}</p>
                <p className="font-heading font-bold text-lg text-teal">{pricing.unit_price}€</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">{t("offers_total")}</p>
                <p className="font-heading font-bold text-lg text-white">{pricing.total_price}€</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">{t("offers_savings")}</p>
                <p className="font-heading font-bold text-lg text-emerald">
                  {pricing.savings > 0 ? `-${pricing.savings}€` : "—"}
                </p>
              </div>
            </div>
          )}

          <Button onClick={() => navigate(`/checkout/custom?qty=${customQty}`)}
            className="w-full btn-teal rounded-xl py-5 text-sm font-bold gap-2 group"
            data-testid="custom-pack-cta">
            <Music2 className="h-4 w-4" /> {t("offers_buy")}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </motion.div>

        {/* Pricing Tiers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mt-12">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-text-muted" />
            <h4 className="text-text-secondary text-sm font-medium">{t("offers_pricing_grid")}</h4>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {tiers.map((tier, i) => (
              <div key={i} className="glass-card rounded-xl p-3 text-center">
                <p className="text-text-muted text-[10px] mb-1">{tier.range}</p>
                <p className="font-heading font-bold text-sm text-white">{tier.price}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

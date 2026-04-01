import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Equalizer } from "@/components/Equalizer";
import { Disc, Users, SlidersHorizontal, Minus, Plus, Play, ShieldCheck, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Offers() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [customQty, setCustomQty] = useState(10);
  const [customPricing, setCustomPricing] = useState(null);
  const lang = i18n.language || "en";

  useEffect(() => {
    axios.get(`${API}/packs`).then((r) => setPacks(r.data.packs)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      axios.get(`${API}/pricing/calculate?quantity=${customQty}`).then((r) => setCustomPricing(r.data)).catch(() => {});
    }, 80);
    return () => clearTimeout(timer);
  }, [customQty]);

  const iconMap = { disc: Disc, users: Users };

  return (
    <div className="min-h-screen py-24" data-testid="offers-page">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Equalizer count={7} color="#FF0092" height={28} />
          <h1 className="text-4xl sm:text-5xl tracking-tighter font-black font-heading mt-6 mb-4" data-testid="offers-title">
            {t("offers_title")}
          </h1>
          <p className="text-text-secondary font-light text-base md:text-lg max-w-xl mx-auto">{t("offers_subtitle")}</p>
          {/* Guarantee badge */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 mt-6 bg-lime/10 border border-lime/20 rounded-full px-5 py-2"
            data-testid="guarantee-badge">
            <ShieldCheck className="h-4 w-4 text-lime" />
            <span className="text-lime text-sm font-semibold">{t("pack_guarantee")}</span>
          </motion.div>
        </motion.div>

        {/* 2 FIXED PACKS */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {packs.map((pack, i) => {
            const Icon = iconMap[pack.icon] || Disc;
            const isHl = pack.highlighted;
            return (
              <motion.div key={pack.id}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 group
                  ${isHl
                    ? "bg-gradient-to-b from-[#1a0a28] to-[#2A0018] border-rose/50 shadow-[0_0_40px_rgba(255,0,146,0.12)]"
                    : "bg-surface border-white/8 hover:border-white/20"}`}
                data-testid={`pack-card-${pack.id}`}
              >
                {isHl && (
                  <div className="absolute -top-3 inset-x-0 flex justify-center">
                    <Badge className="bg-rose text-white border-0 text-[10px] tracking-widest px-4 py-1 shadow-lg shadow-rose/30">
                      {t("pack_popular")}
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between mb-6 mt-1">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isHl ? "bg-rose/15" : "bg-white/5"} transition-colors group-hover:scale-105 duration-300`}>
                      <Icon className={`h-7 w-7 ${isHl ? "text-rose" : "text-text-secondary"}`} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-xl">{t(pack.name_key)}</h3>
                      <p className="text-text-muted text-sm">{t(`pack_desc_${pack.id}`)}</p>
                    </div>
                  </div>
                  {isHl && <Equalizer count={4} color="#FF0092" height={20} />}
                </div>

                {/* Guarantee line */}
                <div className="flex items-center gap-1.5 mb-5">
                  <ShieldCheck className={`h-3.5 w-3.5 ${isHl ? "text-rose/70" : "text-lime/70"}`} />
                  <span className="text-text-muted text-xs">{t("pack_guarantee")}</span>
                </div>

                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-heading font-black text-white">{pack.price.toFixed(0)}</span>
                      <span className="text-2xl font-heading text-text-muted">&euro;</span>
                    </div>
                    <p className="text-text-muted text-sm font-mono mt-1">
                      {pack.quantity} {t("pack_links")} &bull; {pack.unit_price.toFixed(2)}&euro; {t("pack_per_unit")}
                    </p>
                    {pack.discount > 0 && (
                      <Badge className="mt-2 bg-lime/10 text-lime border-lime/20 text-xs">
                        -{pack.discount}% &bull; {t("pack_save")} {((5 - pack.unit_price) * pack.quantity).toFixed(0)}&euro;
                      </Badge>
                    )}
                  </div>
                  <Button onClick={() => navigate(`/checkout/${pack.id}`)}
                    className={`rounded-xl font-bold px-8 py-5 transition-all duration-200 ${isHl
                      ? "btn-lime hover:shadow-[0_0_20px_rgba(194,255,0,0.25)]"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20"}`}
                    data-testid={`buy-pack-${pack.id}`}
                  >
                    <Play className="h-4 w-4 fill-current me-2" /> {t("pack_buy")}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CUSTOM PACK */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          data-testid="custom-pack-section"
        >
          <div className="bg-surface border border-lime/20 rounded-2xl p-8 relative overflow-hidden hover:border-lime/35 transition-colors duration-300">
            <div className="absolute top-0 end-0 w-72 h-72 bg-gradient-to-bl from-lime/5 to-transparent rounded-bl-full pointer-events-none" />
            <div className="absolute bottom-0 start-0 w-40 h-40 bg-gradient-to-tr from-rose/3 to-transparent rounded-tr-full pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-lime/10">
                    <SlidersHorizontal className="h-7 w-7 text-lime" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-xl flex items-center gap-2">
                      {t("offers_custom")}
                      <Sparkles className="h-4 w-4 text-lime/60" />
                    </h3>
                    <p className="text-text-muted text-sm">{t("offers_custom_desc")} &bull; 1 - 1000 {t("pack_links")}</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-lime/70" />
                  <span className="text-text-muted text-xs">{t("pack_guarantee")}</span>
                </div>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCustomQty(Math.max(1, customQty - (customQty > 100 ? 10 : customQty > 10 ? 5 : 1)))}
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                  data-testid="custom-qty-minus"><Minus className="h-5 w-5" /></button>

                <div className="flex-1">
                  <input type="range" min={1} max={1000} value={customQty}
                    onChange={(e) => setCustomQty(Number(e.target.value))}
                    className="w-full h-2.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lime [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(194,255,0,0.5)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:hover:shadow-[0_0_25px_rgba(194,255,0,0.7)]"
                    data-testid="custom-qty-slider" />
                  {/* Tier markers */}
                  <div className="flex justify-between text-[10px] text-text-muted font-mono mt-2 px-1">
                    {[1, 3, 5, 10, 25, 50, 100, 250, 500, 1000].map((n) => (
                      <button key={n} onClick={() => setCustomQty(n)}
                        className={`hover:text-lime transition-colors ${customQty === n ? "text-lime font-bold" : ""}`}
                        data-testid={`tier-${n}`}>{n}</button>
                    ))}
                  </div>
                </div>

                <button onClick={() => setCustomQty(Math.min(1000, customQty + (customQty >= 100 ? 10 : customQty >= 10 ? 5 : 1)))}
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                  data-testid="custom-qty-plus"><Plus className="h-5 w-5" /></button>

                <div className="w-24 h-14 rounded-xl bg-void border border-lime/30 flex items-center justify-center">
                  <span className="text-lime font-heading font-black text-2xl" data-testid="custom-qty-display">{customQty}</span>
                </div>
              </div>

              {/* Pricing result */}
              {customPricing && (
                <motion.div
                  key={customPricing.total}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  className="bg-void/50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/5"
                >
                  <div className="flex items-center gap-8 flex-wrap">
                    <div>
                      <span className="text-text-muted text-xs block mb-1">{t("checkout_total")}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-heading font-black text-white" data-testid="custom-total">
                          {customPricing.total.toFixed(customPricing.total % 1 === 0 ? 0 : 2)}
                        </span>
                        <span className="text-2xl text-text-muted">&euro;</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-text-secondary text-sm font-mono">
                        {customPricing.unit_price.toFixed(2)}&euro; {t("pack_per_unit")}
                      </p>
                      {customPricing.discount > 0 && (
                        <Badge className="bg-lime/10 text-lime border-lime/20 text-xs" data-testid="custom-discount">
                          -{customPricing.discount}% &bull; {t("pack_save")} {customPricing.savings}&euro;
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button onClick={() => navigate(`/checkout/custom?qty=${customQty}`)}
                    className="btn-lime rounded-xl px-10 py-6 font-bold text-base whitespace-nowrap hover:shadow-[0_0_20px_rgba(194,255,0,0.25)] transition-shadow"
                    data-testid="buy-custom-pack">
                    <Play className="h-5 w-5 fill-current me-2" /> {t("pack_buy")}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

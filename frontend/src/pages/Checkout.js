import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Equalizer } from "@/components/Equalizer";
import { ArrowLeft, Loader2, Lock, Music, Zap, SlidersHorizontal } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const { packId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pack, setPack] = useState(null);
  const [customPricing, setCustomPricing] = useState(null);
  const [email, setEmail] = useState(() => localStorage.getItem("deezlink_email") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lang = i18n.language || "en";

  const isCustom = packId === "custom";
  const customQty = isCustom ? parseInt(searchParams.get("qty") || "1", 10) : 0;

  useEffect(() => {
    if (isCustom) {
      axios.get(`${API}/pricing/calculate?quantity=${customQty}`).then((r) => {
        setCustomPricing(r.data);
        setPack({
          name_key: "custom",
          quantity: r.data.quantity,
          price: r.data.total,
          unit_price: r.data.unit_price,
          discount: r.data.discount,
          savings: r.data.savings,
        });
      }).catch(() => navigate("/"));
    } else {
      axios.get(`${API}/packs`).then((r) => {
        const found = r.data.packs.find((p) => p.id === packId);
        if (found) setPack(found);
        else navigate("/");
      }).catch(() => navigate("/"));
    }
  }, [packId, isCustom, customQty, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(lang === "fr" ? "Email requis" : "Email required"); return; }
    setLoading(true);
    setError("");
    try {
      let data;
      if (isCustom) {
        const resp = await axios.post(`${API}/orders/create-custom`, { quantity: customQty, email: email.trim() });
        data = resp.data;
      } else {
        const resp = await axios.post(`${API}/orders/create`, { pack_id: packId, email: email.trim() });
        data = resp.data;
      }
      // Store email in localStorage for "My Orders" visibility
      localStorage.setItem("deezlink_email", email.trim().toLowerCase());
      window.dispatchEvent(new Event("deezlink_email_update"));

      if (data.payment_url && !data.payment_url.startsWith("/")) {
        window.location.href = data.payment_url;
      } else {
        navigate(`/order/${data.order_id}?mock=true`);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Something went wrong");
    } finally { setLoading(false); }
  };

  if (!pack) return null;

  const displayPrice = isCustom ? customPricing?.total : pack.price;
  const displayQty = isCustom ? customQty : pack.quantity;
  const displayUnitPrice = isCustom ? customPricing?.unit_price : pack.unit_price;
  const displayDiscount = isCustom ? customPricing?.discount : pack.discount;
  const displaySavings = isCustom
    ? customPricing?.savings?.toFixed(2)
    : ((5 - pack.unit_price) * pack.quantity).toFixed(2);
  const packLabel = isCustom
    ? (lang === "fr" ? "Pack Personnalise" : lang === "ar" ? "\u0628\u0627\u0642\u0629 \u0645\u062e\u0635\u0635\u0629" : "Custom Pack")
    : t(pack.name_key);

  return (
    <div className="min-h-screen flex items-center justify-center py-24 relative" data-testid="checkout-page">
      <div className="absolute inset-0 bg-gradient-to-b from-rose/5 via-void to-void" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md mx-6">
        <button onClick={() => navigate("/offers")} className="flex items-center gap-2 text-text-secondary hover:text-white text-sm mb-6 transition-colors" data-testid="checkout-back-btn">
          <ArrowLeft className="h-4 w-4" /> {t("checkout_back")}
        </button>

        <div className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header bar */}
          <div className="bg-gradient-to-r from-rose/20 to-purple/20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                {isCustom ? <SlidersHorizontal className="h-5 w-5 text-lime" /> : <Music className="h-5 w-5 text-white" />}
              </div>
              <div>
                <h2 className="font-heading font-bold text-sm text-white">{packLabel}</h2>
                <p className="text-text-secondary text-xs">{displayQty} {t("pack_links")} &bull; Deezer Premium</p>
              </div>
            </div>
            <Equalizer count={4} color="#FF0092" height={16} />
          </div>

          <div className="p-6 space-y-5">
            {/* Price display */}
            <div className="bg-white/3 rounded-xl p-5 space-y-3" data-testid="checkout-summary">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">{t("checkout_total")}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lime font-heading font-black text-3xl">{displayPrice?.toFixed(0)}</span>
                  <span className="text-text-muted text-lg">&euro;</span>
                </div>
              </div>
              {displayDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-xs">{displayUnitPrice?.toFixed(2)}&euro; {t("pack_per_unit")}</span>
                  <Badge className="bg-lime/10 text-lime border-lime/20 text-[10px]">
                    -{displayDiscount}% &bull; {t("pack_save")} {displaySavings}&euro;
                  </Badge>
                </div>
              )}
            </div>

            {/* Crypto badges */}
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-crypto" />
              <div className="flex gap-1.5">
                {["BTC", "ETH", "USDT", "LTC"].map((c) => (
                  <span key={c} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] text-text-muted font-mono">{c}</span>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary mb-2 block">{t("checkout_email")}</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("checkout_email_placeholder")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-text-muted focus:ring-lime/50 focus:border-lime/50 h-12"
                  data-testid="checkout-email-input" required
                />
                <p className="text-text-muted text-[10px] mt-1.5">
                  {lang === "fr" ? "Vos liens seront associes a cet email" : lang === "ar" ? "\u0633\u064a\u062a\u0645 \u0631\u0628\u0637 \u0631\u0648\u0627\u0628\u0637\u0643 \u0628\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064a\u062f" : "Your links will be tied to this email"}
                </p>
              </div>

              {error && <p className="text-red-400 text-sm" data-testid="checkout-error">{error}</p>}

              <Button type="submit" disabled={loading}
                className="w-full btn-lime rounded-xl py-6 text-base font-bold flex items-center justify-center gap-2"
                data-testid="checkout-pay-btn"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {t("checkout_processing")}</>
                ) : (
                  <><Lock className="h-4 w-4" /> {t("checkout_pay")}</>
                )}
              </Button>
            </form>

            <p className="text-text-muted text-[10px] text-center flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              {lang === "fr" ? "Paiement securise via OxaPay" : lang === "ar" ? "\u062f\u0641\u0639 \u0622\u0645\u0646 \u0639\u0628\u0631 OxaPay" : "Secure payment via OxaPay"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

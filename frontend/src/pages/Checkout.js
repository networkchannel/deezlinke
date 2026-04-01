import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Shield } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const { packId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = i18n.language || "fr";
  const [pack, setPack] = useState(null);
  const [customPricing, setCustomPricing] = useState(null);
  const [email, setEmail] = useState(() => localStorage.getItem("deezlink_email") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCustom = packId === "custom";
  const customQty = isCustom ? parseInt(searchParams.get("qty") || "1", 10) : 0;

  useEffect(() => {
    if (isCustom) {
      axios.get(`${API}/pricing/calculate?quantity=${customQty}`).then((r) => {
        setCustomPricing(r.data);
        setPack({ name_key: "custom", quantity: r.data.quantity, price: r.data.total, unit_price: r.data.unit_price });
      }).catch(() => navigate("/"));
    } else {
      axios.get(`${API}/packs`).then((r) => {
        const all = r.data.packs || r.data;
        const found = Array.isArray(all) ? all.find((p) => p.id === packId) : null;
        if (found) setPack(found); else navigate("/");
      }).catch(() => navigate("/"));
    }
  }, [packId, isCustom, customQty, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(lang === "fr" ? "Email requis" : "Email required"); return; }
    setLoading(true); setError("");
    try {
      let data;
      if (isCustom) {
        const resp = await axios.post(`${API}/orders/create-custom`, { quantity: customQty, email: email.trim() });
        data = resp.data;
      } else {
        const resp = await axios.post(`${API}/orders/create`, { pack_id: packId, email: email.trim() });
        data = resp.data;
      }
      localStorage.setItem("deezlink_email", email.trim().toLowerCase());
      window.dispatchEvent(new Event("deezlink_email_update"));
      if (data.payment_url && !data.payment_url.startsWith("/")) {
        window.location.href = data.payment_url;
      } else {
        navigate(`/order/${data.order_id}?mock=true`);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Error");
    } finally { setLoading(false); }
  };

  if (!pack) return null;

  const displayPrice = isCustom ? customPricing?.total : pack.price;
  const displayQty = isCustom ? customQty : pack.quantity;
  const packLabel = isCustom
    ? (lang === "fr" ? "Sur mesure" : "Custom")
    : t(pack.name_key || "pack_single");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="orb-purple" style={{ top: "-20%", right: "-15%" }} />
      <div className="orb-pink" style={{ bottom: "20%", left: "-10%" }} />
      
      <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <button onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-t-muted hover:text-t-primary text-sm mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t("checkout_back")}
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div className="glass backdrop-blur-xl rounded-2xl overflow-hidden">
            {/* Summary */}
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-t-primary font-semibold text-base mb-1">{packLabel}</p>
                  <p className="text-t-muted text-xs">{displayQty} {lang === "fr" ? "liens" : "links"} · Deezer Premium</p>
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary font-bold text-3xl tabular-nums">{displayPrice?.toFixed(0)}€</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-sm text-t-secondary block mb-2.5 font-medium">{t("checkout_email")}</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("checkout_email_placeholder")}
                  className="bg-bg/50 border-border text-t-primary placeholder:text-t-muted h-12 rounded-xl text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 backdrop-blur-sm"
                  required autoFocus />
                <p className="text-t-muted text-xs mt-2">
                  {lang === "fr" ? "Vos liens seront envoyés à cet email" : "Your links will be sent to this email"}
                </p>
              </div>

              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>}

              <div className="flex items-center gap-4 text-xs text-t-muted pt-2 font-mono">
                <span className="text-t-secondary">BTC</span>
                <span className="text-t-secondary">ETH</span>
                <span className="text-t-secondary">USDT</span>
                <span className="text-t-secondary">LTC</span>
              </div>

              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-4 rounded-xl transition-all shadow-lg shadow-accent-glow flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {loading
                  ? (lang === "fr" ? "Redirection..." : "Redirecting...")
                  : (lang === "fr" ? "Payer en crypto" : "Pay with crypto")}
              </motion.button>

              <p className="text-t-muted text-xs text-center flex items-center justify-center gap-2 pt-1">
                <Shield className="h-4 w-4 text-accent" />
                {lang === "fr" ? "Paiement sécurisé via OxaPay" : "Secure payment via OxaPay"}
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

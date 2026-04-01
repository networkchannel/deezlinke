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
    <div className="max-w-md mx-auto px-5 py-16">
      <button onClick={() => navigate("/")}
        className="inline-flex items-center gap-1.5 text-t-muted hover:text-t-secondary text-[13px] mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> {t("checkout_back")}
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {/* Summary */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-t-primary font-medium text-[15px]">{packLabel}</p>
                <p className="text-t-muted text-[12px]">{displayQty} {lang === "fr" ? "liens" : "links"} · Deezer Premium</p>
              </div>
              <span className="text-t-primary font-semibold text-[26px] tabular-nums">{displayPrice?.toFixed(0)}€</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="text-[13px] text-t-secondary block mb-2">{t("checkout_email")}</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t("checkout_email_placeholder")}
                className="bg-bg border-border text-t-primary placeholder:text-t-muted h-11 rounded-lg text-[14px] focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                required autoFocus />
              <p className="text-t-muted text-[11px] mt-1.5">
                {lang === "fr" ? "Vos liens seront envoyés à cet email" : "Your links will be sent to this email"}
              </p>
            </div>

            {error && <p className="text-red-500 text-[13px]">{error}</p>}

            <div className="flex items-center gap-3 text-[11px] text-t-muted pt-1 font-mono">
              <span>BTC</span><span>ETH</span><span>USDT</span><span>LTC</span>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-[14px] font-medium py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading
                ? (lang === "fr" ? "Redirection..." : "Redirecting...")
                : (lang === "fr" ? "Payer en crypto" : "Pay with crypto")}
            </motion.button>

            <p className="text-t-muted text-[11px] text-center flex items-center justify-center gap-1.5">
              <Shield className="h-3 w-3" />
              {lang === "fr" ? "Paiement sécurisé via OxaPay" : "Secure payment via OxaPay"}
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

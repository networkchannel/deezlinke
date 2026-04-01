import { useTranslation } from "react-i18next";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Equalizer } from "@/components/Equalizer";
import { Check, Copy, Loader2, AlertTriangle, ExternalLink, Music, PartyPopper, Clock } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OrderConfirmation() {
  const { t, i18n } = useTranslation();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get("mock") === "true";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const lang = i18n.language || "en";

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/orders/${orderId}`);
      setOrder(data);
    } catch { setOrder(null); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  useEffect(() => {
    if (!order || order.status === "completed" || order.status === "failed") return;
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  const handleMockConfirm = async () => {
    setConfirming(true);
    try { await axios.post(`${API}/orders/${orderId}/confirm-mock`); await fetchOrder(); } catch {}
    setConfirming(false);
  };

  const copyLink = (link, idx) => {
    navigator.clipboard.writeText(link);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 2000);
  };

  const statusConfig = {
    completed: { color: "bg-emerald/10 text-emerald border-emerald/20", label: t("order_completed"), icon: Check },
    pending: { color: "bg-turbo/10 text-turbo border-turbo/20", label: t("order_pending"), icon: Clock },
    payment_mock: { color: "bg-accent/10 text-accent-light border-accent/20", label: t("order_mock_title"), icon: AlertTriangle },
    partial: { color: "bg-crypto/10 text-crypto border-crypto/20", label: "Partial", icon: Clock },
    failed: { color: "bg-rose/10 text-rose border-rose/20", label: t("order_failed"), icon: AlertTriangle },
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Equalizer count={7} color="#818CF8" height={40} />
        <p className="text-text-secondary text-sm animate-pulse">
          {lang === "fr" ? "Chargement..." : lang === "ar" ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644..." : "Loading..."}
        </p>
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-text-secondary">Order not found</p>
    </div>
  );

  const sc = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="min-h-screen py-24 relative" data-testid="order-page">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Status header */}
          {order.status === "completed" && (
            <div className="text-center py-6" data-testid="order-success-header">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                <div className="w-16 h-16 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center mx-auto mb-4">
                  <PartyPopper className="h-8 w-8 text-emerald" />
                </div>
              </motion.div>
              <h1 className="font-heading font-bold text-2xl" data-testid="order-title">
                {lang === "fr" ? "Commande terminee !" : lang === "ar" ? "\u0627\u0643\u062a\u0645\u0644 \u0627\u0644\u0637\u0644\u0628!" : "Order Complete!"}
              </h1>
            </div>
          )}

          {order.status !== "completed" && (
            <div>
              <h1 className="font-heading font-bold text-2xl mb-2" data-testid="order-title">{t("order_title")}</h1>
            </div>
          )}

          {/* Order info card */}
          <div className="glass-card rounded-2xl overflow-hidden" data-testid="order-details">
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
              <div>
                <p className="text-text-muted text-xs">{t("order_id")}</p>
                <p className="font-mono font-bold text-white">{orderId}</p>
              </div>
              <Badge className={sc.color} data-testid="order-status-badge">
                <sc.icon className="h-3 w-3 me-1" /> {sc.label}
              </Badge>
            </div>
            <div className="px-6 py-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-muted text-xs">{t("checkout_pack")}</p>
                <p className="text-white font-medium text-sm">{order.quantity} {t("pack_links")}</p>
              </div>
              <div className="text-end">
                <p className="text-text-muted text-xs">{t("checkout_total")}</p>
                <p className="text-primary-light font-heading font-bold text-xl">{order.price}&euro;</p>
              </div>
            </div>
          </div>

          {/* Mock mode */}
          {(order.status === "payment_mock" || (isMock && order.status === "pending")) && (
            <div className="glass-card rounded-2xl p-6 border-accent/20" data-testid="mock-banner">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-accent-light flex-shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-accent-light">{t("order_mock_title")}</h3>
                    <p className="text-text-secondary text-sm mt-1">{t("order_mock_desc")}</p>
                  </div>
                  <Button onClick={handleMockConfirm} disabled={confirming}
                    className="bg-accent hover:bg-accent-dark text-white rounded-xl text-sm" data-testid="mock-confirm-btn">
                    {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : t("order_mock_btn")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Links delivery */}
          {order.links && order.links.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl overflow-hidden border-emerald/20" data-testid="order-links">
              <div className="px-6 py-4 border-b border-border-subtle flex items-center gap-3">
                <Music className="h-4 w-4 text-emerald" />
                <h3 className="font-heading font-bold text-sm text-emerald">{t("order_links_title")}</h3>
                <Equalizer count={4} color="#10B981" height={12} />
              </div>
              <div className="p-4 space-y-2">
                {order.links.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/[0.02] rounded-xl px-4 py-3 group hover:bg-white/5 transition-colors"
                    data-testid={`order-link-${idx}`}>
                    <div className="w-6 h-6 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald text-xs font-bold">{idx + 1}</span>
                    </div>
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-mono text-text-secondary hover:text-white truncate flex-1 flex items-center gap-1">
                      {link} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                    <button onClick={() => copyLink(link, idx)}
                      className="text-text-muted hover:text-primary-light transition-colors flex-shrink-0" data-testid={`copy-link-${idx}`}>
                      {copiedIdx === idx ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            order.status !== "completed" && (
              <p className="text-text-secondary text-sm text-center py-8" data-testid="no-links-msg">
                {t("order_no_links")}
              </p>
            )
          )}

          <div className="flex justify-center gap-4 pt-4">
            <Link to="/" className="text-text-secondary hover:text-white text-sm transition-colors" data-testid="back-home-link">
              &larr; {t("nav_home")}
            </Link>
            <Link to="/history" className="text-primary-light hover:text-primary text-sm transition-colors" data-testid="go-history-link">
              {t("nav_history")} &rarr;
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

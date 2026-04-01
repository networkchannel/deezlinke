import { useTranslation } from "react-i18next";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Check, Copy, Loader2, ExternalLink } from "lucide-react";

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
  const lang = i18n.language || "fr";

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

  if (loading) return <div className="max-w-md mx-auto px-5 py-24 text-center"><Loader2 className="h-5 w-5 animate-spin text-t-muted mx-auto" /></div>;
  if (!order) return <div className="max-w-md mx-auto px-5 py-24 text-center text-t-muted text-[14px]">Order not found</div>;

  const STATUS = {
    completed: { label: lang === "fr" ? "Terminée" : "Completed", color: "text-green bg-green-dim" },
    pending: { label: lang === "fr" ? "En attente" : "Pending", color: "text-yellow-500 bg-yellow-500/10" },
    payment_mock: { label: "Test", color: "text-accent bg-accent-dim" },
    failed: { label: lang === "fr" ? "Échouée" : "Failed", color: "text-red-500 bg-red-500/10" },
  };
  const sc = STATUS[order.status] || STATUS.pending;

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      {/* Header */}
      <div className="mb-6">
        {order.status === "completed" && <p className="text-green text-[14px] font-medium mb-1">{lang === "fr" ? "Commande terminée" : "Order complete"}</p>}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-t-muted text-[12px]">#{orderId}</p>
          </div>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${sc.color}`}>{sc.label}</span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-surface border border-border rounded-lg p-5 mb-4">
        <div className="flex justify-between text-[14px]">
          <span className="text-t-secondary">{order.quantity} {lang === "fr" ? "liens" : "links"}</span>
          <span className="text-t-primary font-semibold tabular-nums">{order.price}€</span>
        </div>
      </div>

      {/* Mock confirm */}
      {(order.status === "payment_mock" || (isMock && order.status === "pending")) && (
        <div className="bg-surface border border-accent/20 rounded-lg p-5 mb-4">
          <p className="text-accent text-[13px] font-medium mb-2">{t("order_mock_title")}</p>
          <p className="text-t-secondary text-[13px] mb-3">{t("order_mock_desc")}</p>
          <button onClick={handleMockConfirm} disabled={confirming}
            className="bg-accent hover:bg-accent-hover text-white text-[13px] font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2">
            {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} {t("order_mock_btn")}
          </button>
        </div>
      )}

      {/* Links */}
      {order.links && order.links.length > 0 && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-border">
            <span className="text-green text-[13px] font-medium">
              {lang === "fr" ? "Vos liens" : "Your links"}
            </span>
          </div>
          <div className="divide-y divide-border">
            {order.links.map((link, idx) => (
              <div key={idx} className="flex items-center gap-3 px-5 py-3">
                <span className="text-t-muted text-[12px] font-mono w-5 shrink-0">{idx + 1}</span>
                <a href={link} target="_blank" rel="noopener noreferrer"
                  className="text-[12px] font-mono text-t-secondary hover:text-t-primary truncate flex-1 flex items-center gap-1">
                  {link} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <button onClick={() => copyLink(link, idx)} className="text-t-muted hover:text-t-primary transition-colors shrink-0">
                  {copiedIdx === idx ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.status !== "completed" && (!order.links || order.links.length === 0) && (
        <p className="text-t-muted text-[13px] text-center py-6">{t("order_no_links")}</p>
      )}

      <div className="flex justify-center gap-6 pt-4 text-[13px]">
        <Link to="/" className="text-t-muted hover:text-t-secondary transition-colors">{t("nav_home")}</Link>
        <Link to="/history" className="text-t-muted hover:text-t-secondary transition-colors">{t("nav_history")}</Link>
      </div>
    </div>
  );
}

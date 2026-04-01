import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ExternalLink, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OrderHistory() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "fr";
  const [email, setEmail] = useState(() => localStorage.getItem("deezlink_email") || "");
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (e) => {
    if (!e?.trim()) return;
    setLoading(true);
    try { const { data } = await axios.get(`${API}/orders/history/${encodeURIComponent(e.trim())}`); setOrders(data.orders || []); } catch { setOrders([]); }
    setSearched(true); setLoading(false);
  }, []);

  useEffect(() => { const s = localStorage.getItem("deezlink_email"); if (s) doSearch(s); }, [doSearch]);

  const STATUS_COLOR = {
    completed: "text-green bg-green-dim",
    pending: "text-yellow-500 bg-yellow-500/10",
    payment_mock: "text-accent bg-accent-dim",
    failed: "text-red-500 bg-red-500/10",
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-16">
      <h1 className="text-t-primary font-semibold text-[20px] mb-6">{t("history_title")}</h1>

      <form onSubmit={(e) => { e.preventDefault(); doSearch(email); }} className="flex gap-3 mb-8">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t("history_email_placeholder")}
          className="bg-surface border-border text-t-primary placeholder:text-t-muted rounded-md text-[14px]" />
        <button type="submit" disabled={loading}
          className="bg-accent hover:bg-accent-hover text-white text-[13px] font-medium px-5 rounded-md transition-colors flex items-center gap-2 shrink-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
        </button>
      </form>

      {searched && orders.length === 0 && (
        <p className="text-t-muted text-[14px] text-center py-12">{t("history_no_orders")}</p>
      )}

      {orders.length > 0 && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-t-muted text-[12px] font-normal">{lang === "fr" ? "Commande" : "Order"}</TableHead>
                <TableHead className="text-t-muted text-[12px] font-normal">{lang === "fr" ? "Date" : "Date"}</TableHead>
                <TableHead className="text-t-muted text-[12px] font-normal text-right">{lang === "fr" ? "Montant" : "Amount"}</TableHead>
                <TableHead className="text-t-muted text-[12px] font-normal">{lang === "fr" ? "Statut" : "Status"}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.order_id} className="border-border hover:bg-surface-2">
                  <TableCell className="font-mono text-[12px] text-t-secondary">{o.order_id}</TableCell>
                  <TableCell className="text-[12px] text-t-muted">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-[13px] text-t-primary font-medium tabular-nums text-right">{o.price}€</TableCell>
                  <TableCell>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${STATUS_COLOR[o.status] || STATUS_COLOR.pending}`}>{o.status}</span>
                  </TableCell>
                  <TableCell>
                    <Link to={`/order/${o.order_id}`} className="text-t-muted hover:text-t-secondary text-[12px] flex items-center gap-1">
                      {lang === "fr" ? "Voir" : "View"} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

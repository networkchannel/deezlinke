import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ExternalLink, ShoppingBag } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OrderHistory() {
  const { t } = useTranslation();
  const [email, setEmail] = useState(() => localStorage.getItem("deezlink_email") || "");
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (emailToSearch) => {
    if (!emailToSearch?.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/orders/history/${encodeURIComponent(emailToSearch.trim())}`);
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    }
    setSearched(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("deezlink_email");
    if (stored) doSearch(stored);
  }, [doSearch]);

  const handleSearch = async (e) => {
    e.preventDefault();
    doSearch(email);
  };

  const statusColor = {
    completed: "bg-emerald/10 text-emerald border-emerald/20",
    pending: "bg-turbo/10 text-turbo border-turbo/20",
    payment_mock: "bg-accent/10 text-accent-light border-accent/20",
    failed: "bg-rose/10 text-rose border-rose/20",
  };

  return (
    <div className="min-h-screen py-24 relative" data-testid="history-page">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <ShoppingBag className="h-6 w-6 text-primary-light" />
            <h1 className="font-heading font-bold text-3xl gradient-text" data-testid="history-title">
              {t("history_title")}
            </h1>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3 mb-8" data-testid="history-search-form">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={t("history_email_placeholder")}
              className="bg-white/5 border-white/10 text-white placeholder:text-text-muted focus:ring-primary/50 focus:border-primary/50 rounded-xl"
              data-testid="history-email-input"
            />
            <Button type="submit" disabled={loading} className="btn-primary rounded-xl px-6" data-testid="history-search-btn">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline ms-2">{t("history_search")}</span>
            </Button>
          </form>

          {searched && orders.length === 0 && (
            <p className="text-text-secondary text-center py-12" data-testid="history-empty">
              {t("history_no_orders")}
            </p>
          )}

          {orders.length > 0 && (
            <div className="glass-card rounded-2xl overflow-hidden" data-testid="history-table">
              <Table>
                <TableHeader>
                  <TableRow className="border-border-subtle hover:bg-transparent">
                    <TableHead className="text-text-muted">{t("history_order_id")}</TableHead>
                    <TableHead className="text-text-muted">{t("history_date")}</TableHead>
                    <TableHead className="text-text-muted">{t("history_amount")}</TableHead>
                    <TableHead className="text-text-muted">{t("history_status")}</TableHead>
                    <TableHead className="text-text-muted"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.order_id} className="border-border-subtle hover:bg-white/[0.03]">
                      <TableCell className="font-mono text-sm">{order.order_id}</TableCell>
                      <TableCell className="text-sm text-text-secondary">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-heading font-bold">{order.price}&euro;</TableCell>
                      <TableCell>
                        <Badge className={statusColor[order.status] || statusColor.pending}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link to={`/order/${order.order_id}`}
                          className="text-primary-light hover:underline text-sm flex items-center gap-1"
                          data-testid={`view-order-${order.order_id}`}>
                          {t("history_view")} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

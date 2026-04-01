import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Package, Link2, TrendingUp, Loader2, Trash2, Plus, Upload } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [links, setLinks] = useState([]);
  const [importText, setImportText] = useState("");
  const [singleLink, setSingleLink] = useState("");
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      navigate("/admin/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes, linksRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/orders`, { withCredentials: true }),
        axios.get(`${API}/admin/links?limit=50`, { withCredentials: true }),
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data.orders || []);
      setLinks(linksRes.data.links || []);
    } catch {}
  };

  const handleImport = async () => {
    const linksList = importText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (linksList.length === 0) return;
    setImporting(true);
    try {
      const { data } = await axios.post(`${API}/admin/links/import`, { links: linksList }, { withCredentials: true });
      setMsg(`Imported ${data.imported} links`);
      setImportText("");
      fetchData();
    } catch {}
    setImporting(false);
  };

  const handleAddSingle = async () => {
    if (!singleLink.trim()) return;
    setAdding(true);
    try {
      await axios.post(`${API}/admin/links/add`, { link: singleLink.trim() }, { withCredentials: true });
      setSingleLink("");
      setMsg("Link added");
      fetchData();
    } catch (err) {
      setMsg(err.response?.data?.detail || "Error");
    }
    setAdding(false);
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`${API}/admin/orders/${orderId}`, { withCredentials: true });
      fetchData();
    } catch {}
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple" />
      </div>
    );
  }

  const statusColor = {
    completed: "bg-lime/10 text-lime border-lime/20",
    pending: "bg-turbo/10 text-turbo border-turbo/20",
    payment_mock: "bg-purple/10 text-purple border-purple/20",
    failed: "bg-red-500/10 text-red-400 border-red-400/20",
  };

  return (
    <div className="min-h-screen py-24" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading font-bold text-3xl mb-8" data-testid="admin-title">
            {t("admin_title")}
          </h1>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" data-testid="admin-stats">
              {[
                { label: t("admin_revenue"), value: `${stats.total_revenue.toFixed(2)}\u20ac`, icon: DollarSign, color: "#C2FF00" },
                { label: t("admin_orders"), value: stats.total_orders, icon: Package, color: "#A238FF" },
                { label: t("admin_links_available"), value: stats.available_links, icon: Link2, color: "#FF0092" },
                { label: t("admin_links_sold"), value: stats.sold_links, icon: TrendingUp, color: "#F7931A" },
              ].map((stat, i) => (
                <div key={i} className="admin-widget" data-testid={`stat-${i}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                    <span className="text-text-muted text-xs">{stat.label}</span>
                  </div>
                  <span className="font-heading font-black text-2xl text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="orders" className="space-y-6" data-testid="admin-tabs">
            <TabsList className="bg-surface border border-border-subtle">
              <TabsTrigger value="orders" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-text-secondary" data-testid="tab-orders">
                {t("admin_recent_orders")}
              </TabsTrigger>
              <TabsTrigger value="links" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-text-secondary" data-testid="tab-links">
                {t("admin_manage_links")}
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden" data-testid="orders-table">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border-subtle hover:bg-transparent">
                      <TableHead className="text-text-muted">ID</TableHead>
                      <TableHead className="text-text-muted">Email</TableHead>
                      <TableHead className="text-text-muted">{t("history_amount")}</TableHead>
                      <TableHead className="text-text-muted">{t("history_status")}</TableHead>
                      <TableHead className="text-text-muted">{t("history_date")}</TableHead>
                      <TableHead className="text-text-muted"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.order_id} className="border-border-subtle hover:bg-white/3">
                        <TableCell className="font-mono text-xs">
                          <Link to={`/order/${order.order_id}`} className="text-lime hover:underline">
                            {order.order_id}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-text-secondary">{order.email}</TableCell>
                        <TableCell className="font-heading font-bold">{order.price}&euro;</TableCell>
                        <TableCell>
                          <Badge className={statusColor[order.status] || statusColor.pending}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-text-muted">
                          {new Date(order.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteOrder(order.order_id)}
                            className="text-text-muted hover:text-red-400"
                            data-testid={`delete-order-${order.order_id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-text-muted">
                          No orders yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Links Tab */}
            <TabsContent value="links">
              <div className="space-y-6">
                {/* Import */}
                <div className="admin-widget" data-testid="import-section">
                  <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-rose" />
                    {t("admin_import")}
                  </h3>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={t("admin_import_placeholder")}
                    className="w-full bg-white/5 border border-border-subtle rounded-lg p-3 text-sm text-white placeholder:text-text-muted focus:ring-rose focus:border-rose min-h-[100px] resize-y"
                    data-testid="import-textarea"
                  />
                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="mt-2 bg-rose hover:bg-rose/80 text-white rounded-lg"
                    data-testid="import-btn"
                  >
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin_import_btn")}
                  </Button>
                </div>

                {/* Add single */}
                <div className="admin-widget" data-testid="add-link-section">
                  <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-lime" />
                    {t("admin_add_link")}
                  </h3>
                  <div className="flex gap-3">
                    <Input
                      value={singleLink}
                      onChange={(e) => setSingleLink(e.target.value)}
                      placeholder={t("admin_add_placeholder")}
                      className="bg-white/5 border-border-subtle text-white placeholder:text-text-muted"
                      data-testid="add-link-input"
                    />
                    <Button
                      onClick={handleAddSingle}
                      disabled={adding}
                      className="btn-lime rounded-lg px-4"
                      data-testid="add-link-btn"
                    >
                      {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin_add_btn")}
                    </Button>
                  </div>
                </div>

                {msg && (
                  <p className="text-lime text-sm" data-testid="admin-msg">{msg}</p>
                )}

                {/* Links table */}
                <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden" data-testid="links-table">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border-subtle hover:bg-transparent">
                        <TableHead className="text-text-muted">URL</TableHead>
                        <TableHead className="text-text-muted">{t("history_status")}</TableHead>
                        <TableHead className="text-text-muted">{t("history_order_id")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links.map((link, i) => (
                        <TableRow key={i} className="border-border-subtle hover:bg-white/3">
                          <TableCell className="font-mono text-xs truncate max-w-[300px]">{link.url}</TableCell>
                          <TableCell>
                            <Badge className={link.status === "available" ? "bg-lime/10 text-lime border-lime/20" : "bg-text-muted/10 text-text-muted border-text-muted/20"}>
                              {link.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-text-muted">
                            {link.order_id || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {links.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-text-muted">
                            No links imported yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, Package, Link2, TrendingUp, Loader2, Trash2, Plus, Upload,
  Shield, Users, Globe, AlertTriangle, Ban, CheckCircle, BarChart3, 
  Clock, Eye, RefreshCw, MapPin, Activity
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [links, setLinks] = useState([]);
  const [users, setUsers] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [blockedList, setBlockedList] = useState({ blocked_ips: [], blocked_emails: [] });
  const [analytics, setAnalytics] = useState(null);
  const [usersByCountry, setUsersByCountry] = useState({});
  const [importText, setImportText] = useState("");
  const [singleLink, setSingleLink] = useState("");
  const [blockIpInput, setBlockIpInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      navigate("/admin/login");
    }
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setRefreshing(true);
    try {
      const [statsRes, ordersRes, linksRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/orders?limit=50`, { withCredentials: true }),
        axios.get(`${API}/admin/links?limit=50`, { withCredentials: true }),
        axios.get(`${API}/admin/users?limit=100`, { withCredentials: true }),
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data.orders || []);
      setLinks(linksRes.data.links || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
    setRefreshing(false);
  }, [user]);

  const fetchSecurityData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      const [logsRes, blockedRes] = await Promise.all([
        axios.get(`${API}/admin/security/logs?limit=50`, { withCredentials: true }),
        axios.get(`${API}/admin/security/blocked`, { withCredentials: true }),
      ]);
      setSecurityLogs(logsRes.data.logs || []);
      setBlockedList(blockedRes.data);
    } catch {}
  }, [user]);

  const fetchAnalytics = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      const [analyticsRes, countryRes] = await Promise.all([
        axios.get(`${API}/admin/analytics`, { withCredentials: true }),
        axios.get(`${API}/admin/users/by-country`, { withCredentials: true }),
      ]);
      setAnalytics(analyticsRes.data);
      setUsersByCountry(analyticsRes.data?.countries || countryRes.data.countries || {});
    } catch {}
  }, [user]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchData();
      fetchSecurityData();
      fetchAnalytics();
    }
  }, [user, fetchData, fetchSecurityData, fetchAnalytics]);

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

  const handleBlockIp = async () => {
    if (!blockIpInput.trim()) return;
    try {
      await axios.post(`${API}/admin/security/block-ip`, { ip: blockIpInput.trim(), duration: 3600 }, { withCredentials: true });
      setBlockIpInput("");
      setMsg(`IP ${blockIpInput} blocked for 1 hour`);
      fetchSecurityData();
    } catch {}
  };

  const handleUnblockIp = async (ip) => {
    try {
      await axios.post(`${API}/admin/security/unblock-ip`, { ip }, { withCredentials: true });
      setMsg(`IP ${ip} unblocked`);
      fetchSecurityData();
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

  const eventTypeColor = {
    failed_login: "bg-red-500/10 text-red-400",
    successful_login: "bg-lime/10 text-lime",
    magic_link_requested: "bg-purple/10 text-purple",
    magic_link_verified: "bg-lime/10 text-lime",
    magic_link_rate_limit_ip: "bg-red-500/10 text-red-400",
    magic_link_rate_limit_email: "bg-turbo/10 text-turbo",
    admin_block_ip: "bg-rose/10 text-rose",
    admin_unblock_ip: "bg-lime/10 text-lime",
  };

  const getCountryFlag = (code) => {
    if (!code || code === "Unknown") return "🌍";
    const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="min-h-screen py-24" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="font-heading font-bold text-3xl" data-testid="admin-title">
              {t("admin_title")}
            </h1>
            <Button
              onClick={() => { fetchData(); fetchSecurityData(); fetchAnalytics(); }}
              variant="outline"
              className="border-border-subtle text-text-secondary hover:bg-white/5"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8" data-testid="admin-stats">
              {[
                { label: "Revenus", value: `${stats.total_revenue?.toFixed(2) || 0}€`, icon: DollarSign, color: "#C2FF00" },
                { label: "Commandes", value: stats.total_orders, icon: Package, color: "#A238FF" },
                { label: "Liens dispo", value: stats.available_links, icon: Link2, color: "#FF0092" },
                { label: "Vendus", value: stats.sold_links, icon: TrendingUp, color: "#F7931A" },
                { label: "Utilisateurs", value: stats.total_users, icon: Users, color: "#00D4FF" },
              ].map((stat, i) => (
                <div key={i} className="admin-widget" data-testid={`stat-${i}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                    <span className="text-text-muted text-xs">{stat.label}</span>
                  </div>
                  <span className="font-heading font-black text-2xl text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Security Alert Banner */}
          {stats?.security && (stats.security.blocked_ips > 0 || stats.security.failed_logins_24h > 10) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <span className="text-red-400 font-medium">Alerte Sécurité: </span>
                <span className="text-text-secondary">
                  {stats.security.blocked_ips} IP(s) bloquée(s), {stats.security.failed_logins_24h} tentatives échouées (24h)
                </span>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" data-testid="admin-tabs">
            <TabsList className="bg-surface border border-border-subtle flex-wrap">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-text-secondary">
                <BarChart3 className="h-4 w-4 mr-2" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-text-secondary">
                <Package className="h-4 w-4 mr-2" />
                Commandes
              </TabsTrigger>
              <TabsTrigger value="links" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-text-secondary">
                <Link2 className="h-4 w-4 mr-2" />
                Liens
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-text-secondary">
                <Users className="h-4 w-4 mr-2" />
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-text-secondary">
                <Shield className="h-4 w-4 mr-2" />
                Sécurité
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Customers */}
                <div className="admin-widget">
                  <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-lime" />
                    Top Clients
                  </h3>
                  <div className="space-y-3">
                    {analytics?.top_customers?.slice(0, 5).map((customer, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-white/3 rounded-lg">
                        <span className="text-sm text-text-secondary truncate flex-1">{customer._id}</span>
                        <Badge className="bg-lime/10 text-lime ml-2">{customer.total_spent?.toFixed(2)}€</Badge>
                      </div>
                    ))}
                    {(!analytics?.top_customers || analytics.top_customers.length === 0) && (
                      <p className="text-text-muted text-sm">Aucune donnée</p>
                    )}
                  </div>
                </div>

                {/* Users by Country */}
                <div className="admin-widget">
                  <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purple" />
                    Utilisateurs par Pays
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(usersByCountry)
                      .sort((a, b) => b[1].count - a[1].count)
                      .slice(0, 10)
                      .map(([code, data]) => (
                        <div key={code} className="flex justify-between items-center p-2 bg-white/3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCountryFlag(code)}</span>
                            <span className="text-sm text-text-secondary">{data.country_name || code}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple/10 text-purple">{data.count} users</Badge>
                            <Badge className="bg-lime/10 text-lime">{data.revenue?.toFixed(0) || 0}€</Badge>
                          </div>
                        </div>
                      ))}
                    {Object.keys(usersByCountry).length === 0 && (
                      <p className="text-text-muted text-sm">Aucune donnée</p>
                    )}
                  </div>
                </div>

                {/* Recent Security Events */}
                <div className="admin-widget lg:col-span-2">
                  <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-rose" />
                    Activité Récente (Sécurité)
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {securityLogs.slice(0, 10).map((log, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-white/3 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <Badge className={eventTypeColor[log.event] || "bg-gray-500/10 text-gray-400"}>
                            {log.event?.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-text-muted">{log.email || log.ip}</span>
                        </div>
                        <span className="text-text-muted">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                    {securityLogs.length === 0 && (
                      <p className="text-text-muted text-sm">Aucun événement</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden" data-testid="orders-table">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border-subtle hover:bg-transparent">
                      <TableHead className="text-text-muted">ID</TableHead>
                      <TableHead className="text-text-muted">Email</TableHead>
                      <TableHead className="text-text-muted">Pack</TableHead>
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
                        <TableCell className="text-sm text-text-muted">{order.pack_id} ({order.quantity})</TableCell>
                        <TableCell className="font-heading font-bold">{order.price}€</TableCell>
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
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-text-muted">
                          Aucune commande
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Import */}
                  <div className="admin-widget">
                    <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-rose" />
                      {t("admin_import")}
                    </h3>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder={t("admin_import_placeholder")}
                      className="w-full bg-white/5 border border-border-subtle rounded-lg p-3 text-sm text-white placeholder:text-text-muted focus:ring-rose focus:border-rose min-h-[100px] resize-y"
                    />
                    <Button
                      onClick={handleImport}
                      disabled={importing}
                      className="mt-2 bg-rose hover:bg-rose/80 text-white rounded-lg"
                    >
                      {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin_import_btn")}
                    </Button>
                  </div>

                  {/* Add single */}
                  <div className="admin-widget">
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
                      />
                      <Button
                        onClick={handleAddSingle}
                        disabled={adding}
                        className="btn-lime rounded-lg px-4"
                      >
                        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin_add_btn")}
                      </Button>
                    </div>
                  </div>
                </div>

                {msg && <p className="text-lime text-sm">{msg}</p>}

                {/* Links table */}
                <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
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
                            Aucun lien
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border-subtle hover:bg-transparent">
                      <TableHead className="text-text-muted">Email</TableHead>
                      <TableHead className="text-text-muted">Pays</TableHead>
                      <TableHead className="text-text-muted">Fidélité</TableHead>
                      <TableHead className="text-text-muted">Dernière IP</TableHead>
                      <TableHead className="text-text-muted">Inscrit le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u, i) => (
                      <TableRow key={i} className="border-border-subtle hover:bg-white/3">
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            {u.role === "admin" && <Shield className="h-4 w-4 text-rose" />}
                            <span className="text-white">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCountryFlag(u.country)}</span>
                            <span className="text-text-secondary text-sm">{u.country || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            u.loyalty_tier?.tier === "diamond" ? "bg-cyan-500/10 text-cyan-400" :
                            u.loyalty_tier?.tier === "platinum" ? "bg-purple/10 text-purple" :
                            u.loyalty_tier?.tier === "gold" ? "bg-yellow-500/10 text-yellow-400" :
                            u.loyalty_tier?.tier === "silver" ? "bg-gray-400/10 text-gray-300" :
                            "bg-orange-500/10 text-orange-400"
                          }>
                            {u.loyalty_tier?.name || "Bronze"} ({u.loyalty_points || 0} pts)
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-text-muted">
                          {u.last_ip || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-text-muted">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-text-muted">
                          Aucun utilisateur
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="space-y-6">
                {/* Security Stats */}
                {stats?.security && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="admin-widget">
                      <div className="flex items-center gap-2 mb-2">
                        <Ban className="h-4 w-4 text-red-400" />
                        <span className="text-text-muted text-xs">IPs Bloquées</span>
                      </div>
                      <span className="font-heading font-black text-2xl text-red-400">{stats.security.blocked_ips}</span>
                    </div>
                    <div className="admin-widget">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-turbo" />
                        <span className="text-text-muted text-xs">Échecs Login (24h)</span>
                      </div>
                      <span className="font-heading font-black text-2xl text-turbo">{stats.security.failed_logins_24h}</span>
                    </div>
                    <div className="admin-widget">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-purple" />
                        <span className="text-text-muted text-xs">Événements (24h)</span>
                      </div>
                      <span className="font-heading font-black text-2xl text-purple">{stats.security.recent_events_24h}</span>
                    </div>
                    <div className="admin-widget">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-lime" />
                        <span className="text-text-muted text-xs">Rate Limits Actifs</span>
                      </div>
                      <span className="font-heading font-black text-2xl text-lime">{stats.security.active_rate_limits}</span>
                    </div>
                  </div>
                )}

                {/* Block IP Manual */}
                <div className="admin-widget">
                  <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                    <Ban className="h-4 w-4 text-red-400" />
                    Bloquer une IP manuellement
                  </h3>
                  <div className="flex gap-3">
                    <Input
                      value={blockIpInput}
                      onChange={(e) => setBlockIpInput(e.target.value)}
                      placeholder="Adresse IP (ex: 192.168.1.1)"
                      className="bg-white/5 border-border-subtle text-white placeholder:text-text-muted"
                    />
                    <Button onClick={handleBlockIp} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4">
                      <Ban className="h-4 w-4 mr-2" />
                      Bloquer (1h)
                    </Button>
                  </div>
                </div>

                {/* Currently Blocked */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="admin-widget">
                    <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-400" />
                      IPs Bloquées
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {blockedList.blocked_ips?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-red-500/10 rounded-lg">
                          <div>
                            <span className="font-mono text-sm text-red-400">{item.ip}</span>
                            <span className="text-xs text-text-muted ml-2">jusqu'à {new Date(item.until).toLocaleTimeString()}</span>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => handleUnblockIp(item.ip)} className="text-lime hover:text-lime/80">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {(!blockedList.blocked_ips || blockedList.blocked_ips.length === 0) && (
                        <p className="text-text-muted text-sm">Aucune IP bloquée</p>
                      )}
                    </div>
                  </div>

                  <div className="admin-widget">
                    <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-turbo" />
                      Emails en Cooldown
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {blockedList.blocked_emails?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-turbo/10 rounded-lg">
                          <span className="text-sm text-turbo">{item.email}</span>
                          <span className="text-xs text-text-muted">jusqu'à {new Date(item.until).toLocaleTimeString()}</span>
                        </div>
                      ))}
                      {(!blockedList.blocked_emails || blockedList.blocked_emails.length === 0) && (
                        <p className="text-text-muted text-sm">Aucun email en cooldown</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Security Logs */}
                <div className="admin-widget">
                  <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple" />
                    Journal de Sécurité
                  </h3>
                  <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border-subtle hover:bg-transparent">
                          <TableHead className="text-text-muted">Événement</TableHead>
                          <TableHead className="text-text-muted">Email/IP</TableHead>
                          <TableHead className="text-text-muted">IP Source</TableHead>
                          <TableHead className="text-text-muted">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {securityLogs.map((log, i) => (
                          <TableRow key={i} className="border-border-subtle hover:bg-white/3">
                            <TableCell>
                              <Badge className={eventTypeColor[log.event] || "bg-gray-500/10 text-gray-400"}>
                                {log.event?.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-text-secondary">{log.email || "-"}</TableCell>
                            <TableCell className="font-mono text-xs text-text-muted">{log.ip}</TableCell>
                            <TableCell className="text-xs text-text-muted">
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {securityLogs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-text-muted">
                              Aucun événement de sécurité
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

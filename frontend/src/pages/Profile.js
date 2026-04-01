import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Equalizer } from "@/components/Equalizer";
import {
  UserCircle, Edit3, Check, Crown, ShoppingBag, CreditCard, Star,
  ChevronRight, Shield, Loader2, LogOut, Award,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIER_CONFIG = {
  bronze: { color: "from-orange-400 to-orange-600", bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", icon: "🥉" },
  silver: { color: "from-gray-300 to-gray-400", bg: "bg-gray-400/10", text: "text-gray-300", border: "border-gray-400/20", icon: "🥈" },
  gold: { color: "from-yellow-400 to-amber-500", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", icon: "🥇" },
  platinum: { color: "from-purple-400 to-purple-600", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", icon: "💎" },
  diamond: { color: "from-cyan-300 to-blue-500", bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/20", icon: "👑" },
};

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const lang = i18n.language || "en";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/user/profile`, { withCredentials: true });
      setProfile(data);
      setNameInput(data.name || "");
    } catch {
      // If unauthorized, redirect to login
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    try {
      await axios.put(`${API}/user/profile`, { name: nameInput.trim() }, { withCredentials: true });
      setProfile((prev) => ({ ...prev, name: nameInput.trim() }));
      setEditingName(false);
    } catch {}
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-light" />
      </div>
    );
  }

  if (!profile) return null;

  const tierKey = profile.loyalty_tier?.tier || "bronze";
  const tier = TIER_CONFIG[tierKey] || TIER_CONFIG.bronze;
  const progressPercent = profile.next_tier
    ? Math.min(100, ((profile.loyalty_points - (profile.loyalty_tier?.min_points || 0)) / (profile.next_tier.min_points - (profile.loyalty_tier?.min_points || 0))) * 100)
    : 100;

  return (
    <div className="min-h-screen py-24 relative" data-testid="profile-page">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Profile Header Card */}
          <div className="glass-card rounded-3xl overflow-hidden">
            {/* Top gradient bar */}
            <div className={`h-28 relative bg-gradient-to-r ${tier.color} opacity-20`} />
            <div className="px-8 pb-8 -mt-14">
              {/* Avatar */}
              <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-xl border-4 border-void`}>
                <span className="text-4xl">{tier.icon}</span>
              </div>

              <div className="mt-4 flex items-start justify-between">
                <div className="flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                        className="bg-white/5 border-white/10 text-white h-10 rounded-xl max-w-[200px]"
                        autoFocus onKeyDown={(e) => e.key === "Enter" && handleSaveName()} />
                      <Button onClick={handleSaveName} disabled={saving} size="sm"
                        className="btn-primary rounded-xl h-10 px-3">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="font-heading font-bold text-2xl">{profile.name}</h1>
                      <button onClick={() => setEditingName(true)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-text-secondary text-sm mt-0.5">{profile.email}</p>
                </div>
                <Badge className={`${tier.bg} ${tier.text} ${tier.border} text-xs font-semibold px-3 py-1`}>
                  <Crown className="h-3 w-3 mr-1" /> {profile.loyalty_tier?.name || "Bronze"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: lang === "fr" ? "Commandes" : "Orders", value: profile.completed_orders, icon: ShoppingBag, color: "text-primary-light" },
              { label: lang === "fr" ? "Depense" : "Spent", value: `${profile.total_spent}€`, icon: CreditCard, color: "text-teal" },
              { label: "Points", value: profile.loyalty_points, icon: Star, color: "text-accent-light" },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="glass-card rounded-2xl p-5 text-center">
                <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
                <p className="font-heading font-bold text-xl text-white">{stat.value}</p>
                <p className="text-text-muted text-xs mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Loyalty Progress */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className={`h-5 w-5 ${tier.text}`} />
                <h3 className="font-heading font-semibold text-sm">
                  {lang === "fr" ? "Programme Fidelite" : lang === "ar" ? "برنامج الولاء" : "Loyalty Program"}
                </h3>
              </div>
              {profile.loyalty_tier?.discount > 0 && (
                <Badge className="bg-emerald/10 text-emerald border-emerald/20 text-xs">
                  -{profile.loyalty_tier.discount}%{" "}
                  {lang === "fr" ? "reduction" : "discount"}
                </Badge>
              )}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className={tier.text}>{profile.loyalty_tier?.name}</span>
                {profile.next_tier && (
                  <span className="text-text-muted">{profile.next_tier.name} ({profile.points_to_next} pts)</span>
                )}
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${tier.color}`}
                />
              </div>
            </div>

            {/* Tier ladder */}
            <div className="flex items-center justify-between pt-2">
              {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                <div key={key} className={`flex flex-col items-center gap-1 ${key === tierKey ? "opacity-100" : "opacity-30"}`}>
                  <span className="text-base">{cfg.icon}</span>
                  <span className="text-[10px] text-text-muted capitalize">{key}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <div className="space-y-2">
            <Link to="/history" className="glass-card glass-card-hover rounded-2xl p-4 flex items-center justify-between group block transition-all">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-primary-light" />
                <span className="text-sm font-medium">{t("nav_history")}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-white transition-colors" />
            </Link>
            <Link to="/offers" className="glass-card glass-card-hover rounded-2xl p-4 flex items-center justify-between group block transition-all">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-teal" />
                <span className="text-sm font-medium">{t("nav_offers")}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-white transition-colors" />
            </Link>
          </div>

          {/* Logout */}
          <Button onClick={() => { logout(); navigate("/"); }}
            variant="ghost" className="w-full text-text-muted hover:text-rose hover:bg-rose/5 rounded-xl gap-2 py-5">
            <LogOut className="h-4 w-4" />
            {t("nav_logout")}
          </Button>

        </motion.div>
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Loader2, Check, Edit3, LogOut, ArrowRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIER_LABEL = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum", diamond: "Diamond" };

export default function Profile() {
  const { i18n } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const lang = i18n.language || "fr";

  useEffect(() => { if (!authLoading && !user) navigate("/login"); }, [user, authLoading, navigate]);

  const fetchProfile = useCallback(async () => {
    try { const { data } = await axios.get(`${API}/user/profile`, { withCredentials: true }); setProfile(data); setNameInput(data.name || ""); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchProfile(); }, [user, fetchProfile]);

  const saveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    try { await axios.put(`${API}/user/profile`, { name: nameInput.trim() }, { withCredentials: true }); setProfile((p) => ({ ...p, name: nameInput.trim() })); setEditingName(false); } catch {}
    setSaving(false);
  };

  if (authLoading || loading) return <div className="max-w-lg mx-auto px-5 py-24 text-center"><Loader2 className="h-5 w-5 animate-spin text-t-muted mx-auto" /></div>;
  if (!profile) return null;

  const tierKey = profile.loyalty_tier?.tier || "bronze";
  const tierName = TIER_LABEL[tierKey] || "Bronze";
  const progress = profile.next_tier ? Math.min(100, ((profile.loyalty_points - (profile.loyalty_tier?.min_points || 0)) / (profile.next_tier.min_points - (profile.loyalty_tier?.min_points || 0))) * 100) : 100;

  return (
    <div className="max-w-lg mx-auto px-5 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">

        {/* Identity */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-start justify-between">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                  className="bg-bg border-border text-t-primary h-9 rounded-lg text-[14px] max-w-[180px] focus:border-accent/50"
                  autoFocus onKeyDown={(e) => e.key === "Enter" && saveName()} />
                <button onClick={saveName} disabled={saving} className="text-accent hover:text-accent-hover transition-colors">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-t-primary font-medium text-[16px]">{profile.name}</span>
                <button onClick={() => setEditingName(true)} className="text-t-muted hover:text-t-secondary transition-colors">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <span className="text-accent text-[12px] font-medium bg-accent-dim px-2 py-0.5 rounded">{tierName}</span>
          </div>
          <p className="text-t-muted text-[13px] mt-1">{profile.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: lang === "fr" ? "Commandes" : "Orders", value: profile.completed_orders },
            { label: lang === "fr" ? "Dépensé" : "Spent", value: `${profile.total_spent}€` },
            { label: "Points", value: profile.loyalty_points },
          ].map((s, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 text-center">
              <p className="text-t-primary font-semibold text-[18px] tabular-nums">{s.value}</p>
              <p className="text-t-muted text-[11px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Loyalty */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-t-secondary text-[13px]">{lang === "fr" ? "Fidélité" : "Loyalty"}</span>
            {profile.loyalty_tier?.discount > 0 && <span className="text-green text-[12px] font-medium">-{profile.loyalty_tier.discount}%</span>}
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden mb-2">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-accent rounded-full" />
          </div>
          {profile.next_tier && <p className="text-t-muted text-[11px]">{profile.points_to_next} pts → {profile.next_tier.name}</p>}
        </div>

        {/* Links */}
        <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
          <Link to="/history" className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-2 transition-colors">
            <span className="text-t-secondary text-[14px]">{lang === "fr" ? "Mes commandes" : "My orders"}</span>
            <ArrowRight className="h-3.5 w-3.5 text-t-muted" />
          </Link>
          <Link to="/" className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-2 transition-colors">
            <span className="text-t-secondary text-[14px]">{lang === "fr" ? "Acheter des liens" : "Buy links"}</span>
            <ArrowRight className="h-3.5 w-3.5 text-t-muted" />
          </Link>
        </div>

        {/* Logout */}
        <button onClick={() => { logout(); navigate("/"); }}
          className="w-full text-center text-t-muted hover:text-red-400 text-[13px] py-3 transition-colors flex items-center justify-center gap-1.5">
          <LogOut className="h-3.5 w-3.5" /> {lang === "fr" ? "Déconnexion" : "Sign out"}
        </button>
      </motion.div>
    </div>
  );
}

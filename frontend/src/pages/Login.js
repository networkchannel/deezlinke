import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, ArrowLeft, Check } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Login() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyMagicLink, checkAuth, user } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("form");
  const pollingRef = useRef(null);
  const lang = i18n.language || "fr";

  useEffect(() => { if (user && user.email) navigate("/profile"); }, [user, navigate]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setPhase("verifying");
      verifyMagicLink(token)
        .then(() => { setPhase("verified"); setTimeout(() => navigate("/profile"), 1200); })
        .catch(() => { setError("Link expired"); setPhase("form"); });
    }
  }, [searchParams, verifyMagicLink, navigate]);

  const startPolling = useCallback((sid) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/auth/magic/check/${sid}`, { withCredentials: true });
        if (data.verified) {
          clearInterval(pollingRef.current);
          setPhase("verified");
          await checkAuth();
          setTimeout(() => navigate("/profile"), 1000);
        } else if (data.status === "expired") {
          clearInterval(pollingRef.current);
          setError("Session expired"); setPhase("form");
        }
      } catch {}
    }, 3000);
  }, [checkAuth, navigate]);

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { setError(lang === "fr" ? "Email invalide" : "Invalid email"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await axios.post(`${API}/auth/magic`, { email: email.trim(), language: lang }, { withCredentials: true });
      localStorage.setItem("deezlink_email", email.trim().toLowerCase());
      window.dispatchEvent(new Event("deezlink_email_update"));
      setPhase("waiting");
      startPolling(data.session_id);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Error");
    }
    setLoading(false);
  };

  /* Verifying */
  if (phase === "verifying") return (
    <div className="max-w-sm mx-auto px-5 py-24 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-t-muted mx-auto mb-3" />
      <p className="text-t-muted text-[14px]">{lang === "fr" ? "Vérification..." : "Verifying..."}</p>
    </div>
  );

  /* Verified */
  if (phase === "verified") return (
    <div className="max-w-sm mx-auto px-5 py-24 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="w-12 h-12 rounded-full bg-green-dim border border-green/20 flex items-center justify-center mx-auto mb-3">
          <Check className="h-5 w-5 text-green" />
        </div>
      </motion.div>
      <p className="text-green text-[14px] font-medium">{lang === "fr" ? "Connecté" : "Signed in"}</p>
    </div>
  );

  /* Waiting */
  if (phase === "waiting") return (
    <div className="max-w-sm mx-auto px-5 py-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-accent-dim border border-accent/20 flex items-center justify-center mx-auto mb-5">
            <Mail className="h-5 w-5 text-accent" />
          </div>
          <p className="text-t-primary font-medium text-[16px] mb-2">
            {lang === "fr" ? "Vérifiez votre email" : "Check your email"}
          </p>
          <p className="text-t-secondary text-[13px] mb-1">
            {lang === "fr" ? "Lien envoyé à" : "Link sent to"}
          </p>
          <p className="text-accent text-[13px] font-medium mb-6">{email}</p>

          <div className="flex items-center justify-center gap-2 text-t-muted text-[12px] mb-6">
            <Loader2 className="h-3 w-3 animate-spin" />
            {lang === "fr" ? "En attente de confirmation..." : "Waiting for confirmation..."}
          </div>

          <p className="text-t-muted text-[11px] mb-4">
            {lang === "fr" ? "Le lien expire dans 30 minutes" : "Link expires in 30 minutes"}
          </p>

          <button onClick={() => { if (pollingRef.current) clearInterval(pollingRef.current); setPhase("form"); }}
            className="text-t-muted hover:text-t-secondary text-[13px] transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> {lang === "fr" ? "Autre email" : "Different email"}
          </button>
        </div>
      </motion.div>
    </div>
  );

  /* Form */
  return (
    <div className="max-w-sm mx-auto px-5 py-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-t-primary font-semibold text-[22px] mb-2">
          {lang === "fr" ? "Connexion" : "Sign in"}
        </h1>
        <p className="text-t-secondary text-[13px] mb-6">
          {lang === "fr" ? "Un lien de connexion sera envoyé par email." : "A login link will be sent to your email."}
        </p>

        <div className="bg-surface border border-border rounded-xl p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[13px] text-t-secondary block mb-2">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="bg-bg border-border text-t-primary placeholder:text-t-muted h-11 rounded-lg text-[14px] focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                placeholder="you@example.com" required autoFocus />
            </div>
            {error && <p className="text-red-500 text-[13px]">{error}</p>}
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-[14px] font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? (lang === "fr" ? "Envoi..." : "Sending...") : (lang === "fr" ? "Recevoir le lien" : "Get login link")}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

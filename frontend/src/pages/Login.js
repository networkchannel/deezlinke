import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Equalizer } from "@/components/Equalizer";
import { Loader2, Mail, Sparkles, CheckCircle, Clock, ArrowLeft } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyMagicLink, checkAuth, user } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("form"); // form | waiting | verifying | verified
  const [sessionId, setSessionId] = useState("");
  const pollingRef = useRef(null);
  const lang = i18n.language || "en";

  // If user already logged in, redirect
  useEffect(() => {
    if (user && user.email) {
      navigate("/profile");
    }
  }, [user, navigate]);

  // Check if there's a token in the URL (user clicked the magic link)
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setPhase("verifying");
      verifyMagicLink(token)
        .then(() => {
          setPhase("verified");
          setTimeout(() => navigate("/profile"), 1500);
        })
        .catch(() => {
          setError("Link expired or invalid. Please request a new one.");
          setPhase("form");
        });
    }
  }, [searchParams, verifyMagicLink, navigate]);

  // Polling for magic link verification
  const startPolling = useCallback((sid) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API}/auth/magic/check/${sid}`, { withCredentials: true });
        if (data.verified) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPhase("verified");
          // Refresh auth state
          await checkAuth();
          setTimeout(() => navigate("/profile"), 1200);
        } else if (data.status === "expired") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setError("Session expired. Please try again.");
          setPhase("form");
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);
  }, [checkAuth, navigate]);

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError(lang === "fr" ? "Entrez un email valide" : "Please enter a valid email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/auth/magic`, { email: email.trim(), language: lang }, { withCredentials: true });
      localStorage.setItem("deezlink_email", email.trim().toLowerCase());
      window.dispatchEvent(new Event("deezlink_email_update"));
      setSessionId(data.session_id);
      setPhase("waiting");
      startPolling(data.session_id);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24 relative" data-testid="login-page">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {/* ─── FORM PHASE ─── */}
        {phase === "form" && (
          <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm mx-6 z-10">
            <div className="text-center mb-8">
              <Equalizer count={5} color="#818CF8" height={24} />
              <h1 className="font-heading font-bold text-2xl mt-4" data-testid="login-title">{t("login_title")}</h1>
              <p className="text-text-secondary text-sm mt-2">{t("login_subtitle")}</p>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary mb-2 block flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {t("checkout_email")}
                  </label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login_email_placeholder")}
                    className="bg-white/5 border-white/10 text-white placeholder:text-text-muted focus:ring-primary/50 focus:border-primary/50 h-12 rounded-xl"
                    data-testid="login-email-input" required autoFocus
                  />
                </div>

                {error && <p className="text-rose text-sm" data-testid="login-error">{error}</p>}

                <Button type="submit" disabled={loading}
                  className="w-full btn-primary rounded-xl py-5 font-semibold flex items-center justify-center gap-2"
                  data-testid="login-submit-btn">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t("login_processing")}</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> {t("login_btn")}</>
                  )}
                </Button>
              </form>

              <p className="text-text-muted text-[10px] text-center mt-4 flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" /> {t("login_magic")}
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── WAITING PHASE ─── */}
        {phase === "waiting" && (
          <motion.div key="waiting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} className="relative w-full max-w-md mx-6 z-10 text-center">
            <div className="glass-card rounded-3xl p-10 space-y-8">
              {/* Animated mail icon */}
              <div className="relative mx-auto w-24 h-24">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                >
                  <Mail className="h-10 w-10 text-primary-light" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                />
              </div>

              <div>
                <h2 className="font-heading font-bold text-xl mb-2">
                  {lang === "fr" ? "Verifiez votre email" : lang === "ar" ? "تحقق من بريدك" : "Check your email"}
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {lang === "fr"
                    ? <>Nous avons envoye un lien magique a<br/><span className="text-primary-light font-medium">{email}</span></>
                    : lang === "ar"
                    ? <>تم إرسال رابط سحري إلى<br/><span className="text-primary-light font-medium">{email}</span></>
                    : <>We sent a magic link to<br/><span className="text-primary-light font-medium">{email}</span></>
                  }
                </p>
              </div>

              {/* Waiting indicator */}
              <div className="flex items-center justify-center gap-3 py-3 px-5 rounded-xl bg-white/5 mx-auto w-fit">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                      className="w-2 h-2 rounded-full bg-primary-light"
                    />
                  ))}
                </div>
                <span className="text-text-muted text-xs">
                  {lang === "fr" ? "En attente de confirmation..." : lang === "ar" ? "في انتظار التأكيد..." : "Waiting for confirmation..."}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-text-muted text-xs">
                <Clock className="h-3 w-3" />
                {lang === "fr" ? "Le lien expire dans 30 minutes" : lang === "ar" ? "تنتهي صلاحية الرابط خلال 30 دقيقة" : "Link expires in 30 minutes"}
              </div>

              <button onClick={() => { if (pollingRef.current) clearInterval(pollingRef.current); setPhase("form"); }}
                className="text-text-secondary text-sm hover:text-white transition-colors flex items-center gap-1.5 mx-auto">
                <ArrowLeft className="h-3.5 w-3.5" />
                {lang === "fr" ? "Utiliser un autre email" : lang === "ar" ? "استخدم بريد آخر" : "Use a different email"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── VERIFYING PHASE ─── */}
        {phase === "verifying" && (
          <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} className="relative z-10 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary-light mx-auto" />
            <p className="text-text-secondary text-sm">
              {lang === "fr" ? "Verification en cours..." : lang === "ar" ? "جاري التحقق..." : "Verifying your link..."}
            </p>
          </motion.div>
        )}

        {/* ─── VERIFIED PHASE ─── */}
        {phase === "verified" && (
          <motion.div key="verified" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }} className="relative z-10 text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
              <div className="w-20 h-20 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-emerald" />
              </div>
            </motion.div>
            <h2 className="font-heading font-bold text-xl">
              {lang === "fr" ? "Connexion reussie !" : lang === "ar" ? "تم تسجيل الدخول بنجاح!" : "Successfully signed in!"}
            </h2>
            <p className="text-text-secondary text-sm">
              {lang === "fr" ? "Redirection..." : lang === "ar" ? "جاري إعادة التوجيه..." : "Redirecting..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

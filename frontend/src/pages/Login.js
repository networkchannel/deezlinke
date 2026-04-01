import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Equalizer } from "@/components/Equalizer";
import { Loader2, Mail, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/auth/magic`, { email: email.trim() }, { withCredentials: true });
      // Store email and trigger nav update
      localStorage.setItem("deezlink_email", email.trim().toLowerCase());
      window.dispatchEvent(new Event("deezlink_email_update"));
      // Redirect to home or history
      navigate("/history");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24" data-testid="login-page">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm mx-6">
        <div className="text-center mb-8">
          <Equalizer count={5} color="#C2FF00" height={24} />
          <h1 className="font-heading font-bold text-2xl mt-4" data-testid="login-title">{t("login_title")}</h1>
          <p className="text-text-secondary text-sm mt-2">{t("login_subtitle")}</p>
        </div>

        <div className="bg-surface border border-border-subtle rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary mb-2 block flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {t("checkout_email")}
              </label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login_email_placeholder")}
                className="bg-white/5 border-white/10 text-white placeholder:text-text-muted focus:ring-lime/50 focus:border-lime/50 h-12"
                data-testid="login-email-input" required autoFocus
              />
            </div>

            {error && <p className="text-red-400 text-sm" data-testid="login-error">{error}</p>}

            <Button type="submit" disabled={loading}
              className="w-full btn-lime rounded-xl py-5 font-bold flex items-center justify-center gap-2"
              data-testid="login-submit-btn"
            >
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
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Equalizer } from "@/components/Equalizer";
import { Loader2 } from "lucide-react";

export default function AdminLogin() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        setError("Admin access required");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24" data-testid="admin-login-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm mx-6"
      >
        <div className="text-center mb-8">
          <Equalizer count={5} color="#A238FF" height={24} />
          <h1 className="font-heading font-bold text-2xl mt-4" data-testid="admin-login-title">
            {t("admin_login_title")}
          </h1>
        </div>

        <div className="bg-surface border border-border-subtle rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary mb-2 block">{t("admin_email")}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-border-subtle text-white placeholder:text-text-muted focus:ring-purple focus:border-purple"
                data-testid="admin-email-input"
                required
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-2 block">{t("admin_password")}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-border-subtle text-white placeholder:text-text-muted focus:ring-purple focus:border-purple"
                data-testid="admin-password-input"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm" data-testid="admin-login-error">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple hover:bg-purple/80 text-white rounded-xl py-5 font-bold"
              data-testid="admin-login-btn"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin_login_btn")}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

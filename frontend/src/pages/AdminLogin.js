import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
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
    e.preventDefault(); setLoading(true); setError("");
    try {
      const user = await login(email, password);
      if (user.role === "admin") navigate("/admin"); else setError("Admin access required");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto px-5 py-24">
      <h1 className="text-t-primary font-semibold text-[20px] mb-6">Admin</h1>
      <div className="bg-surface border border-border rounded-lg p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[13px] text-t-secondary block mb-2">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="bg-bg border-border text-t-primary h-11 rounded-md text-[14px]" required />
          </div>
          <div>
            <label className="text-[13px] text-t-secondary block mb-2">{t("admin_password")}</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="bg-bg border-border text-t-primary h-11 rounded-md text-[14px]" required />
          </div>
          {error && <p className="text-red-500 text-[13px]">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-[14px] font-medium py-3 rounded-md transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "..." : t("admin_login_btn")}
          </button>
        </form>
      </div>
    </div>
  );
}

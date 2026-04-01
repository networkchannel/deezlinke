import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Menu, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    axios.get(`${API}/admin/check-ip`, { withCredentials: true })
      .then((r) => { setIsAdmin(r.data.is_admin); if (r.data.is_admin) axios.post(`${API}/admin/auto-login`, {}, { withCredentials: true }).catch(() => {}); })
      .catch(() => {});
  }, []);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
  };

  const active = (p) => location.pathname === p;

  return (
    <header className="sticky top-0 z-40 glass backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="text-t-primary font-bold text-lg tracking-tight">
          Deez<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">Link</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className={`text-sm font-medium transition-colors ${active("/") || active("/offers") ? "text-t-primary" : "text-t-secondary hover:text-t-primary"}`}>
            {t("nav_offers")}
          </Link>
          {user && user.role !== "admin" && (
            <Link to="/history" className={`text-sm font-medium transition-colors ${active("/history") ? "text-t-primary" : "text-t-secondary hover:text-t-primary"}`}>
              {t("nav_history")}
            </Link>
          )}
          {isAdmin && user && user.role === "admin" && (
            <Link to="/admin" className={`text-sm font-medium transition-colors ${active("/admin") ? "text-t-primary" : "text-t-secondary hover:text-t-primary"}`}>
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="text-t-muted hover:text-t-secondary text-xs flex items-center gap-1.5 outline-none">
              <Globe className="h-4 w-4" /> {i18n.language?.toUpperCase()}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass border-border min-w-[60px] backdrop-blur-xl">
              {["fr", "en", "ar"].map((lng) => (
                <DropdownMenuItem key={lng} onClick={() => changeLang(lng)}
                  className={`text-xs cursor-pointer ${i18n.language === lng ? "text-accent" : "text-t-secondary"}`}>
                  {lng.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user && user.role !== "admin" ? (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/profile" className="text-sm text-t-secondary hover:text-t-primary transition-colors">{t("nav_profile")}</Link>
              <button onClick={logout} className="text-sm text-t-muted hover:text-t-secondary transition-colors">{t("nav_logout")}</button>
            </div>
          ) : !user ? (
            <Link to="/login" className="hidden md:block text-sm text-t-secondary hover:text-t-primary transition-colors">{t("nav_login")}</Link>
          ) : null}

          <button className="md:hidden text-t-secondary hover:text-t-primary transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border glass backdrop-blur-xl px-4 py-4 space-y-1">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-t-secondary hover:text-t-primary transition-colors">{t("nav_offers")}</Link>
          {user && user.role !== "admin" && (
            <>
              <Link to="/history" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-t-secondary hover:text-t-primary transition-colors">{t("nav_history")}</Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-t-secondary hover:text-t-primary transition-colors">{t("nav_profile")}</Link>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="block py-2.5 text-sm text-t-muted hover:text-t-secondary transition-colors">{t("nav_logout")}</button>
            </>
          )}
          {!user && <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-t-secondary hover:text-t-primary transition-colors">{t("nav_login")}</Link>}
        </div>
      )}
    </header>
  );
}

import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Equalizer } from "@/components/Equalizer";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Menu, X, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasEmail, setHasEmail] = useState(false);
  const [isAdminIp, setIsAdminIp] = useState(false);

  useEffect(() => {
    const check = () => setHasEmail(!!localStorage.getItem("deezlink_email"));
    check();
    window.addEventListener("storage", check);
    window.addEventListener("deezlink_email_update", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("deezlink_email_update", check);
    };
  }, []);

  // Check if admin IP
  useEffect(() => {
    axios.get(`${API}/admin/check-ip`, { withCredentials: true }).then((r) => {
      setIsAdminIp(r.data.is_admin);
      if (r.data.is_admin) {
        // Auto-login admin
        axios.post(`${API}/admin/auto-login`, {}, { withCredentials: true }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/", label: t("nav_home") },
    { to: "/offers", label: t("nav_offers") },
  ];
  if (hasEmail || (user && user.role !== "admin")) {
    navLinks.push({ to: "/history", label: t("nav_history") });
  }
  if (isAdminIp && user && user.role === "admin") {
    navLinks.push({ to: "/admin", label: t("nav_admin") });
  }

  return (
    <header className="glass-nav fixed top-0 inset-x-0 z-40" data-testid="header">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="logo-link">
          <Equalizer count={4} color="#C2FF00" height={18} />
          <span className="font-heading font-black text-lg text-white tracking-tight">
            Deez<span className="text-lime">Link</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" data-testid="desktop-nav">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} data-testid={`nav-${link.to.replace("/", "") || "home"}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(link.to) ? "bg-white/10 text-lime" : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm"
                className="text-text-secondary hover:text-white hover:bg-white/5 gap-1.5 text-xs font-mono"
                data-testid="lang-switcher-btn">
                <Globe className="h-3.5 w-3.5" /> {i18n.language?.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-surface border-border-subtle min-w-[80px]">
              {["en", "fr", "ar"].map((lng) => (
                <DropdownMenuItem key={lng} onClick={() => changeLang(lng)} data-testid={`lang-${lng}`}
                  className={`cursor-pointer text-xs font-mono ${i18n.language === lng ? "text-lime" : "text-text-secondary"}`}>
                  {t(`lang_${lng}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user && user.role !== "admin" ? (
            <Button variant="ghost" size="sm" onClick={logout}
              className="hidden md:inline-flex text-text-secondary hover:text-white text-xs gap-1.5" data-testid="logout-btn">
              <LogOut className="h-3.5 w-3.5" /> {t("nav_logout")}
            </Button>
          ) : !user ? (
            <Link to="/login" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm"
                className="text-text-secondary hover:text-white text-xs gap-1.5" data-testid="login-link">
                <User className="h-3.5 w-3.5" /> {t("nav_login")}
              </Button>
            </Link>
          ) : null}

          <Button variant="ghost" size="icon" className="md:hidden text-text-secondary h-8 w-8"
            onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-btn">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-surface/95 backdrop-blur-xl border-t border-border-subtle px-6 py-4 space-y-1" data-testid="mobile-nav">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${isActive(link.to) ? "text-lime bg-white/5" : "text-text-secondary"}`}>
              {link.label}
            </Link>
          ))}
          {user && user.role !== "admin" ? (
            <button onClick={() => { logout(); setMobileOpen(false); }}
              className="w-full text-start px-3 py-2.5 rounded-lg text-sm text-text-secondary">{t("nav_logout")}</button>
          ) : !user ? (
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-text-secondary">{t("nav_login")}</Link>
          ) : null}
        </div>
      )}
    </header>
  );
}

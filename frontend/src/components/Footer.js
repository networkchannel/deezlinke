import { useTranslation } from "react-i18next";
import { Equalizer } from "@/components/Equalizer";
import { Heart, Music2 } from "lucide-react";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";
  return (
    <footer className="border-t border-border-subtle bg-surface/30" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Equalizer count={4} color="#C2FF00" height={16} />
              <span className="font-heading font-black text-lg text-white">Deez<span className="text-lime">Link</span></span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              {t("footer_desc")}
            </p>
          </div>
          {/* Links */}
          <div>
            <h4 className="text-white font-heading font-bold text-sm mb-4">
              {t("footer_nav")}
            </h4>
            <ul className="space-y-2">
              {[
                { label: t("nav_home"), href: "/" },
                { label: t("nav_offers"), href: "/offers" },
                { label: t("nav_history"), href: "/history" },
                { label: "FAQ", href: "/#faq" },
              ].map((l, i) => (
                <li key={i}>
                  <a href={l.href} className="text-text-secondary text-sm hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          {/* Payment */}
          <div>
            <h4 className="text-white font-heading font-bold text-sm mb-4">
              {t("footer_payment")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {["BTC", "ETH", "USDT", "LTC"].map((c) => (
                <span key={c} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-secondary font-mono">{c}</span>
              ))}
            </div>
            <p className="text-text-muted text-xs mt-4 flex items-center gap-1">
              {t("footer_powered")} <span className="text-crypto font-bold">OxaPay</span>
            </p>
          </div>
        </div>
        <div className="border-t border-border-subtle mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-text-muted text-xs flex items-center gap-1">
            <Music2 className="h-3 w-3" /> DeezLink &copy; {new Date().getFullYear()}
          </p>
          <p className="text-text-muted text-xs flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-rose" /> for music lovers
          </p>
        </div>
      </div>
    </footer>
  );
}

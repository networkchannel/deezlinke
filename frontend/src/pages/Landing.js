import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import { Button } from "@/components/ui/button";
import { Equalizer } from "@/components/Equalizer";
import {
  ShoppingCart, CreditCard, Link2, Heart, Play, ChevronRight,
  Shield, Clock, Globe, Star,
} from "lucide-react";

// Trending artists per language
const ARTISTS = {
  en: [
    { name: "Drake", genre: "Hip-Hop", img: "https://images.pexels.com/photos/10063279/pexels-photo-10063279.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
    { name: "The Weeknd", genre: "R&B", img: "https://images.unsplash.com/photo-1669459881627-06c2a4948e33?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
    { name: "Billie Eilish", genre: "Pop", img: "https://images.unsplash.com/photo-1758598303702-acbab724cd9f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
    { name: "Bad Bunny", genre: "Reggaeton", img: "https://images.pexels.com/photos/7971875/pexels-photo-7971875.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
    { name: "Taylor Swift", genre: "Pop", img: "https://images.unsplash.com/photo-1767969457898-51d5e9cf81d2?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
    { name: "Kendrick Lamar", genre: "Hip-Hop", img: "https://images.unsplash.com/photo-1635961726947-0f821cf9ba28?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
  ],
  fr: [
    { name: "Jul", genre: "Rap FR", img: "https://images.pexels.com/photos/10063279/pexels-photo-10063279.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
    { name: "Aya Nakamura", genre: "Pop/R&B", img: "https://images.unsplash.com/photo-1758272423042-fb02e32195f0?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
    { name: "SDM", genre: "Rap FR", img: "https://images.pexels.com/photos/7971875/pexels-photo-7971875.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
    { name: "Ninho", genre: "Rap FR", img: "https://images.unsplash.com/photo-1635961726947-0f821cf9ba28?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
    { name: "Angele", genre: "Pop", img: "https://images.unsplash.com/photo-1764576441006-093d5879e44d?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
    { name: "Damso", genre: "Rap FR", img: "https://images.unsplash.com/photo-1669459881627-06c2a4948e33?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
  ],
  ar: [
    { name: "Amr Diab", genre: "Pop", img: "https://images.pexels.com/photos/10063279/pexels-photo-10063279.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
    { name: "Nancy Ajram", genre: "Pop", img: "https://images.unsplash.com/photo-1758272423042-fb02e32195f0?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
    { name: "Mohamed Hamaki", genre: "Pop", img: "https://images.unsplash.com/photo-1635961726947-0f821cf9ba28?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
    { name: "Elissa", genre: "Pop", img: "https://images.pexels.com/photos/31853515/pexels-photo-31853515.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
    { name: "Tamer Hosny", genre: "R&B", img: "https://images.pexels.com/photos/7971875/pexels-photo-7971875.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
    { name: "Cairokee", genre: "Rock", img: "https://images.unsplash.com/photo-1767969457898-51d5e9cf81d2?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=300&h=300&fit=crop" },
  ],
};

export default function Landing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || "en";
  const artists = ARTISTS[lang] || ARTISTS.en;

  return (
    <div className="overflow-hidden">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[90vh] flex items-center" data-testid="hero-section">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-rose/10 via-void to-purple/10" />
          <div className="absolute top-0 end-0 w-1/2 h-full opacity-30">
            <img src="https://static.prod-images.emergentagent.com/jobs/3825f6f0-27dd-463f-b595-22d9d67603b3/images/bde64c3e6fbe4493db501bbbe6c0850b48ad508420f58c3ba845a14d60e4a021.png"
              alt="" className="w-full h-full object-cover object-top" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-transparent" />
          </div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 space-y-8">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <div className="inline-flex items-center gap-2 bg-rose/10 border border-rose/30 rounded-full px-4 py-1.5" data-testid="hero-badge">
                  <div className="w-2 h-2 rounded-full bg-rose animate-pulse" />
                  <span className="text-rose text-xs font-bold tracking-wider uppercase">{t("hero_badge")}</span>
                </div>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-5xl sm:text-6xl lg:text-7xl tracking-tighter font-black uppercase leading-[0.9] font-heading" data-testid="hero-title">
                <span className="text-white">{t("hero_title_1")}</span><br />
                <span className="gradient-text">{t("hero_title_2")}</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-lg text-text-secondary font-light max-w-lg leading-relaxed" data-testid="hero-subtitle">
                {t("hero_subtitle")}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-wrap gap-4">
                <Button onClick={() => navigate("/offers")} className="btn-lime rounded-full px-8 py-6 text-base font-bold text-void" data-testid="hero-cta-btn">
                  <Play className="h-5 w-5 fill-current me-2" /> {t("hero_cta")}
                </Button>
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <span className="font-mono">{t("hero_starting")}</span>
                  <span className="text-lime font-heading font-black text-2xl">1.50&euro;</span>
                  <span className="font-mono">{t("hero_per_link")}</span>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap gap-3 pt-4">
                {[
                  { icon: Shield, text: t("hero_secure") },
                  { icon: Clock, text: t("hero_instant") },
                  { icon: Globe, text: t("hero_crypto") },
                ].map((pill, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-text-secondary">
                    <pill.icon className="h-3 w-3" /> {pill.text}
                  </span>
                ))}
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="md:col-span-5 hidden md:block">
              <div className="relative" data-testid="hero-visual">
                <div className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-rose/10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl overflow-hidden relative group">
                      <img src={artists[0]?.img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{artists[0]?.name}</p>
                      <p className="text-text-muted text-xs">{artists[0]?.genre} &bull; Deezer Premium</p>
                    </div>
                    <Heart className="h-5 w-5 text-rose" />
                  </div>
                  <div className="flex items-end gap-[2px] h-12 mb-4">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="flex-1 rounded-full bg-gradient-to-t from-rose to-purple transition-all duration-300"
                        style={{ height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 50}%`, opacity: i < 16 ? 1 : 0.3 }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted font-mono"><span>1:42</span><span>3:56</span></div>
                  <div className="mt-5 space-y-2">
                    {artists.slice(1, 4).map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                        <img src={a.img} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{a.name}</p>
                          <p className="text-text-muted text-[10px]">{a.genre}</p>
                        </div>
                        <Play className="h-3.5 w-3.5 text-text-muted group-hover:text-lime transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-rose/20 to-purple/20 blur-3xl -z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-border-subtle bg-surface/30 py-3">
        <Marquee speed={35} gradient={false} data-testid="marquee">
          {[1, 2, 3].map((i) => <span key={i} className="text-text-muted text-xs font-mono tracking-[0.15em] mx-12">{t("marquee_text")}</span>)}
        </Marquee>
      </div>

      {/* TRENDING ARTISTS */}
      <section className="py-20 md:py-28" data-testid="artists-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase font-bold text-rose mb-2">{t("artists_overline")}</p>
              <h2 className="text-3xl sm:text-4xl tracking-tight font-bold font-heading">{t("artists_title")}</h2>
            </div>
            <ChevronRight className="h-6 w-6 text-text-muted" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {artists.map((artist, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="group cursor-pointer" data-testid={`artist-card-${i}`}>
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                  <img src={artist.img} alt={artist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between">
                    <Heart className="h-4 w-4 text-white/80 group-hover:text-rose transition-colors" />
                    <div className="w-8 h-8 rounded-full bg-lime flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <Play className="h-4 w-4 text-void fill-void" />
                    </div>
                  </div>
                </div>
                <p className="text-white font-bold text-sm truncate">{artist.name}</p>
                <p className="text-text-muted text-xs">{artist.genre}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-border-subtle bg-surface/50 py-10" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: "50K+", label: t("stats_links") },
              { val: "30+", label: t("stats_countries") },
              { val: "4.9", label: t("stats_rating"), icon: Star },
              { val: "<2min", label: t("stats_delivery") },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-3xl font-heading font-black text-white flex items-center justify-center gap-1">
                  {s.val} {s.icon && <s.icon className="h-5 w-5 text-turbo fill-turbo" />}
                </div>
                <p className="text-text-muted text-sm mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 md:py-32" data-testid="how-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.2em] uppercase font-bold text-purple mb-3">{t("how_overline")}</p>
            <h2 className="text-3xl sm:text-4xl tracking-tight font-bold font-heading">{t("how_title")}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ShoppingCart, title: t("how_step1_title"), desc: t("how_step1_desc"), color: "#A238FF", step: "01" },
              { icon: CreditCard, title: t("how_step2_title"), desc: t("how_step2_desc"), color: "#F7931A", step: "02" },
              { icon: Link2, title: t("how_step3_title"), desc: t("how_step3_desc"), color: "#C2FF00", step: "03" },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative bg-surface border border-border-subtle rounded-2xl p-8 group hover:border-white/15 transition-all" data-testid={`how-step-${i + 1}`}>
                <span className="absolute top-4 end-4 font-heading font-black text-5xl text-white/[0.03]">{step.step}</span>
                <div className="w-14 h-14 rounded-xl mb-5 flex items-center justify-center" style={{ backgroundColor: `${step.color}12` }}>
                  <step.icon className="h-6 w-6" style={{ color: step.color }} />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-text-secondary text-sm font-light leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection lang={lang} />

      {/* CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden" data-testid="cta-section">
        <div className="absolute inset-0 bg-gradient-to-r from-rose/10 via-void to-purple/10" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 text-center">
          <Equalizer count={9} color="#C2FF00" height={40} />
          <h2 className="text-3xl sm:text-4xl tracking-tight font-bold font-heading mt-8 mb-4">{t("cta_title")}</h2>
          <p className="text-text-secondary font-light mb-8 max-w-md mx-auto">{t("cta_subtitle")}</p>
          <Button onClick={() => navigate("/offers")} className="btn-lime rounded-full px-10 py-6 text-base font-bold" data-testid="cta-btn">
            <Play className="h-5 w-5 fill-current me-2" /> {t("hero_cta")}
          </Button>
        </div>
      </section>
    </div>
  );
}

function FaqSection({ lang }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(-1);
  const faqs = [1, 2, 3, 4].map((i) => ({ q: t(`faq_q${i}`), a: t(`faq_a${i}`) }));

  return (
    <section className="py-24 md:py-32 border-t border-border-subtle" data-testid="faq-section">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl tracking-tight font-bold font-heading">FAQ</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-surface border border-border-subtle rounded-xl overflow-hidden" data-testid={`faq-item-${i}`}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between p-5 text-start" data-testid={`faq-toggle-${i}`}>
                <span className="text-white font-medium text-sm pe-4">{faq.q}</span>
                <ChevronRight className={`h-4 w-4 text-text-muted flex-shrink-0 transition-transform ${open === i ? "rotate-90" : ""}`} />
              </button>
              {open === i && <div className="px-5 pb-5"><p className="text-text-secondary text-sm font-light leading-relaxed">{faq.a}</p></div>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

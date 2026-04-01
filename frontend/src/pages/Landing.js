import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Equalizer } from "@/components/Equalizer";
import axios from "axios";
import { ArrowRight, Shield, Zap, Users, ChevronDown, ChevronUp, Music2, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MotionCard = ({ children, delay = 0, className = "" }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
    className={className}>{children}</motion.div>
);

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);
  const [stats, setStats] = useState({ users: 0, links: 0, orders: 0 });
  const lang = i18n.language || "en";

  useEffect(() => {
    axios.get(`${API}/stats/public`).then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const faqs = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
  ];

  const features = [
    { icon: Zap, title: t("feat_instant"), desc: t("feat_instant_desc"), color: "text-teal", bg: "bg-teal/5 border-teal/10" },
    { icon: Shield, title: t("feat_secure"), desc: t("feat_secure_desc"), color: "text-primary-light", bg: "bg-primary/5 border-primary/10" },
    { icon: Users, title: t("feat_loyalty"), desc: t("feat_loyalty_desc"), color: "text-accent-light", bg: "bg-accent/5 border-accent/10" },
  ];

  const trendingArtists = [
    { name: "Aya Nakamura", genre: "Pop/R&B" },
    { name: "Jul", genre: "Rap FR" },
    { name: "Ninho", genre: "Rap FR" },
    { name: "Dua Lipa", genre: "Pop" },
    { name: "Damso", genre: "Rap" },
    { name: "The Weeknd", genre: "R&B" },
  ];

  return (
    <section className="relative overflow-hidden" data-testid="landing-page">
      {/* ═══ HERO ═══ */}
      <div className="relative min-h-[85vh] flex items-center">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.07] blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-teal/[0.05] blur-[120px]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/[0.05] blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 text-center relative z-10">
          <MotionCard>
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-8">
              <Equalizer count={3} color="#818CF8" height={14} />
              <span className="text-xs text-text-secondary font-medium">{t("hero_badge")}</span>
            </div>
          </MotionCard>

          <MotionCard delay={0.1}>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1]">
              <span className="text-white">{t("hero_title_1")}</span>
              <br />
              <span className="gradient-text">{t("hero_title_2")}</span>
            </h1>
          </MotionCard>

          <MotionCard delay={0.2}>
            <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto mt-6 leading-relaxed">
              {t("hero_sub")}
            </p>
          </MotionCard>

          <MotionCard delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
              <Link to="/offers">
                <Button size="lg" className="btn-primary rounded-xl px-8 py-5 text-sm font-semibold gap-2 group" data-testid="hero-cta-btn">
                  {t("hero_cta")} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <p className="text-text-muted text-xs flex items-center gap-1">
                <Star className="h-3 w-3 text-teal" /> {t("hero_from")}
              </p>
            </div>
          </MotionCard>
        </div>
      </div>

      {/* ═══ TRENDING ARTISTS ═══ */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <MotionCard>
            <p className="text-text-muted text-xs text-center uppercase tracking-widest mb-6">{t("trending_title")}</p>
          </MotionCard>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {trendingArtists.map((artist, i) => (
              <MotionCard key={i} delay={i * 0.05}>
                <div className="glass-card glass-card-hover rounded-xl px-5 py-3 flex items-center gap-3 cursor-default transition-all">
                  <Music2 className="h-4 w-4 text-primary-light" />
                  <div>
                    <p className="text-sm font-medium text-white">{artist.name}</p>
                    <p className="text-[10px] text-text-muted">{artist.genre}</p>
                  </div>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ FEATURES ═══ */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <MotionCard>
            <div className="text-center mb-14">
              <h2 className="font-heading font-bold text-3xl md:text-4xl gradient-text">{t("features_title")}</h2>
              <p className="text-text-secondary text-sm mt-3 max-w-md mx-auto">{t("features_sub")}</p>
            </div>
          </MotionCard>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <MotionCard key={i} delay={i * 0.1}>
                <div className="glass-card glass-card-hover rounded-2xl p-8 h-full transition-all group">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} border flex items-center justify-center mb-5`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-white mb-2">{f.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="glass-card rounded-3xl p-10">
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                { label: t("stats_users"), val: stats.users || "1K+", color: "text-primary-light" },
                { label: t("stats_links"), val: stats.links || "5K+", color: "text-teal" },
                { label: t("stats_orders"), val: stats.orders || "2K+", color: "text-accent-light" },
              ].map((s, i) => (
                <MotionCard key={i} delay={i * 0.1}>
                  <div>
                    <p className={`font-heading font-extrabold text-3xl md:text-4xl ${s.color}`}>{s.val}</p>
                    <p className="text-text-muted text-xs mt-2 uppercase tracking-wider">{s.label}</p>
                  </div>
                </MotionCard>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FAQ ═══ */}
      <div className="py-20" id="faq">
        <div className="max-w-2xl mx-auto px-6 md:px-12">
          <MotionCard>
            <h2 className="font-heading font-bold text-3xl text-center mb-10 gradient-text">FAQ</h2>
          </MotionCard>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <MotionCard key={i} delay={i * 0.05}>
                <div className="glass-card rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-start">
                    <span className="text-sm font-medium text-white">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
                  </button>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      className="px-6 pb-4">
                      <p className="text-text-secondary text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CTA ═══ */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <MotionCard>
            <div className="glass-card rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
              <div className="relative z-10">
                <Sparkles className="h-8 w-8 text-primary-light mx-auto mb-4" />
                <h2 className="font-heading font-bold text-3xl md:text-4xl mb-3">{t("cta_title")}</h2>
                <p className="text-text-secondary text-sm mb-8 max-w-md mx-auto">{t("cta_sub")}</p>
                <Link to="/offers">
                  <Button size="lg" className="btn-primary rounded-xl px-8 py-5 text-sm font-semibold gap-2" data-testid="cta-btn">
                    {t("hero_cta")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </MotionCard>
        </div>
      </div>
    </section>
  );
}

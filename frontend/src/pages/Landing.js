import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";
import axios from "axios";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ChevronDown, Zap, Shield, Clock, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIERS = [
  { min: 1, max: 9, price: "5,00" },
  { min: 10, max: 49, price: "3,50" },
  { min: 50, max: 99, price: "3,00" },
  { min: 100, max: 199, price: "2,00" },
  { min: 200, max: 499, price: "1,80" },
  { min: 500, max: null, price: "1,50" },
];

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

function GlassCard({ children, className = "", glow = false }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`glass glass-hover rounded-2xl ${glow ? "shadow-lg shadow-accent-glow" : ""} ${className}`}>
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || "fr";
  const [packs, setPacks] = useState([]);
  const [customQty, setCustomQty] = useState(25);
  const [pricing, setPricing] = useState(null);
  const [stats, setStats] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [deezer, setDeezer] = useState({ artists: [] });

  useEffect(() => {
    axios.get(`${API}/packs`).then((r) => setPacks(r.data.packs || r.data)).catch(() => {});
    axios.get(`${API}/stats/public`).then((r) => setStats(r.data)).catch(() => {});
    axios.get(`${API}/deezer/trending`).then((r) => setDeezer(r.data)).catch(() => {});
  }, []);

  const fetchPricing = useCallback(() => {
    const timer = setTimeout(() => {
      axios.get(`${API}/pricing/calculate?quantity=${customQty}`).then((r) => setPricing(r.data)).catch(() => {});
    }, 80);
    return () => clearTimeout(timer);
  }, [customQty]);
  useEffect(fetchPricing, [fetchPricing]);

  const faqs = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
  ];

  const ordersDelivered = stats?.orders || 0;
  const scrollToPacks = () => document.getElementById("packs")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Floating orbs */}
      <div className="orb-purple" style={{ top: "-10%", right: "-10%" }} />
      <div className="orb-pink" style={{ bottom: "10%", left: "-5%" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* ═══ HERO SECTION ═══ */}
        <section className="mb-12 sm:mb-16">
          <Reveal>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-accent text-xs font-semibold tracking-wide uppercase">
                Deezer Premium
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              {lang === "fr" ? (
                <>
                  Musique illimitée<br />
                  à partir de{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                    1,50€
                  </span>
                </>
              ) : lang === "ar" ? (
                <>
                  موسيقى بلا حدود<br />
                  ابتداءً من{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                    1,50€
                  </span>
                </>
              ) : (
                <>
                  Unlimited music<br />
                  starting at{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                    1,50€
                  </span>
                </>
              )}
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-base sm:text-lg text-t-secondary max-w-2xl mb-8 leading-relaxed">
              {lang === "fr"
                ? "Accédez à Deezer Premium avec nos liens d'activation à prix dégressifs. Livraison instantanée • Paiement crypto sécurisé • Garantie 30 jours."
                : lang === "ar"
                ? "احصل على Deezer Premium بروابط التفعيل بأسعار تنازلية. توصيل فوري • دفع آمن بالعملات الرقمية."
                : "Access Deezer Premium with our volume-priced activation links. Instant delivery • Secure crypto payment • 30-day guarantee."}
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={scrollToPacks}
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-accent-glow">
                {t("hero_cta")}
                <ArrowRight className="h-5 w-5" />
              </motion.button>
              {ordersDelivered > 0 && (
                <div className="flex items-center gap-2 text-sm text-t-muted">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span>
                    {ordersDelivered.toLocaleString()}{" "}
                    {lang === "fr" ? "commandes livrées" : "orders delivered"}
                  </span>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Zap, text: lang === "fr" ? "Livraison instantanée" : "Instant delivery" },
                { icon: Shield, text: lang === "fr" ? "Paiement sécurisé" : "Secure payment" },
                { icon: Clock, text: lang === "fr" ? "Garanti 30 jours" : "30-day guarantee" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 glass rounded-lg px-4 py-2.5 text-sm text-t-secondary backdrop-blur-md">
                  <item.icon className="h-4 w-4 text-accent" />
                  {item.text}
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ═══ TRENDING ARTISTS MARQUEE ═══ */}
        {deezer.artists?.length > 0 && (
          <Reveal>
            <section className="mb-12 sm:mb-16 overflow-hidden">
              <p className="text-xs text-t-muted uppercase tracking-widest mb-4">
                {lang === "fr" ? "Tendances sur Deezer" : "Trending on Deezer"}
              </p>
              <div className="relative flex overflow-hidden">
                <div className="flex gap-4 animate-marquee whitespace-nowrap">
                  {[...deezer.artists, ...deezer.artists, ...deezer.artists].map((artist, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 glass rounded-xl px-4 py-3 backdrop-blur-md shrink-0">
                      <img
                        src={artist.picture}
                        alt={artist.name}
                        className="w-10 h-10 rounded-full object-cover"
                        loading="lazy"
                      />
                      <span className="text-sm text-t-primary font-medium whitespace-nowrap">
                        {artist.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 animate-marquee whitespace-nowrap" aria-hidden="true">
                  {[...deezer.artists, ...deezer.artists, ...deezer.artists].map((artist, i) => (
                    <div
                      key={`duplicate-${i}`}
                      className="flex items-center gap-3 glass rounded-xl px-4 py-3 backdrop-blur-md shrink-0">
                      <img
                        src={artist.picture}
                        alt={artist.name}
                        className="w-10 h-10 rounded-full object-cover"
                        loading="lazy"
                      />
                      <span className="text-sm text-t-primary font-medium whitespace-nowrap">
                        {artist.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </Reveal>
        )}

        {/* ═══ BENTO GRID - PACKS ═══ */}
        <section id="packs" className="mb-12 sm:mb-16">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {lang === "fr" ? "Nos offres" : lang === "ar" ? "عروضنا" : "Our offers"}
            </h2>
            <p className="text-sm text-t-muted mb-8">
              {lang === "fr"
                ? "Tarifs dégressifs — Plus vous achetez, moins vous payez par lien."
                : "Volume pricing — The more you buy, the less you pay per link."}
            </p>
          </Reveal>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {packs
              .filter((p) => p.id !== "custom")
              .map((pack, i) => {
                const name = t(pack.name_key);
                const hasDiscount = pack.discount > 0;
                const isPopular = pack.highlighted;
                return (
                  <Reveal key={pack.id} delay={i * 0.05}>
                    <GlassCard glow={isPopular} className="p-6 relative overflow-hidden h-full flex flex-col">
                      {isPopular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-br from-accent to-secondary text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                          {lang === "fr" ? "POPULAIRE" : "POPULAR"}
                        </div>
                      )}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-t-primary mb-1">{name}</h3>
                        <p className="text-xs text-t-muted">
                          {pack.quantity} {lang === "fr" ? (pack.quantity > 1 ? "liens" : "lien") : (pack.quantity > 1 ? "links" : "link")} • Deezer Premium
                        </p>
                      </div>

                      {hasDiscount && (
                        <div className="mb-3 inline-flex items-center gap-2">
                          <span className="text-xs text-green font-semibold bg-green-dim px-2 py-1 rounded">
                            -{pack.discount}%
                          </span>
                          <span className="text-xs text-t-muted line-through">
                            {(pack.price / (1 - pack.discount / 100)).toFixed(0)}€
                          </span>
                        </div>
                      )}

                      <div className="mt-auto pt-4 flex items-end justify-between">
                        <div>
                          <span className="text-3xl font-bold text-t-primary tabular-nums">
                            {pack.price.toFixed(0)}€
                          </span>
                          <p className="text-xs text-t-muted mt-1">
                            {pack.unit_price.toFixed(2)}€ / {lang === "fr" ? "lien" : "link"}
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/checkout/${pack.id}`)}
                          className="inline-flex items-center gap-2 px-5 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-all">
                          {lang === "fr" ? "Acheter" : "Buy"}
                          <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </GlassCard>
                  </Reveal>
                );
              })}

            {/* Custom Pack */}
            <Reveal delay={0.15}>
              <GlassCard className="p-6 h-full flex flex-col sm:col-span-2 lg:col-span-1">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-t-primary mb-1">
                    {lang === "fr" ? "Sur mesure" : "Custom"}
                  </h3>
                  <p className="text-xs text-t-muted">
                    {lang === "fr" ? "Choisis la quantité exacte" : "Pick your exact quantity"}
                  </p>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-sm text-t-muted">{lang === "fr" ? "Liens" : "Links"}</span>
                    <span className="text-2xl font-bold text-accent tabular-nums">{customQty}</span>
                  </div>
                  <Slider
                    value={[customQty]}
                    min={1}
                    max={1000}
                    step={1}
                    onValueChange={([v]) => setCustomQty(v)}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-t-muted tabular-nums">
                    <span>1</span>
                    <span>1000</span>
                  </div>
                </div>

                {pricing && (
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-t-muted">
                      {pricing.unit_price?.toFixed(2)}€ / {lang === "fr" ? "lien" : "link"}
                    </span>
                    {pricing.savings > 0 && (
                      <span className="text-green font-semibold">
                        -{pricing.savings?.toFixed(0)}€ {lang === "fr" ? "économie" : "saved"}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-4 flex items-end justify-between">
                  <span className="text-3xl font-bold text-t-primary tabular-nums">
                    {pricing ? `${pricing.total?.toFixed(0)}€` : "—"}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/checkout/custom?qty=${customQty}`)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-all">
                    {lang === "fr" ? "Acheter" : "Buy"}
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </GlassCard>
            </Reveal>
          </div>

          {/* Pricing Grid */}
          <Reveal delay={0.2}>
            <GlassCard className="overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm text-t-primary font-semibold">
                  {lang === "fr" ? "Grille tarifaire" : "Volume pricing"}
                </span>
                <span className="text-xs text-accent font-semibold bg-accent-glow px-2 py-1 rounded">
                  {lang === "fr" ? "Jusqu'à -70%" : "Up to -70%"}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-t-muted">
                    <th className="text-left font-normal px-5 py-3">
                      {lang === "fr" ? "Quantité" : "Quantity"}
                    </th>
                    <th className="text-right font-normal px-5 py-3">
                      {lang === "fr" ? "Prix / lien" : "Price / link"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map((tier, i) => {
                    const isLast = i === TIERS.length - 1;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-border last:border-0 ${
                          isLast ? "bg-green-dim" : "hover:bg-surface-hover"
                        } transition-colors`}>
                        <td className="px-5 py-3 text-t-secondary">
                          {tier.max ? `${tier.min} – ${tier.max}` : `${tier.min}+`}
                        </td>
                        <td
                          className={`px-5 py-3 text-right tabular-nums font-semibold ${
                            isLast ? "text-green" : "text-t-primary"
                          }`}>
                          {tier.price}€
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </GlassCard>
          </Reveal>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="mb-12 sm:mb-16">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">{t("how_title")}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { num: "01", title: t("how_step1_title"), desc: t("how_step1_desc") },
              { num: "02", title: t("how_step2_title"), desc: t("how_step2_desc") },
              { num: "03", title: t("how_step3_title"), desc: t("how_step3_desc") },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <GlassCard className="p-6 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 text-[120px] font-bold text-white opacity-[0.03] leading-none select-none">
                    {step.num}
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-accent bg-accent-glow w-8 h-8 rounded-lg flex items-center justify-center">
                        {step.num}
                      </span>
                      <h3 className="text-base font-semibold text-t-primary">{step.title}</h3>
                    </div>
                    <p className="text-sm text-t-secondary leading-relaxed">{step.desc}</p>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <Reveal>
          <section className="mb-12 sm:mb-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  value: ordersDelivered > 0 ? ordersDelivered.toLocaleString() : "500+",
                  label: lang === "fr" ? "Commandes" : "Orders",
                },
                {
                  value: stats?.links > 0 ? stats.links.toLocaleString() : "2,000+",
                  label: lang === "fr" ? "Liens livrés" : "Links delivered",
                },
                { value: "< 1min", label: lang === "fr" ? "Livraison" : "Delivery" },
                { value: "30j", label: lang === "fr" ? "Garantie" : "Guarantee" },
              ].map((stat, i) => (
                <GlassCard key={i} className="p-5 text-center">
                  <p className="text-2xl font-bold text-t-primary tabular-nums mb-1">{stat.value}</p>
                  <p className="text-xs text-t-muted uppercase tracking-wide">{stat.label}</p>
                </GlassCard>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ═══ FAQ ═══ */}
        <section className="mb-12 sm:mb-16">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">FAQ</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <GlassCard className="divide-y divide-border overflow-hidden">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-surface-hover transition-colors">
                    <span className="text-sm font-medium text-t-primary pr-4">{faq.q}</span>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.3 }}>
                      <ChevronDown className="h-5 w-5 text-t-muted shrink-0" />
                    </motion.div>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? "auto" : 0, opacity: openFaq === i ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden">
                    <div className="px-6 pb-5">
                      <p className="text-sm text-t-secondary leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                </div>
              ))}
            </GlassCard>
          </Reveal>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <Reveal>
          <section className="mb-12">
            <GlassCard className="p-8 sm:p-10 text-center sm:text-left sm:flex items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-t-primary mb-2">{t("cta_title")}</h3>
                <p className="text-sm text-t-secondary">{t("cta_subtitle")}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={scrollToPacks}
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-accent-glow shrink-0 mt-6 sm:mt-0">
                {t("hero_cta")}
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </GlassCard>
          </section>
        </Reveal>
      </div>
    </div>
  );
}

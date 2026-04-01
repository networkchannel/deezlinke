import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Equalizer } from "@/components/Equalizer";
import axios from "axios";
import {
  ArrowRight, Shield, Zap, Users, ChevronDown, ChevronUp, Music2, Sparkles,
  Star, Play, Heart, SkipForward, Volume2, Clock, Globe, ChevronRight, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/* ── tiny helpers ── */
const formatFans = (n) => {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
};
const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* ── Animated Waveform ── */
function Waveform({ bars = 48, color = "#818CF8", active = true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !active) return;
    const els = ref.current.children;
    const id = setInterval(() => {
      for (let i = 0; i < els.length; i++) {
        const h = 8 + Math.random() * 32;
        els[i].style.height = `${h}px`;
      }
    }, 180);
    return () => clearInterval(id);
  }, [active, bars]);

  return (
    <div ref={ref} className="flex items-end gap-[1.5px] h-10 overflow-hidden">
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className="rounded-sm transition-all duration-150"
          style={{ width: 2.5, height: 8 + Math.random() * 28, background: color, opacity: 0.6 + Math.random() * 0.4 }} />
      ))}
    </div>
  );
}

/* ── Motion wrapper ── */
const MC = ({ children, delay = 0, className = "" }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
    className={className}>{children}</motion.div>
);

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);
  const [stats, setStats] = useState({ users: 0, links: 0, orders: 0 });
  const [deezer, setDeezer] = useState({ tracks: [], artists: [], albums: [] });
  const [heroTrackIdx, setHeroTrackIdx] = useState(0);
  const [liked, setLiked] = useState({});
  const lang = i18n.language || "en";

  useEffect(() => {
    axios.get(`${API}/stats/public`).then((r) => setStats(r.data)).catch(() => {});
    axios.get(`${API}/deezer/trending`).then((r) => setDeezer(r.data)).catch(() => {});
  }, []);

  // Auto-rotate hero track
  useEffect(() => {
    if (!deezer.tracks.length) return;
    const id = setInterval(() => setHeroTrackIdx((i) => (i + 1) % Math.min(deezer.tracks.length, 5)), 6000);
    return () => clearInterval(id);
  }, [deezer.tracks]);

  const heroTrack = deezer.tracks[heroTrackIdx] || null;
  const nextTracks = useMemo(() => deezer.tracks.slice(0, 5).filter((_, i) => i !== heroTrackIdx), [deezer.tracks, heroTrackIdx]);

  const faqs = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
  ];

  const features = [
    { icon: Zap, title: t("feat_instant"), desc: t("feat_instant_desc"), color: "text-teal", bg: "from-teal/20 to-teal/5", border: "border-teal/15" },
    { icon: Shield, title: t("feat_secure"), desc: t("feat_secure_desc"), color: "text-primary-light", bg: "from-primary/20 to-primary/5", border: "border-primary/15" },
    { icon: Users, title: t("feat_loyalty"), desc: t("feat_loyalty_desc"), color: "text-accent-light", bg: "from-accent/20 to-accent/5", border: "border-accent/15" },
  ];

  return (
    <section className="relative overflow-hidden" data-testid="landing-page">
      {/* ═══════════════ HERO ═══════════════ */}
      <div className="relative min-h-[90vh] flex items-center">
        {/* BG effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/[0.06]" />
          <div className="absolute top-1/3 right-1/4 w-[700px] h-[700px] rounded-full bg-primary/[0.06] blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-teal/[0.04] blur-[120px]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/[0.05] blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32 grid md:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10 w-full">
          {/* LEFT – Text */}
          <div>
            <MC>
              <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-6">
                <Equalizer count={3} color="#818CF8" height={14} />
                <span className="text-xs text-text-secondary font-medium">{t("hero_badge")}</span>
              </div>
            </MC>

            <MC delay={0.1}>
              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
                <span className="text-white">{t("hero_title_1")}</span>
                <br />
                <span className="gradient-text">{t("hero_title_2")}</span>
              </h1>
            </MC>

            <MC delay={0.15}>
              <p className="text-text-secondary text-base max-w-md mt-5 leading-relaxed">{t("hero_sub")}</p>
            </MC>

            <MC delay={0.2}>
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <Link to="/offers">
                  <Button size="lg" className="btn-primary rounded-xl px-8 py-5 text-sm font-semibold gap-2 group" data-testid="hero-cta-btn">
                    <Play className="h-4 w-4 fill-current" /> {t("hero_cta")}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-heading font-extrabold gradient-text-teal">1.50€</span>
                  <span className="text-text-muted text-xs">{t("hero_per_link")}</span>
                </div>
              </div>
            </MC>

            <MC delay={0.25}>
              <div className="flex flex-wrap gap-3 mt-8">
                {[
                  { icon: Shield, label: t("hero_secure") },
                  { icon: Zap, label: t("hero_instant") },
                  { icon: Globe, label: t("hero_crypto") },
                ].map((b, i) => (
                  <div key={i} className="glass-card rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
                    <b.icon className="h-3 w-3 text-text-muted" /> {b.label}
                  </div>
                ))}
              </div>
            </MC>
          </div>

          {/* RIGHT – Music Player Card */}
          <MC delay={0.2} className="relative">
            {heroTrack ? (
              <div className="glass-card rounded-3xl overflow-hidden relative group">
                {/* Album cover BG blur */}
                <div className="absolute inset-0 z-0">
                  <img src={heroTrack.album_cover_big || heroTrack.album_cover} alt="" className="w-full h-full object-cover opacity-15 blur-xl scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-void/95 via-void/70 to-void/30" />
                </div>

                {/* Player content */}
                <div className="relative z-10 p-6">
                  {/* Now playing header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                    <span className="text-emerald text-[10px] font-semibold uppercase tracking-widest">
                      {lang === "fr" ? "En lecture" : "Now Playing"}
                    </span>
                    <span className="text-text-muted text-[10px] ml-auto">Deezer Premium</span>
                  </div>

                  {/* Main track */}
                  <div className="flex gap-5 mb-5">
                    <AnimatePresence mode="wait">
                      <motion.div key={heroTrack.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }} className="flex-shrink-0">
                        <img src={heroTrack.album_cover_big || heroTrack.album_cover}
                          alt={heroTrack.title}
                          className="w-28 h-28 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10" />
                      </motion.div>
                    </AnimatePresence>
                    <div className="flex-1 min-w-0 py-1">
                      <AnimatePresence mode="wait">
                        <motion.div key={heroTrack.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                          <h3 className="font-heading font-bold text-lg text-white truncate">{heroTrack.title}</h3>
                          <p className="text-text-secondary text-sm truncate">{heroTrack.artist_name}</p>
                          <p className="text-text-muted text-[10px] mt-0.5 truncate">{heroTrack.album_title}</p>
                        </motion.div>
                      </AnimatePresence>
                      <div className="flex items-center gap-3 mt-3">
                        <button onClick={() => setLiked((l) => ({ ...l, [heroTrack.id]: !l[heroTrack.id] }))}
                          className="transition-colors">
                          <Heart className={`h-4 w-4 ${liked[heroTrack.id] ? "text-rose fill-rose" : "text-text-muted hover:text-rose"}`} />
                        </button>
                        <button onClick={() => setHeroTrackIdx((i) => (i + 1) % Math.min(deezer.tracks.length, 5))}
                          className="text-text-muted hover:text-white transition-colors">
                          <SkipForward className="h-4 w-4" />
                        </button>
                        <Volume2 className="h-3.5 w-3.5 text-text-muted ml-auto" />
                      </div>
                    </div>
                  </div>

                  {/* Waveform */}
                  <div className="mb-3">
                    <Waveform bars={60} color="#818CF8" />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted font-mono mb-5">
                    <span>1:42</span>
                    <span>{formatDuration(heroTrack.duration)}</span>
                  </div>

                  {/* Track list */}
                  <div className="space-y-1.5">
                    {nextTracks.map((tr, i) => (
                      <button key={tr.id} onClick={() => setHeroTrackIdx(deezer.tracks.findIndex((t) => t.id === tr.id))}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all group/track text-start">
                        <img src={tr.album_cover} alt={tr.title} className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{tr.title}</p>
                          <p className="text-[11px] text-text-muted truncate">{tr.artist_name}</p>
                        </div>
                        <Play className="h-3.5 w-3.5 text-text-muted group-hover/track:text-primary-light transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Skeleton */
              <div className="glass-card rounded-3xl p-6 space-y-4 animate-pulse">
                <div className="flex gap-4"><div className="w-28 h-28 rounded-2xl bg-white/5" /><div className="flex-1 space-y-3 py-2"><div className="h-5 w-3/4 bg-white/5 rounded" /><div className="h-3 w-1/2 bg-white/5 rounded" /></div></div>
                <div className="h-10 bg-white/5 rounded" />
                {[1, 2, 3].map((i) => <div key={i} className="flex gap-3 items-center"><div className="w-10 h-10 rounded-lg bg-white/5" /><div className="flex-1 space-y-1.5"><div className="h-3 w-2/3 bg-white/5 rounded" /><div className="h-2 w-1/3 bg-white/5 rounded" /></div></div>)}
              </div>
            )}
          </MC>
        </div>
      </div>

      {/* ═══════════════ TRENDING ARTISTS ═══════════════ */}
      {deezer.artists.length > 0 && (
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <MC>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-primary-light text-[10px] uppercase tracking-[0.2em] font-semibold mb-2">{t("trending_title")}</p>
                  <h2 className="font-heading font-bold text-2xl md:text-3xl text-white">{t("artists_title")}</h2>
                </div>
                <Equalizer count={5} color="#818CF8" height={20} />
              </div>
            </MC>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {deezer.artists.map((artist, i) => (
                <MC key={artist.id} delay={i * 0.04}>
                  <div className="glass-card glass-card-hover rounded-2xl p-4 text-center group transition-all cursor-default">
                    <div className="relative mx-auto w-20 h-20 mb-3">
                      <img src={artist.picture || artist.picture_big} alt={artist.name}
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-primary/30 transition-all shadow-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <Play className="h-2.5 w-2.5 text-white fill-white" />
                      </div>
                    </div>
                    <p className="font-medium text-sm text-white truncate">{artist.name}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{formatFans(artist.nb_fan)} fans</p>
                  </div>
                </MC>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TOP ALBUMS CAROUSEL ═══════════════ */}
      {deezer.albums.length > 0 && (
        <div className="py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <MC>
              <div className="flex items-center gap-3 mb-8">
                <Music2 className="h-5 w-5 text-teal" />
                <h2 className="font-heading font-bold text-xl md:text-2xl text-white">
                  {lang === "fr" ? "Albums Tendance" : lang === "ar" ? "ألبومات رائجة" : "Trending Albums"}
                </h2>
              </div>
            </MC>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
              {deezer.albums.map((album, i) => (
                <MC key={album.id} delay={i * 0.05}>
                  <div className="flex-shrink-0 w-44 group cursor-default">
                    <div className="relative overflow-hidden rounded-2xl mb-3 ring-1 ring-white/5 group-hover:ring-primary/20 transition-all">
                      <img src={album.cover_big || album.cover} alt={album.title}
                        className="w-44 h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          <Play className="h-4 w-4 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-white truncate">{album.title}</p>
                    <p className="text-[11px] text-text-muted truncate">{album.artist_name}</p>
                  </div>
                </MC>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ FEATURES ═══════════════ */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <MC>
            <div className="text-center mb-14">
              <h2 className="font-heading font-bold text-3xl md:text-4xl gradient-text">{t("features_title")}</h2>
              <p className="text-text-secondary text-sm mt-3 max-w-md mx-auto">{t("features_sub")}</p>
            </div>
          </MC>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <MC key={i} delay={i * 0.1}>
                <div className="glass-card glass-card-hover rounded-2xl p-8 h-full transition-all group relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.bg} border ${f.border} flex items-center justify-center mb-5`}>
                      <f.icon className={`h-5 w-5 ${f.color}`} />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-white mb-2">{f.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </MC>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <div className="py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <MC>
            <p className="text-primary-light text-[10px] uppercase tracking-[0.2em] font-semibold text-center mb-2">{t("how_overline")}</p>
            <h2 className="font-heading font-bold text-3xl text-center mb-12 gradient-text">{t("how_title")}</h2>
          </MC>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", title: t("how_step1_title"), desc: t("how_step1_desc"), icon: Music2, color: "text-primary-light" },
              { num: "02", title: t("how_step2_title"), desc: t("how_step2_desc"), icon: Shield, color: "text-teal" },
              { num: "03", title: t("how_step3_title"), desc: t("how_step3_desc"), icon: Zap, color: "text-emerald" },
            ].map((step, i) => (
              <MC key={i} delay={i * 0.1}>
                <div className="relative">
                  <span className="font-heading font-extrabold text-5xl text-white/[0.03] absolute -top-6 -left-2">{step.num}</span>
                  <div className="relative z-10 glass-card rounded-2xl p-6">
                    <step.icon className={`h-6 w-6 ${step.color} mb-4`} />
                    <h3 className="font-heading font-semibold text-base text-white mb-2">{step.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                  </div>
                  {i < 2 && <ChevronRight className="hidden md:block absolute top-1/2 -right-5 h-5 w-5 text-text-muted/30" />}
                </div>
              </MC>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ STATS ═══════════════ */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="glass-card rounded-3xl p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-teal/5" />
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: t("stats_users"), val: stats.users || "1K+", icon: Users, color: "text-primary-light" },
                { label: t("stats_links"), val: stats.links || "5K+", icon: Music2, color: "text-teal" },
                { label: t("stats_orders"), val: stats.orders || "2K+", icon: Star, color: "text-accent-light" },
                { label: t("stats_delivery"), val: "< 1min", icon: Clock, color: "text-emerald" },
              ].map((s, i) => (
                <MC key={i} delay={i * 0.08}>
                  <div>
                    <s.icon className={`h-5 w-5 ${s.color} mx-auto mb-2`} />
                    <p className={`font-heading font-extrabold text-2xl md:text-3xl ${s.color}`}>{s.val}</p>
                    <p className="text-text-muted text-[10px] mt-1.5 uppercase tracking-wider">{s.label}</p>
                  </div>
                </MC>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ PRICING PREVIEW ═══════════════ */}
      <div className="py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <MC>
            <div className="glass-card rounded-3xl p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <Award className="h-6 w-6 text-teal mb-3" />
                  <h3 className="font-heading font-bold text-xl md:text-2xl text-white mb-2">
                    {lang === "fr" ? "Prix degressifs" : "Volume Pricing"}
                  </h3>
                  <p className="text-text-secondary text-sm mb-4">
                    {lang === "fr" ? "Plus vous achetez, moins vous payez. Jusqu'a 70% d'economie." : "The more you buy, the less you pay. Up to 70% savings."}
                  </p>
                  <Link to="/offers">
                    <Button className="btn-teal rounded-xl px-6 py-3 text-sm font-semibold gap-2">
                      {t("hero_cta")} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2 flex-shrink-0">
                  {[
                    { range: "1-9", price: "5.00€" },
                    { range: "10-49", price: "3.50€" },
                    { range: "50-99", price: "3.00€" },
                    { range: "100+", price: "2.00€" },
                    { range: "250+", price: "1.80€" },
                    { range: "500+", price: "1.50€", highlight: true },
                  ].map((t, i) => (
                    <div key={i} className={`rounded-xl px-4 py-3 text-center ${t.highlight ? "bg-teal/10 border border-teal/20" : "glass-card"}`}>
                      <p className="text-text-muted text-[10px]">{t.range}</p>
                      <p className={`font-heading font-bold text-sm ${t.highlight ? "text-teal" : "text-white"}`}>{t.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </MC>
        </div>
      </div>

      {/* ═══════════════ FAQ ═══════════════ */}
      <div className="py-20" id="faq">
        <div className="max-w-2xl mx-auto px-6 md:px-12">
          <MC>
            <h2 className="font-heading font-bold text-3xl text-center mb-10 gradient-text">FAQ</h2>
          </MC>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <MC key={i} delay={i * 0.05}>
                <div className="glass-card rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-start">
                    <span className="text-sm font-medium text-white">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="h-4 w-4 text-text-muted flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-text-muted flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-6 pb-4">
                      <p className="text-text-secondary text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              </MC>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ CTA ═══════════════ */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <MC>
            <div className="glass-card rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/[0.06]" />
              <div className="relative z-10">
                <Sparkles className="h-8 w-8 text-primary-light mx-auto mb-4" />
                <h2 className="font-heading font-bold text-3xl md:text-4xl mb-3">{t("cta_title")}</h2>
                <p className="text-text-secondary text-sm mb-8 max-w-md mx-auto">{t("cta_subtitle")}</p>
                <Link to="/offers">
                  <Button size="lg" className="btn-primary rounded-xl px-8 py-5 text-sm font-semibold gap-2" data-testid="cta-btn">
                    <Play className="h-4 w-4 fill-current" /> {t("hero_cta")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </MC>
        </div>
      </div>
    </section>
  );
}

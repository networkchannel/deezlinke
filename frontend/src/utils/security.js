import CryptoJS from 'crypto-js';

// ═══════════════════════════════════════════════════════════
// FINGERPRINT BROWSER ULTRA-SÉCURISÉ
// ═══════════════════════════════════════════════════════════

const generateCanvasFingerprint = () => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const txt = 'DeezLink.Security.2026';
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText(txt, 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText(txt, 4, 17);
    return canvas.toDataURL();
  } catch {
    return 'canvas_blocked';
  }
};

const getWebGLFingerprint = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no_webgl';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'no_renderer';
  } catch {
    return 'webgl_error';
  }
};

const getAudioFingerprint = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return 'no_audio';
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
    
    gainNode.gain.value = 0;
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(0);
    
    const buffer = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(buffer);
    
    oscillator.stop();
    context.close();
    
    return buffer.slice(0, 30).join(',');
  } catch {
    return 'audio_error';
  }
};

const getFontsFingerprint = () => {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Impact'
  ];
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const text = 'mmmmmmmmmmlli';
  
  const baseSizes = {};
  baseFonts.forEach(font => {
    ctx.font = `72px ${font}`;
    baseSizes[font] = ctx.measureText(text).width;
  });
  
  const detected = [];
  testFonts.forEach(font => {
    baseFonts.forEach(baseFont => {
      ctx.font = `72px ${font}, ${baseFont}`;
      const width = ctx.measureText(text).width;
      if (width !== baseSizes[baseFont]) {
        detected.push(font);
      }
    });
  });
  
  return [...new Set(detected)].sort().join(',');
};

export const generateBrowserFingerprint = () => {
  const nav = navigator;
  const screen = window.screen;
  
  const data = {
    // Hardware
    cores: nav.hardwareConcurrency || 0,
    memory: nav.deviceMemory || 0,
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    availScreen: `${screen.availWidth}x${screen.availHeight}`,
    pixelRatio: window.devicePixelRatio || 1,
    
    // Browser
    userAgent: nav.userAgent,
    language: nav.language || nav.userLanguage,
    languages: (nav.languages || []).join(','),
    platform: nav.platform,
    vendor: nav.vendor,
    
    // Timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // Features
    cookies: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack || 'unspecified',
    touchSupport: nav.maxTouchPoints || 0,
    
    // Advanced fingerprints
    canvas: generateCanvasFingerprint(),
    webgl: getWebGLFingerprint(),
    audio: getAudioFingerprint(),
    fonts: getFontsFingerprint(),
    
    // Plugins (deprecated but still useful)
    plugins: Array.from(nav.plugins || [])
      .map(p => p.name)
      .sort()
      .join(','),
    
    // Storage
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    indexedDB: !!window.indexedDB,
  };
  
  // Hash final
  const fingerprintString = JSON.stringify(data);
  const hash = CryptoJS.SHA256(fingerprintString).toString();
  
  return {
    fingerprint: hash,
    raw: data,
    timestamp: Date.now()
  };
};

// ═══════════════════════════════════════════════════════════
// TOKEN ROTATIF (30s)
// ═══════════════════════════════════════════════════════════

let currentToken = null;
let tokenExpiry = 0;

const generateSecureToken = (fingerprint) => {
  const timestamp = Date.now();
  const random = CryptoJS.lib.WordArray.random(32).toString();
  const payload = `${fingerprint}:${timestamp}:${random}`;
  return CryptoJS.SHA256(payload).toString();
};

export const getSecurityToken = () => {
  const now = Date.now();
  
  // Renouveler si expiré ou inexistant
  if (!currentToken || now >= tokenExpiry) {
    const fp = generateBrowserFingerprint();
    currentToken = generateSecureToken(fp.fingerprint);
    tokenExpiry = now + 30000; // 30 secondes
    
    // Stocker le fingerprint en session (pas le token!)
    sessionStorage.setItem('_fp', fp.fingerprint);
  }
  
  return {
    token: currentToken,
    expiry: tokenExpiry
  };
};

// ═══════════════════════════════════════════════════════════
// COOKIE SÉCURISÉ
// ═══════════════════════════════════════════════════════════

export const getSecurityCookie = () => {
  const cookieName = '_dlsec';
  let cookie = getCookie(cookieName);
  
  if (!cookie) {
    const fp = generateBrowserFingerprint();
    cookie = CryptoJS.SHA256(`${fp.fingerprint}:${Date.now()}`).toString();
    setCookie(cookieName, cookie, 365); // 1 an
  }
  
  return cookie;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const setCookie = (name, value, days) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict; Secure`;
};

// ═══════════════════════════════════════════════════════════
// PAYLOAD OBFUSQUÉ POUR REQUÊTES
// ═══════════════════════════════════════════════════════════

export const buildSecurePayload = (data) => {
  const fp = sessionStorage.getItem('_fp') || generateBrowserFingerprint().fingerprint;
  const { token } = getSecurityToken();
  const cookie = getSecurityCookie();
  
  const telemetry = {
    ts: Date.now(),
    fp: fp,
    tk: token,
    ck: cookie,
    seq: parseInt(sessionStorage.getItem('_seq') || '0', 10) + 1,
    nonce: CryptoJS.lib.WordArray.random(16).toString()
  };
  
  sessionStorage.setItem('_seq', telemetry.seq.toString());
  
  // Obfuscation simple du payload
  const obfuscated = {
    _d: CryptoJS.AES.encrypt(JSON.stringify(data), token).toString(),
    _t: telemetry
  };
  
  return obfuscated;
};

// ═══════════════════════════════════════════════════════════
// INIT AU CHARGEMENT
// ═══════════════════════════════════════════════════════════

export const initSecurity = () => {
  // Générer fingerprint initial
  const fp = generateBrowserFingerprint();
  sessionStorage.setItem('_fp', fp.fingerprint);
  sessionStorage.setItem('_seq', '0');
  
  // Générer cookie sécurisé
  getSecurityCookie();
  
  // Générer premier token
  getSecurityToken();
  
  console.log('🔒 Security initialized:', fp.fingerprint.slice(0, 16) + '...');
};

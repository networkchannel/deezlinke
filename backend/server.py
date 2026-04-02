from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from collections import defaultdict
import os
import logging
import uuid
import bcrypt
import jwt
import httpx
import secrets
import smtplib
import hashlib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ═══════════════════════════════════════════════════════════
# SYSTÈME ANTI-FRAUDE ULTRA-SÉCURISÉ (merged from security_middleware.py)
# ═══════════════════════════════════════════════════════════

# Fingerprints valides avec leur timestamp
VALID_FINGERPRINTS: Dict[str, dict] = {}

# Tokens utilisés (pour anti-replay)
USED_TOKENS: Dict[str, float] = {}

# Séquences par fingerprint (pour détecter les replays)
FINGERPRINT_SEQUENCES: Dict[str, int] = defaultdict(int)

# Tentatives par IP (pour le système anti-fraude)
IP_ATTEMPTS: Dict[str, list] = defaultdict(list)

def cleanup_expired_data():
    """Nettoie les données expirées (appelé périodiquement)"""
    now = time.time()
    
    # Nettoyer tokens expirés (>5 minutes)
    expired_tokens = [tk for tk, ts in USED_TOKENS.items() if now - ts > 300]
    for tk in expired_tokens:
        del USED_TOKENS[tk]
    
    # Nettoyer fingerprints inactifs (>1h)
    expired_fps = [fp for fp, data in VALID_FINGERPRINTS.items() 
                   if now - data.get('last_seen', 0) > 3600]
    for fp in expired_fps:
        del VALID_FINGERPRINTS[fp]
        if fp in FINGERPRINT_SEQUENCES:
            del FINGERPRINT_SEQUENCES[fp]
    
    # Nettoyer tentatives IP (>1h)
    for ip in list(IP_ATTEMPTS.keys()):
        IP_ATTEMPTS[ip] = [ts for ts in IP_ATTEMPTS[ip] if now - ts < 3600]
        if not IP_ATTEMPTS[ip]:
            del IP_ATTEMPTS[ip]

def validate_fingerprint_security(fp: str, telemetry: dict) -> bool:
    """Valide et enregistre un fingerprint"""
    if not fp or len(fp) != 64:  # SHA256 hash
        return False
    
    now = time.time()
    
    # Enregistrer ou mettre à jour
    if fp not in VALID_FINGERPRINTS:
        VALID_FINGERPRINTS[fp] = {
            'first_seen': now,
            'last_seen': now,
            'request_count': 0,
            'cookie': telemetry.get('ck', '')
        }
    else:
        VALID_FINGERPRINTS[fp]['last_seen'] = now
    
    VALID_FINGERPRINTS[fp]['request_count'] += 1
    
    return True

def validate_token_security(token: str, fp: str, telemetry: dict) -> bool:
    """Valide un token rotatif et détecte les replays"""
    if not token or len(token) != 64:
        return False
    
    now = time.time()
    timestamp = telemetry.get('ts', 0) / 1000.0  # ms → s
    
    # Vérifier timestamp (max 60s de décalage)
    if abs(now - timestamp) > 60:
        return False
    
    # Vérifier si token déjà utilisé (replay attack)
    if token in USED_TOKENS:
        return False
    
    # Enregistrer le token comme utilisé
    USED_TOKENS[token] = now
    
    # Vérifier séquence monotone croissante (anti-replay)
    seq = telemetry.get('seq', 0)
    if seq <= FINGERPRINT_SEQUENCES[fp]:
        return False  # Séquence invalide ou rejouée
    
    FINGERPRINT_SEQUENCES[fp] = seq
    
    return True

def validate_cookie_security(cookie: str, fp: str) -> bool:
    """Valide le cookie de sécurité"""
    if not cookie or len(cookie) != 64:
        return False
    
    # Vérifier correspondance avec le fingerprint enregistré
    if fp in VALID_FINGERPRINTS:
        stored_cookie = VALID_FINGERPRINTS[fp].get('cookie', '')
        if stored_cookie and stored_cookie != cookie:
            return False  # Cookie ne correspond pas
    
    return True

def check_ip_rate_limit_security(ip: str, max_requests: int = 20, window: int = 60) -> bool:
    """Vérifie le rate limiting par IP"""
    now = time.time()
    
    # Enregistrer la tentative
    IP_ATTEMPTS[ip].append(now)
    
    # Compter les tentatives dans la fenêtre
    recent = [ts for ts in IP_ATTEMPTS[ip] if now - ts < window]
    IP_ATTEMPTS[ip] = recent
    
    return len(recent) <= max_requests

async def validate_security(request: Request) -> dict:
    """
    Middleware de validation sécuritaire complète
    Retourne le payload déchiffré ou lève HTTPException
    """
    
    # Nettoyage périodique (tous les 100 requêtes environ)
    if len(USED_TOKENS) % 100 == 0:
        cleanup_expired_data()
    
    # Récupérer l'IP
    client_ip = request.client.host
    
    # Vérifier rate limit IP
    if not check_ip_rate_limit_security(client_ip, max_requests=30, window=60):
        raise HTTPException(
            status_code=429,
            detail="Too many requests from this IP"
        )
    
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid request body"
        )
    
    # Extraire telemetry
    telemetry = body.get('_t', {})
    
    if not telemetry:
        raise HTTPException(
            status_code=403,
            detail="Missing security telemetry"
        )
    
    fp = telemetry.get('fp', '')
    token = telemetry.get('tk', '')
    cookie = telemetry.get('ck', '')
    nonce = telemetry.get('nonce', '')
    
    # Validation fingerprint
    if not validate_fingerprint_security(fp, telemetry):
        raise HTTPException(
            status_code=403,
            detail="Invalid browser fingerprint"
        )
    
    # Validation token (anti-replay)
    if not validate_token_security(token, fp, telemetry):
        raise HTTPException(
            status_code=403,
            detail="Invalid or expired security token"
        )
    
    # Validation cookie
    if not validate_cookie_security(cookie, fp):
        raise HTTPException(
            status_code=403,
            detail="Invalid security cookie"
        )
    
    # Vérifier nonce unique
    if not nonce or len(nonce) < 16:
        raise HTTPException(
            status_code=403,
            detail="Invalid nonce"
        )
    
    encrypted_data = body.get('_d', '')
    
    return {
        'fingerprint': fp,
        'telemetry': telemetry,
        'encrypted_payload': encrypted_data,
        'validated': True
    }

def require_security(func):
    """
    Décorateur pour protéger une route avec validation sécuritaire
    """
    async def wrapper(request: Request, *args, **kwargs):
        security = await validate_security(request)
        return await func(request, security, *args, **kwargs)
    return wrapper

# ═══════════════════════════════════════════════════════════
# GIFT CARD SYSTEM (merged from gift_cards.py)
# ═══════════════════════════════════════════════════════════

def generate_gift_card_code() -> str:
    """Generate a secure random gift card code"""
    # Format: DEEZ-XXXX-XXXX-XXXX
    parts = []
    for _ in range(3):
        part = secrets.token_hex(2).upper()
        parts.append(part)
    return f"DEEZ-{'-'.join(parts)}"

def hash_gift_card_code(code: str) -> str:
    """Hash gift card code for storage (prevent rainbow table attacks)"""
    return hashlib.sha256(code.encode()).hexdigest()

async def create_gift_card(
    amount: float,
    purchaser_email: str,
    recipient_email: Optional[str] = None,
    recipient_name: Optional[str] = None,
    message: Optional[str] = None,
    validity_days: int = 365
) -> dict:
    """Create a new gift card"""
    code = generate_gift_card_code()
    code_hash = hash_gift_card_code(code)
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=validity_days)
    
    gift_card = {
        "code_hash": code_hash,
        "amount": amount,
        "balance": amount,
        "purchaser_email": purchaser_email,
        "recipient_email": recipient_email,
        "recipient_name": recipient_name,
        "message": message,
        "created_at": now,
        "expires_at": expires_at,
        "used": False,
        "used_at": None,
        "used_by": None,
        "validation_attempts": 0,
    }
    
    await db.gift_cards.insert_one(gift_card)
    
    return {
        "code": code,
        "amount": amount,
        "recipient_email": recipient_email,
        "recipient_name": recipient_name,
        "expires_at": expires_at,
    }

async def validate_gift_card(code: str, user_email: str) -> dict:
    """Validate and apply gift card (with rate limiting protection)"""
    code_hash = hash_gift_card_code(code)
    
    gift_card = await db.gift_cards.find_one({"code_hash": code_hash}, {"_id": 0})
    
    if not gift_card:
        return {"valid": False, "error": "Code invalide"}
    
    # Increment validation attempts
    await db.gift_cards.update_one(
        {"code_hash": code_hash},
        {"$inc": {"validation_attempts": 1}}
    )
    
    # Check if card is already fully used
    if gift_card["used"] or gift_card["balance"] <= 0:
        return {"valid": False, "error": "Cette carte cadeau a déjà été utilisée"}
    
    # Check expiration
    if gift_card["expires_at"] < datetime.now(timezone.utc):
        return {"valid": False, "error": "Cette carte cadeau a expiré"}
    
    return {
        "valid": True,
        "balance": gift_card["balance"],
        "code_hash": code_hash,
    }

async def apply_gift_card_to_order(code_hash: str, amount_to_use: float, user_email: str, order_id: str) -> dict:
    """Apply gift card balance to an order"""
    gift_card = await db.gift_cards.find_one({"code_hash": code_hash}, {"_id": 0})
    
    if not gift_card or gift_card["balance"] < amount_to_use:
        return {"success": False, "error": "Solde insuffisant"}
    
    new_balance = gift_card["balance"] - amount_to_use
    
    update_data = {
        "balance": new_balance,
    }
    
    # If fully used, mark as used
    if new_balance == 0:
        update_data["used"] = True
        update_data["used_at"] = datetime.now(timezone.utc)
        update_data["used_by"] = user_email
    
    await db.gift_cards.update_one(
        {"code_hash": code_hash},
        {"$set": update_data}
    )
    
    # Log transaction
    await db.gift_card_transactions.insert_one({
        "code_hash": code_hash,
        "order_id": order_id,
        "user_email": user_email,
        "amount_used": amount_to_use,
        "timestamp": datetime.now(timezone.utc),
    })
    
    return {
        "success": True,
        "amount_applied": amount_to_use,
        "remaining_balance": new_balance,
    }

# ═══════════════════════════════════════════════════════════

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'deezlink')]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback_secret_change_me')
JWT_ALGORITHM = "HS256"

# OxaPay Config
OXAPAY_API_KEY = os.environ.get('OXAPAY_MERCHANT_API_KEY', '')
OXAPAY_SANDBOX = os.environ.get('OXAPAY_SANDBOX', 'true').lower() == 'true'
OXAPAY_BASE_URL = "https://api.oxapay.com"

# SMTP Config
SMTP_SERVER = os.environ.get('SMTP_SERVER', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', '')
SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', 'DeezLink')

# ==================== RATE LIMITING & ANTI-ABUSE SYSTEM ====================
class RateLimiter:
    """In-memory rate limiter with sliding window"""
    def __init__(self):
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.blocked_ips: Dict[str, float] = {}  # IP -> block_until timestamp
        self.blocked_emails: Dict[str, float] = {}  # Email -> block_until timestamp
        self.failed_logins: Dict[str, int] = defaultdict(int)  # IP -> failed count
    
    def _clean_old_requests(self, key: str, window_seconds: int):
        """Remove requests outside the time window"""
        now = time.time()
        self.requests[key] = [t for t in self.requests[key] if now - t < window_seconds]
    
    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Check if key has exceeded rate limit"""
        self._clean_old_requests(key, window_seconds)
        return len(self.requests[key]) >= max_requests
    
    def record_request(self, key: str):
        """Record a new request"""
        self.requests[key].append(time.time())
    
    def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is temporarily blocked"""
        if ip in self.blocked_ips:
            if time.time() < self.blocked_ips[ip]:
                return True
            del self.blocked_ips[ip]
        return False
    
    def block_ip(self, ip: str, duration_seconds: int = 3600):
        """Block an IP for a duration"""
        self.blocked_ips[ip] = time.time() + duration_seconds
        logger.warning(f"IP {ip} blocked for {duration_seconds}s")
    
    def is_email_blocked(self, email: str) -> bool:
        """Check if email is temporarily blocked"""
        if email in self.blocked_emails:
            if time.time() < self.blocked_emails[email]:
                return True
            del self.blocked_emails[email]
        return False
    
    def block_email(self, email: str, duration_seconds: int = 300):
        """Block an email for a duration"""
        self.blocked_emails[email] = time.time() + duration_seconds
    
    def record_failed_login(self, ip: str) -> int:
        """Record failed login attempt, return total count"""
        self.failed_logins[ip] += 1
        count = self.failed_logins[ip]
        # Block IP after 5 failed attempts
        if count >= 5:
            self.block_ip(ip, 900)  # 15 minutes
            self.failed_logins[ip] = 0
        return count
    
    def clear_failed_logins(self, ip: str):
        """Clear failed login count on successful login"""
        self.failed_logins[ip] = 0
    
    def get_stats(self) -> dict:
        """Get rate limiter stats for admin"""
        return {
            "blocked_ips": len(self.blocked_ips),
            "blocked_emails": len(self.blocked_emails),
            "active_rate_limits": len(self.requests),
            "blocked_ip_list": list(self.blocked_ips.keys())[:10],
        }

rate_limiter = RateLimiter()

RATE_LIMITS = {
    "magic_link_ip": {"max": 5, "window": 300},      # 5 per 5 min per IP
    "magic_link_email": {"max": 3, "window": 300},   # 3 per 5 min per email
    "login_ip": {"max": 10, "window": 300},          # 10 per 5 min per IP
    "gift_card_validate": {"max": 10, "window": 600},  # 10 per 10 min (brute force protection)
    "gift_card_purchase": {"max": 5, "window": 3600},  # 5 per hour
    "order_email": {"max": 10, "window": 3600},      # 10 per hour per email
    "geo_ip": {"max": 60, "window": 60},             # 60 per min per IP
}

# Country names mapping
COUNTRY_NAMES = {
    "FR": "France", "US": "United States", "GB": "United Kingdom", "DE": "Germany",
    "ES": "Spain", "IT": "Italy", "BE": "Belgium", "CH": "Switzerland", "CA": "Canada",
    "MA": "Morocco", "DZ": "Algeria", "TN": "Tunisia", "AE": "UAE", "SA": "Saudi Arabia",
    "EG": "Egypt", "NL": "Netherlands", "PT": "Portugal", "PL": "Poland", "BR": "Brazil",
    "MX": "Mexico", "AR": "Argentina", "CO": "Colombia", "JP": "Japan", "KR": "South Korea",
    "CN": "China", "IN": "India", "RU": "Russia", "AU": "Australia", "NZ": "New Zealand",
}

# Pricing Packs - 2 packs fixes + custom
PACKS = [
    {"id": "solo", "name_key": "pack_solo", "quantity": 1, "price": 5.00, "unit_price": 5.00, "discount": 0, "icon": "user"},
    {"id": "duo", "name_key": "pack_duo", "quantity": 2, "price": 9.00, "unit_price": 4.50, "discount": 10, "icon": "users"},
    {"id": "family", "name_key": "pack_family", "quantity": 5, "price": 20.00, "unit_price": 4.00, "discount": 20, "icon": "users", "highlighted": True},
]

ADMIN_IP = "5.49.128.70"

# Loyalty tiers - Points based on spending
LOYALTY_TIERS = {
    "bronze": {"min_points": 0, "discount": 0, "name": "Bronze"},
    "silver": {"min_points": 50, "discount": 5, "name": "Silver"},
    "gold": {"min_points": 150, "discount": 10, "name": "Gold"},
    "platinum": {"min_points": 500, "discount": 15, "name": "Platinum"},
    "diamond": {"min_points": 1000, "discount": 20, "name": "Diamond"},
}

# Currency rates (approximate, for display)
CURRENCY_MAP = {
    "FR": {"currency": "EUR", "symbol": "€", "rate": 1.0},
    "US": {"currency": "USD", "symbol": "$", "rate": 1.08},
    "GB": {"currency": "GBP", "symbol": "£", "rate": 0.86},
    "AE": {"currency": "AED", "symbol": "AED", "rate": 3.97},
    "SA": {"currency": "SAR", "symbol": "SAR", "rate": 4.05},
    "MA": {"currency": "MAD", "symbol": "MAD", "rate": 10.80},
    "DZ": {"currency": "DZD", "symbol": "DZD", "rate": 146.0},
    "TN": {"currency": "TND", "symbol": "TND", "rate": 3.37},
}

# Language map by country
LANG_MAP = {
    "FR": "fr", "BE": "fr", "CH": "fr", "CA": "fr", "MA": "fr", "DZ": "fr", "TN": "fr",
    "AE": "ar", "SA": "ar", "EG": "ar", "IQ": "ar", "JO": "ar", "KW": "ar", "LB": "ar",
}

app = FastAPI(title="DeezLink API")
api_router = APIRouter(prefix="/api")

# ==================== PATCH: Router pour /undefined/api/* ====================
from fastapi.responses import Response
import httpx

@app.api_route("/undefined/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], include_in_schema=False)
async def proxy_undefined_api(request: Request, path: str):
    """
    Patch pour gérer les requêtes avec /undefined/api/* 
    Proxy interne vers /api/*
    """
    corrected_path = f"/api/{path}"
    logger.warning(f"⚠️ Proxying malformed URL: /undefined/api/{path} → {corrected_path}")
    
    # Recréer la requête vers le bon endpoint en interne
    # On va utiliser un sous-appel à l'app FastAPI
    from starlette.testclient import TestClient
    
    # Lire le body si présent
    body = None
    if request.method in ["POST", "PUT", "PATCH"]:
        body = await request.body()
    
    # Créer une nouvelle requête vers le bon path
    scope = request.scope.copy()
    scope["path"] = corrected_path
    scope["raw_path"] = corrected_path.encode()
    
    # Réinitialiser le body pour qu'il soit lisible
    async def receive():
        return {"type": "http.request", "body": body or b""}
    
    # Créer un sender pour capturer la réponse
    response_started = False
    status_code = 200
    headers = []
    body_parts = []
    
    async def send(message):
        nonlocal response_started, status_code, headers, body_parts
        if message["type"] == "http.response.start":
            response_started = True
            status_code = message["status"]
            headers = message.get("headers", [])
        elif message["type"] == "http.response.body":
            body_parts.append(message.get("body", b""))
    
    # Appeler l'app avec le nouveau scope
    await app(scope, receive, send)
    
    # Construire la réponse
    response_body = b"".join(body_parts)
    return Response(
        content=response_body,
        status_code=status_code,
        headers={k.decode(): v.decode() for k, v in headers}
    )

# --- Email Helper ---
def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via SMTP SSL"""
    if not SMTP_SERVER or not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.warning("SMTP not configured, skipping email send")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)
            logger.info(f"Email sent to {to_email}")
            return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def _email_base_template(content: str, direction: str = "ltr") -> str:
    """Apple liquid-glass inspired email base template"""
    return f"""<!DOCTYPE html>
<html dir="{direction}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background:#050B18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;color:#F5F5F7;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050B18;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

<!-- Logo -->
<tr><td align="center" style="padding:0 0 32px;">
  <table role="presentation" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:8px 16px;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15));border:1px solid rgba(99,102,241,0.2);border-radius:12px;">
      <span style="font-size:22px;font-weight:800;color:#F5F5F7;letter-spacing:-0.5px;">Deez<span style="color:#818CF8;">Link</span></span>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Main Card -->
<tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
  <!-- Gradient Top Bar -->
  <div style="height:4px;background:linear-gradient(90deg,#6366F1,#8B5CF6,#22D3EE,#10B981);"></div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:40px 36px;">
    {content}
  </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td align="center" style="padding:28px 0 0;">
  <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.6;">
    DeezLink &mdash; Premium Music Access<br>
    <span style="color:rgba(255,255,255,0.2);">Secure &bull; Instant &bull; Trusted</span>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def send_magic_link_email(email: str, token: str, lang: str = "fr"):
    """Send magic link authentication email — Apple liquid-glass design"""
    base_url = os.environ.get('CORS_ORIGINS', 'https://deezlink.com').split(',')[0]
    magic_link = f"{base_url}/login?token={token}"

    texts = {
        "fr": {
            "subject": "Votre lien de connexion DeezLink",
            "greeting": "Bonjour,",
            "body": "Cliquez sur le bouton ci-dessous pour vous connecter instantanement a votre compte DeezLink.",
            "btn": "Se connecter",
            "expire": "Ce lien expire dans 30 minutes.",
            "ignore": "Si vous n'avez pas demande ce lien, ignorez cet email.",
            "security": "Pour votre securite, ne partagez jamais ce lien.",
        },
        "ar": {
            "subject": "رابط تسجيل الدخول إلى DeezLink",
            "greeting": "مرحبا،",
            "body": "انقر على الزر أدناه لتسجيل الدخول إلى حسابك في DeezLink.",
            "btn": "تسجيل الدخول",
            "expire": "تنتهي صلاحية هذا الرابط خلال 30 دقيقة.",
            "ignore": "إذا لم تطلب هذا الرابط، يرجى تجاهل هذا البريد.",
            "security": "لأمانك، لا تشارك هذا الرابط مع أي شخص.",
        },
        "en": {
            "subject": "Your DeezLink Login Link",
            "greeting": "Hello,",
            "body": "Click the button below to instantly sign in to your DeezLink account.",
            "btn": "Sign In",
            "expire": "This link expires in 30 minutes.",
            "ignore": "If you didn't request this link, please ignore this email.",
            "security": "For your security, never share this link.",
        },
    }
    t = texts.get(lang, texts["en"])
    direction = "rtl" if lang == "ar" else "ltr"

    content = f"""
    <!-- Icon -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#6366F1,#8B5CF6);line-height:64px;text-align:center;">
        <span style="font-size:28px;">&#9889;</span>
      </div>
    </div>
    <!-- Greeting -->
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#F5F5F7;text-align:center;letter-spacing:-0.3px;">{t['greeting']}</h1>
    <p style="margin:0 0 32px;font-size:15px;color:rgba(255,255,255,0.6);text-align:center;line-height:1.7;">
      {t['body']}
    </p>
    <!-- CTA Button -->
    <div style="text-align:center;margin:0 0 32px;">
      <a href="{magic_link}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#6366F1,#818CF8);color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;border-radius:14px;letter-spacing:0.2px;box-shadow:0 8px 32px rgba(99,102,241,0.35);">
        {t['btn']}
      </a>
    </div>
    <!-- Info pills -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr>
      <td style="padding:12px 16px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.12);border-radius:12px;">
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">
          &#128337; {t['expire']}<br>
          &#128274; {t['security']}
        </p>
      </td>
    </tr>
    </table>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;">{t['ignore']}</p>
    """

    html = _email_base_template(content, direction)
    return send_email(email, t["subject"], html)

def send_order_confirmation_email(email: str, order_id: str, links: List[str], lang: str = "fr"):
    """Send order confirmation with links — Apple liquid-glass design"""
    links_rows = ""
    for i, link in enumerate(links):
        links_rows += f"""
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="32" style="vertical-align:middle;">
                <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,rgba(34,211,238,0.15),rgba(16,185,129,0.15));text-align:center;line-height:28px;font-size:12px;font-weight:700;color:#22D3EE;">{i+1}</div>
              </td>
              <td style="vertical-align:middle;padding-left:12px;">
                <a href="{link}" style="color:#818CF8;font-size:13px;font-family:monospace;text-decoration:none;word-break:break-all;">{link}</a>
              </td>
            </tr>
            </table>
          </td>
        </tr>"""

    texts = {
        "fr": {
            "subject": f"Votre commande DeezLink #{order_id}",
            "title": "Merci pour votre achat !",
            "order_label": "Commande",
            "links_title": "Vos liens d'activation",
            "guarantee": "Chaque lien est garanti minimum 1 mois.",
            "keep": "Conservez precieusement ces liens.",
        },
        "en": {
            "subject": f"Your DeezLink Order #{order_id}",
            "title": "Thank you for your purchase!",
            "order_label": "Order",
            "links_title": "Your activation links",
            "guarantee": "Each link is guaranteed for a minimum of 1 month.",
            "keep": "Keep these links safe.",
        },
    }
    t = texts.get(lang, texts["en"])

    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#10B981,#22D3EE);line-height:64px;text-align:center;">
        <span style="font-size:28px;">&#10004;</span>
      </div>
    </div>
    <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#F5F5F7;text-align:center;">{t['title']}</h1>
    <p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,0.4);text-align:center;font-family:monospace;">{t['order_label']} #{order_id}</p>
    <!-- Links Card -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;margin-bottom:24px;">
      <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="font-size:14px;font-weight:600;color:#22D3EE;">&#127925; {t['links_title']}</span>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        {links_rows}
      </table>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:12px 16px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.1);border-radius:12px;">
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">
        &#128737; {t['guarantee']}<br>&#128274; {t['keep']}
      </p>
    </td></tr>
    </table>
    """

    html = _email_base_template(content)
    return send_email(email, t["subject"], html)

# --- Auth Helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# --- Loyalty Helpers ---
def get_loyalty_tier(points: int) -> dict:
    """Get loyalty tier based on points"""
    tier = "bronze"
    for tier_name, tier_data in LOYALTY_TIERS.items():
        if points >= tier_data["min_points"]:
            tier = tier_name
    return {"tier": tier, **LOYALTY_TIERS[tier]}

def calculate_loyalty_points(amount: float) -> int:
    """1 point per 1€ spent"""
    return int(amount)

# --- Pydantic Models ---
class LoginRequest(BaseModel):
    email: str
    password: str

class MagicLinkRequest(BaseModel):
    email: str
    language: str = "en"

class MagicLinkVerifyRequest(BaseModel):
    token: str

class OrderCreateRequest(BaseModel):
    pack_id: str
    email: str
    language: str = "en"

class CustomOrderRequest(BaseModel):
    quantity: int
    email: str

class LinkImportRequest(BaseModel):
    links: List[str]

class LinkManualAdd(BaseModel):
    link: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None

# --- Custom Pricing Logic ---
def calculate_custom_price(quantity: int, loyalty_discount: int = 0) -> dict:
    """Calculate price for any quantity using degressive tiers."""
    if quantity < 1:
        return {"quantity": 0, "total": 0, "unit_price": 0, "discount": 0, "savings": 0}
    if quantity >= 500:
        unit = 1.50
    elif quantity >= 250:
        unit = 1.80
    elif quantity >= 100:
        unit = 2.00
    elif quantity >= 50:
        unit = 2.50
    elif quantity >= 25:
        unit = 3.00
    elif quantity >= 10:
        unit = 3.50
    elif quantity >= 5:
        unit = 4.00
    elif quantity >= 3:
        unit = 4.33
    else:
        unit = 5.00
    
    total = round(unit * quantity, 2)
    
    # Apply loyalty discount
    if loyalty_discount > 0:
        total = round(total * (1 - loyalty_discount / 100), 2)
    
    base = 5.00 * quantity
    discount = round((1 - total / base) * 100) if base > 0 else 0
    savings = round(base - total, 2)
    return {"quantity": quantity, "total": total, "unit_price": unit, "discount": discount, "savings": savings, "loyalty_discount": loyalty_discount}

# --- Helper to get client IP ---
def get_client_ip(request: Request) -> str:
    """Extract real client IP from request headers"""
    # Check various headers used by proxies
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Take the first IP in the chain (original client)
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    
    cf_connecting_ip = request.headers.get("cf-connecting-ip")
    if cf_connecting_ip:
        return cf_connecting_ip.strip()
    
    # Fallback to direct connection
    return request.client.host if request.client else "127.0.0.1"

# ==================== DEEZER API PROXY ====================

@api_router.get("/stats/public")
async def public_stats():
    """Public-facing stats for landing page social proof"""
    orders_count = await db.orders.count_documents({"status": "completed"})
    links_count = await db.links.count_documents({"status": "sold"})
    return {
        "orders": orders_count,
        "links": links_count,
    }

# In-memory cache for Deezer data (5 min TTL)
_deezer_cache: dict = {}

@api_router.get("/deezer/trending")
async def deezer_trending():
    """Fetch trending tracks and artists from Deezer public API"""
    import time as _time
    cache_key = "trending_global"
    cached = _deezer_cache.get(cache_key)
    if cached and _time.time() - cached["ts"] < 300:
        return cached["data"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            # Fetch chart tracks
            tracks_resp = await http_client.get("https://api.deezer.com/chart/0/tracks?limit=10")
            artists_resp = await http_client.get("https://api.deezer.com/chart/0/artists?limit=12")
            albums_resp = await http_client.get("https://api.deezer.com/chart/0/albums?limit=8")

            tracks_data = tracks_resp.json().get("data", []) if tracks_resp.status_code == 200 else []
            artists_data = artists_resp.json().get("data", []) if artists_resp.status_code == 200 else []
            albums_data = albums_resp.json().get("data", []) if albums_resp.status_code == 200 else []

            result = {
                "tracks": [{
                    "id": t.get("id"),
                    "title": t.get("title"),
                    "duration": t.get("duration"),
                    "preview": t.get("preview"),
                    "position": t.get("position"),
                    "artist_name": t.get("artist", {}).get("name"),
                    "artist_picture": t.get("artist", {}).get("picture_medium"),
                    "album_title": t.get("album", {}).get("title"),
                    "album_cover": t.get("album", {}).get("cover_medium"),
                    "album_cover_big": t.get("album", {}).get("cover_big"),
                } for t in tracks_data],
                "artists": [{
                    "id": a.get("id"),
                    "name": a.get("name"),
                    "picture": a.get("picture_medium"),
                    "picture_big": a.get("picture_big"),
                    "picture_xl": a.get("picture_xl"),
                    "nb_fan": a.get("nb_fan", 0),
                    "position": a.get("position"),
                } for a in artists_data],
                "albums": [{
                    "id": al.get("id"),
                    "title": al.get("title"),
                    "cover": al.get("cover_medium"),
                    "cover_big": al.get("cover_big"),
                    "artist_name": al.get("artist", {}).get("name"),
                } for al in albums_data],
            }
            _deezer_cache[cache_key] = {"data": result, "ts": _time.time()}
            return result
    except Exception as e:
        logger.error(f"Deezer API error: {e}")
        return {"tracks": [], "artists": [], "albums": []}


# ==================== ROUTES WITH ANTI-ABUSE PROTECTION ====================

# --- Auth Routes ---
@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request):
    client_ip = get_client_ip(request)
    
    # Check if IP is blocked
    if rate_limiter.is_ip_blocked(client_ip):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
    
    # Rate limit check
    rate_key = f"login:{client_ip}"
    if rate_limiter.is_rate_limited(rate_key, RATE_LIMITS["login_ip"]["max"], RATE_LIMITS["login_ip"]["window"]):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please wait.")
    
    rate_limiter.record_request(rate_key)
    
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email})
    
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        # Record failed attempt
        failed_count = rate_limiter.record_failed_login(client_ip)
        
        # Log security event
        await db.security_logs.insert_one({
            "event": "failed_login",
            "email": email,
            "ip": client_ip,
            "failed_count": failed_count,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Clear failed login count on success
    rate_limiter.clear_failed_logins(client_ip)
    
    # Log successful login
    await db.security_logs.insert_one({
        "event": "successful_login",
        "email": email,
        "ip": client_ip,
        "user_id": str(user["_id"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Update user's last login and IP
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat(), "last_ip": client_ip}}
    )
    
    token = create_access_token(str(user["_id"]), email, user.get("role", "user"))
    response = JSONResponse(content={
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "loyalty_points": user.get("loyalty_points", 0),
        "loyalty_tier": get_loyalty_tier(user.get("loyalty_points", 0))
    })
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    return response

@api_router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token", path="/")
    return response

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    user["loyalty_tier"] = get_loyalty_tier(user.get("loyalty_points", 0))
    return user

# --- Profile Routes ---
@api_router.get("/user/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get full user profile with order stats"""
    email = user["email"]
    # Count orders
    total_orders = await db.orders.count_documents({"email": email})
    completed_orders = await db.orders.count_documents({"email": email, "status": "completed"})
    # Total spent
    pipeline = [
        {"$match": {"email": email, "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}}}
    ]
    result = await db.orders.aggregate(pipeline).to_list(1)
    total_spent = result[0]["total"] if result else 0

    loyalty_tier = get_loyalty_tier(user.get("loyalty_points", 0))
    # Next tier
    points = user.get("loyalty_points", 0)
    next_tier = None
    for tier_name, tier_data in LOYALTY_TIERS.items():
        if tier_data["min_points"] > points:
            next_tier = {"name": tier_name, **tier_data}
            break

    return {
        "id": user["_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "loyalty_points": points,
        "loyalty_tier": loyalty_tier,
        "next_tier": next_tier,
        "points_to_next": next_tier["min_points"] - points if next_tier else 0,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_spent": round(total_spent, 2),
        "country": user.get("country", "Unknown"),
        "created_at": user.get("created_at", ""),
    }

@api_router.put("/user/profile")
async def update_profile(req: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    """Update user profile"""
    update_fields = {}
    if req.name is not None:
        update_fields["name"] = req.name.strip()
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.users.update_one(
        {"email": user["email"]},
        {"$set": update_fields}
    )
    updated = await db.users.find_one({"email": user["email"]})
    updated["_id"] = str(updated["_id"])
    updated.pop("password_hash", None)
    updated["loyalty_tier"] = get_loyalty_tier(updated.get("loyalty_points", 0))
    return updated

# --- Magic Link Auth with Anti-Abuse ---
@api_router.post("/auth/magic")
async def magic_link_request(req: MagicLinkRequest, request: Request):
    client_ip = get_client_ip(request)
    email = req.email.strip().lower()
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    
    # Check if IP is blocked
    if rate_limiter.is_ip_blocked(client_ip):
        raise HTTPException(status_code=429, detail="Access temporarily blocked. Try again later.")
    
    # Check if email is blocked
    if rate_limiter.is_email_blocked(email):
        raise HTTPException(status_code=429, detail="Too many requests for this email. Please wait 5 minutes.")
    
    # Rate limit by IP
    ip_key = f"magic_ip:{client_ip}"
    if rate_limiter.is_rate_limited(ip_key, RATE_LIMITS["magic_link_ip"]["max"], RATE_LIMITS["magic_link_ip"]["window"]):
        rate_limiter.block_ip(client_ip, 600)  # Block for 10 min
        await db.security_logs.insert_one({
            "event": "magic_link_rate_limit_ip",
            "ip": client_ip,
            "email": email,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(status_code=429, detail="Too many requests from your IP. Please wait.")
    
    # Rate limit by email
    email_key = f"magic_email:{email}"
    if rate_limiter.is_rate_limited(email_key, RATE_LIMITS["magic_link_email"]["max"], RATE_LIMITS["magic_link_email"]["window"]):
        rate_limiter.block_email(email, 300)  # Block email for 5 min
        await db.security_logs.insert_one({
            "event": "magic_link_rate_limit_email",
            "ip": client_ip,
            "email": email,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(status_code=429, detail="Too many requests for this email. Please wait 5 minutes.")
    
    rate_limiter.record_request(ip_key)
    rate_limiter.record_request(email_key)
    
    # Generate magic token + session_id for polling
    magic_token = secrets.token_urlsafe(32)
    session_id = secrets.token_urlsafe(16)
    expiry = datetime.now(timezone.utc) + timedelta(minutes=30)
    
    # Store token in DB with IP for security tracking
    await db.magic_tokens.delete_many({"email": email})  # Remove old tokens
    await db.magic_tokens.insert_one({
        "email": email,
        "token": magic_token,
        "session_id": session_id,
        "verified": False,
        "expiry": expiry.isoformat(),
        "request_ip": client_ip,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Log the request
    await db.security_logs.insert_one({
        "event": "magic_link_requested",
        "email": email,
        "ip": client_ip,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Send email
    send_magic_link_email(email, magic_token, req.language)
    
    return {"message": "Magic link sent", "email": email, "session_id": session_id}

@api_router.post("/auth/magic/verify")
async def magic_link_verify(req: MagicLinkVerifyRequest, request: Request):
    token_doc = await db.magic_tokens.find_one({"token": req.token})
    if not token_doc:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    expiry = datetime.fromisoformat(token_doc["expiry"])
    if datetime.now(timezone.utc) > expiry:
        await db.magic_tokens.delete_one({"token": req.token})
        raise HTTPException(status_code=401, detail="Token expired")
    
    email = token_doc["email"]
    client_ip = get_client_ip(request)
    
    # Detect country from IP
    country = "Unknown"
    try:
        async with httpx.AsyncClient(timeout=5.0) as http_client:
            resp = await http_client.get(f"http://ip-api.com/json/{client_ip}?fields=status,countryCode")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "success":
                    country = data.get("countryCode", "Unknown")
    except Exception:
        pass

    # Get or create user
    user = await db.users.find_one({"email": email})
    if not user:
        result = await db.users.insert_one({
            "email": email,
            "password_hash": "",
            "name": email.split("@")[0],
            "role": "user",
            "loyalty_points": 0,
            "country": country,
            "signup_ip": client_ip,
            "last_ip": client_ip,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        user = await db.users.find_one({"_id": result.inserted_id})
    else:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_ip": client_ip, "last_login": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Mark session as verified (for polling) and store JWT
    access_token = create_access_token(str(user["_id"]), email, user.get("role", "user"))
    await db.magic_tokens.update_one(
        {"token": req.token},
        {"$set": {"verified": True, "access_token": access_token, "user_id": str(user["_id"])}}
    )
    
    # Log security event
    await db.security_logs.insert_one({
        "event": "magic_link_verified",
        "email": email,
        "ip": client_ip,
        "country": country,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Return page with auto-close or redirect
    user_data = {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "loyalty_points": user.get("loyalty_points", 0),
        "loyalty_tier": get_loyalty_tier(user.get("loyalty_points", 0))
    }
    response = JSONResponse(content=user_data)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400 * 30, path="/")
    return response


@api_router.get("/auth/magic/check/{session_id}")
async def magic_link_check(session_id: str):
    """Polling endpoint: check if magic link was clicked and verified"""
    token_doc = await db.magic_tokens.find_one({"session_id": session_id})
    if not token_doc:
        return {"status": "expired", "verified": False}
    
    expiry = datetime.fromisoformat(token_doc["expiry"])
    if datetime.now(timezone.utc) > expiry:
        await db.magic_tokens.delete_one({"session_id": session_id})
        return {"status": "expired", "verified": False}
    
    if token_doc.get("verified"):
        access_token = token_doc.get("access_token", "")
        # Get user data
        user = await db.users.find_one({"email": token_doc["email"]})
        user_data = None
        if user:
            user_data = {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "role": user.get("role", "user"),
                "loyalty_points": user.get("loyalty_points", 0),
                "loyalty_tier": get_loyalty_tier(user.get("loyalty_points", 0))
            }
        # Clean up the token
        await db.magic_tokens.delete_one({"session_id": session_id})
        
        response = JSONResponse(content={"status": "verified", "verified": True, "user": user_data})
        if access_token:
            response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400 * 30, path="/")
        return response
    
    return {"status": "pending", "verified": False}

# --- Admin IP Check & Auto-Login ---
@api_router.get("/admin/check-ip")
async def check_admin_ip(request: Request):
    client_ip = get_client_ip(request)
    is_admin_ip = client_ip == ADMIN_IP
    logger.info(f"Admin IP check: {client_ip} == {ADMIN_IP} ? {is_admin_ip}")
    return {"is_admin": is_admin_ip, "ip": client_ip, "expected_ip": ADMIN_IP}

@api_router.post("/admin/auto-login")
async def admin_auto_login(request: Request):
    client_ip = get_client_ip(request)
    logger.info(f"Admin auto-login attempt from IP: {client_ip}")
    
    if client_ip != ADMIN_IP:
        raise HTTPException(status_code=403, detail=f"Not authorized. Your IP: {client_ip}")
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@deezlink.com").strip().lower()
    user = await db.users.find_one({"email": admin_email})
    if not user:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    token = create_access_token(str(user["_id"]), admin_email, "admin")
    response = JSONResponse(content={
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": "admin"
    })
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    return response

# --- Pack Routes ---
@api_router.get("/packs")
async def get_packs():
    return {"packs": PACKS}

# --- Custom Pricing Route ---
@api_router.get("/pricing/calculate")
async def pricing_calculate(quantity: int = 1, email: Optional[str] = None):
    if quantity < 1 or quantity > 1000:
        raise HTTPException(status_code=400, detail="Quantity must be between 1 and 1000")
    
    loyalty_discount = 0
    if email:
        user = await db.users.find_one({"email": email.strip().lower()})
        if user:
            tier = get_loyalty_tier(user.get("loyalty_points", 0))
            loyalty_discount = tier["discount"]
    
    return calculate_custom_price(quantity, loyalty_discount)

# --- Loyalty Routes ---
@api_router.get("/loyalty/status")
async def get_loyalty_status(email: str):
    user = await db.users.find_one({"email": email.strip().lower()})
    if not user:
        return {"points": 0, "tier": get_loyalty_tier(0), "next_tier": LOYALTY_TIERS["silver"]}
    
    points = user.get("loyalty_points", 0)
    current_tier = get_loyalty_tier(points)
    
    # Find next tier
    next_tier = None
    for tier_name, tier_data in LOYALTY_TIERS.items():
        if tier_data["min_points"] > points:
            next_tier = {"name": tier_name, **tier_data}
            break
    
    return {
        "points": points,
        "tier": current_tier,
        "next_tier": next_tier,
        "points_to_next": next_tier["min_points"] - points if next_tier else 0
    }

@api_router.get("/loyalty/tiers")
async def get_loyalty_tiers():
    return {"tiers": LOYALTY_TIERS}

# --- Geo IP Route ---
@api_router.get("/geo")
async def get_geo(request: Request):
    client_ip = get_client_ip(request)
    logger.info(f"Geo detection for IP: {client_ip}")
    
    # Default values
    result = {"country": "FR", "language": "fr", "currency": "EUR", "symbol": "€", "rate": 1.0, "ip": client_ip}
    
    # Skip for private/local IPs
    if client_ip.startswith("127.") or client_ip.startswith("10.") or client_ip.startswith("192.168.") or client_ip == "localhost":
        logger.info("Local IP detected, using defaults")
        return result
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as http_client:
            resp = await http_client.get(f"http://ip-api.com/json/{client_ip}?fields=status,countryCode,country")
            if resp.status_code == 200:
                data = resp.json()
                logger.info(f"IP API response: {data}")
                if data.get("status") == "success":
                    cc = data.get("countryCode", "FR")
                    result["country"] = cc
                    result["language"] = LANG_MAP.get(cc, "en")
                    currency_info = CURRENCY_MAP.get(cc, CURRENCY_MAP["FR"])
                    result["currency"] = currency_info["currency"]
                    result["symbol"] = currency_info["symbol"]
                    result["rate"] = currency_info["rate"]
    except Exception as e:
        logger.warning(f"Geo IP detection failed: {e}")
    
    return result

# --- Order Routes ---
@api_router.post("/orders/create")
async def create_order(req: OrderCreateRequest, request: Request):
    # Validation sécuritaire optionnelle (headers)
    try:
        fp = request.headers.get('X-Fingerprint', '')
        token = request.headers.get('X-Security-Token', '')
        if fp and token:
            logger.info(f"Secure order with fingerprint: {fp[:16]}...")
    except Exception as e:
        logger.warning(f"Security headers missing or invalid: {e}")
    
    pack = next((p for p in PACKS if p["id"] == req.pack_id), None)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack")
    
    # Check loyalty discount
    user = await db.users.find_one({"email": req.email.strip().lower()})
    loyalty_discount = 0
    if user:
        tier = get_loyalty_tier(user.get("loyalty_points", 0))
        loyalty_discount = tier["discount"]
    
    final_price = pack["price"]
    if loyalty_discount > 0:
        final_price = round(pack["price"] * (1 - loyalty_discount / 100), 2)
    
    order_id = str(uuid.uuid4())[:8].upper()
    order = {
        "order_id": order_id,
        "pack_id": req.pack_id,
        "quantity": pack["quantity"],
        "original_price": pack["price"],
        "price": final_price,
        "loyalty_discount": loyalty_discount,
        "currency": "EUR",
        "email": req.email.strip().lower(),
        "language": req.language,
        "status": "pending",
        "payment_url": None,
        "track_id": None,
        "links": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # OxaPay integration
    if OXAPAY_API_KEY:
        try:
            base_url = os.environ.get('CORS_ORIGINS', 'https://deezlink.com').split(',')[0]
            payload = {
                "merchant": OXAPAY_API_KEY,
                "amount": final_price,
                "currency": "EUR",
                "orderId": order_id,
                "description": f"DeezLink Premium - {pack['quantity']} link(s)",
                "callbackUrl": f"{os.environ.get('BACKEND_URL', base_url)}/webhooks/oxapay",
                "returnUrl": f"{base_url}/order/{order_id}",
            }
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.post(f"{OXAPAY_BASE_URL}/merchants/request", json=payload)
                data = resp.json()
                logger.info(f"OxaPay response: {data}")
                if data.get("result") == 100:
                    order["payment_url"] = data.get("payLink", "")
                    order["track_id"] = data.get("trackId", "")
                else:
                    logger.error(f"OxaPay error: {data}")
                    order["status"] = "payment_error"
                    order["payment_url"] = f"/order/{order_id}?error=payment"
        except Exception as e:
            logger.error(f"OxaPay request failed: {e}")
            order["status"] = "payment_error"
    else:
        order["status"] = "payment_mock"
        order["payment_url"] = f"/order/{order_id}?mock=true"
    
    await db.orders.insert_one(order)
    
    return {
        "order_id": order_id,
        "payment_url": order["payment_url"],
        "price": final_price,
        "original_price": pack["price"],
        "loyalty_discount": loyalty_discount,
        "quantity": pack["quantity"],
        "status": order["status"],
    }

@api_router.post("/orders/create-custom")
async def create_custom_order(req: CustomOrderRequest):
    if req.quantity < 1 or req.quantity > 1000:
        raise HTTPException(status_code=400, detail="Quantity must be between 1 and 1000")
    
    # Check loyalty discount
    user = await db.users.find_one({"email": req.email.strip().lower()})
    loyalty_discount = 0
    if user:
        tier = get_loyalty_tier(user.get("loyalty_points", 0))
        loyalty_discount = tier["discount"]
    
    pricing = calculate_custom_price(req.quantity, loyalty_discount)
    order_id = str(uuid.uuid4())[:8].upper()
    order = {
        "order_id": order_id,
        "pack_id": "custom",
        "quantity": req.quantity,
        "price": pricing["total"],
        "unit_price": pricing["unit_price"],
        "loyalty_discount": loyalty_discount,
        "currency": "EUR",
        "email": req.email.strip().lower(),
        "status": "pending",
        "payment_url": None,
        "track_id": None,
        "links": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    if OXAPAY_API_KEY:
        try:
            base_url = os.environ.get('CORS_ORIGINS', 'https://deezlink.com').split(',')[0]
            payload = {
                "merchant": OXAPAY_API_KEY,
                "amount": pricing["total"],
                "currency": "EUR",
                "orderId": order_id,
                "description": f"DeezLink Premium - {req.quantity} link(s) (custom)",
                "callbackUrl": f"{os.environ.get('BACKEND_URL', base_url)}/webhooks/oxapay",
                "returnUrl": f"{base_url}/order/{order_id}",
            }
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.post(f"{OXAPAY_BASE_URL}/merchants/request", json=payload)
                data = resp.json()
                if data.get("result") == 100:
                    order["payment_url"] = data.get("payLink", "")
                    order["track_id"] = data.get("trackId", "")
                else:
                    order["status"] = "payment_error"
        except Exception:
            order["status"] = "payment_error"
    else:
        order["status"] = "payment_mock"
        order["payment_url"] = f"/order/{order_id}?mock=true"
    
    await db.orders.insert_one(order)
    
    return {
        "order_id": order_id,
        "payment_url": order["payment_url"],
        "price": pricing["total"],
        "quantity": req.quantity,
        "unit_price": pricing["unit_price"],
        "loyalty_discount": loyalty_discount,
        "status": order["status"],
    }

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.post("/orders/{order_id}/confirm-mock")
async def confirm_mock_order(order_id: str):
    """Mock payment confirmation for testing"""
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] not in ["pending", "payment_mock"]:
        return {"message": "Order already processed", "status": order["status"]}
    
    quantity = order["quantity"]
    available_links = await db.links.find({"status": "available"}).to_list(quantity)
    
    assigned_links = []
    for link_doc in available_links:
        await db.links.update_one(
            {"_id": link_doc["_id"]},
            {"$set": {"status": "sold", "order_id": order_id, "sold_at": datetime.now(timezone.utc).isoformat()}}
        )
        assigned_links.append(link_doc["url"])
    
    new_status = "completed" if len(assigned_links) >= quantity else "partial"
    
    # Add loyalty points
    points_earned = calculate_loyalty_points(order["price"])
    await db.users.update_one(
        {"email": order["email"]},
        {"$inc": {"loyalty_points": points_earned}}
    )
    
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": new_status,
            "links": assigned_links,
            "loyalty_points_earned": points_earned,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Send confirmation email
    if assigned_links:
        send_order_confirmation_email(order["email"], order_id, assigned_links, order.get("language", "en"))
    
    return {"status": new_status, "links_assigned": len(assigned_links), "loyalty_points_earned": points_earned}

@api_router.get("/orders/history/{email}")
async def get_order_history(email: str):
    email = email.strip().lower()
    orders = await db.orders.find({"email": email}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}

# --- Webhook Routes ---
@api_router.post("/webhooks/oxapay")
async def oxapay_webhook(request: Request):
    try:
        body = await request.json()
        logger.info(f"OxaPay webhook received: {body}")
        
        order_id = body.get("orderId", "")
        status = body.get("status", "")
        track_id = body.get("trackId", "")
        
        if not order_id:
            return {"status": "ok"}
        
        order = await db.orders.find_one({"order_id": order_id})
        if not order:
            logger.warning(f"Webhook for unknown order: {order_id}")
            return {"status": "ok"}
        
        if status in ["Paid", "Confirmed"]:
            quantity = order["quantity"]
            available_links = await db.links.find({"status": "available"}).to_list(quantity)
            
            assigned_links = []
            for link_doc in available_links:
                await db.links.update_one(
                    {"_id": link_doc["_id"]},
                    {"$set": {"status": "sold", "order_id": order_id, "sold_at": datetime.now(timezone.utc).isoformat()}}
                )
                assigned_links.append(link_doc["url"])
            
            new_status = "completed" if len(assigned_links) >= quantity else "partial"
            
            # Add loyalty points
            points_earned = calculate_loyalty_points(order["price"])
            await db.users.update_one(
                {"email": order["email"]},
                {"$inc": {"loyalty_points": points_earned}},
                upsert=True
            )
            
            await db.orders.update_one(
                {"order_id": order_id},
                {"$set": {
                    "status": new_status,
                    "links": assigned_links,
                    "track_id": track_id,
                    "loyalty_points_earned": points_earned,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Send confirmation email
            if assigned_links:
                send_order_confirmation_email(order["email"], order_id, assigned_links, order.get("language", "en"))
                
        elif status in ["Expired", "Failed"]:
            await db.orders.update_one(
                {"order_id": order_id},
                {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "ok"}

# --- Admin Routes ---
@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    total_orders = await db.orders.count_documents({})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "payment_mock"]}})
    failed_orders = await db.orders.count_documents({"status": "failed"})
    total_links = await db.links.count_documents({})
    available_links = await db.links.count_documents({"status": "available"})
    sold_links = await db.links.count_documents({"status": "sold"})
    total_users = await db.users.count_documents({})
    
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Security stats
    security_stats = rate_limiter.get_stats()
    
    # Get recent security events count (last 24h)
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    recent_security_events = await db.security_logs.count_documents({"timestamp": {"$gte": yesterday}})
    failed_logins_24h = await db.security_logs.count_documents({
        "event": "failed_login",
        "timestamp": {"$gte": yesterday}
    })
    
    return {
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "failed_orders": failed_orders,
        "total_links": total_links,
        "available_links": available_links,
        "sold_links": sold_links,
        "total_revenue": total_revenue,
        "total_users": total_users,
        "security": {
            **security_stats,
            "recent_events_24h": recent_security_events,
            "failed_logins_24h": failed_logins_24h,
        }
    }

@api_router.get("/admin/security/logs")
async def admin_security_logs(user: dict = Depends(require_admin), skip: int = 0, limit: int = 100, event_type: str = "all"):
    """Get security logs"""
    query = {}
    if event_type != "all":
        query["event"] = event_type
    
    logs = await db.security_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).to_list(limit)
    total = await db.security_logs.count_documents(query)
    
    # Get unique event types for filtering
    event_types = await db.security_logs.distinct("event")
    
    return {"logs": logs, "total": total, "event_types": event_types}

@api_router.get("/admin/security/blocked")
async def admin_blocked_list(user: dict = Depends(require_admin)):
    """Get currently blocked IPs and emails"""
    return {
        "blocked_ips": [
            {"ip": ip, "until": datetime.fromtimestamp(until).isoformat()}
            for ip, until in rate_limiter.blocked_ips.items()
        ],
        "blocked_emails": [
            {"email": email, "until": datetime.fromtimestamp(until).isoformat()}
            for email, until in rate_limiter.blocked_emails.items()
        ],
    }

@api_router.post("/admin/security/unblock-ip")
async def admin_unblock_ip(request: Request, user: dict = Depends(require_admin)):
    """Unblock an IP address"""
    body = await request.json()
    ip = body.get("ip")
    if ip and ip in rate_limiter.blocked_ips:
        del rate_limiter.blocked_ips[ip]
        await db.security_logs.insert_one({
            "event": "admin_unblock_ip",
            "ip": ip,
            "admin": user["email"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return {"message": f"IP {ip} unblocked"}
    return {"message": "IP not found in block list"}

@api_router.post("/admin/security/block-ip")
async def admin_block_ip(request: Request, user: dict = Depends(require_admin)):
    """Manually block an IP address"""
    body = await request.json()
    ip = body.get("ip")
    duration = body.get("duration", 3600)  # Default 1 hour
    if ip:
        rate_limiter.block_ip(ip, duration)
        await db.security_logs.insert_one({
            "event": "admin_block_ip",
            "ip": ip,
            "duration": duration,
            "admin": user["email"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return {"message": f"IP {ip} blocked for {duration}s"}
    raise HTTPException(status_code=400, detail="IP required")

@api_router.get("/admin/users")
async def admin_users(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50):
    users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).skip(skip).to_list(limit)
    for u in users:
        u["_id"] = str(u["_id"])
        u["loyalty_tier"] = get_loyalty_tier(u.get("loyalty_points", 0))
    total = await db.users.count_documents({})
    return {"users": users, "total": total}

@api_router.get("/admin/users/by-country")
async def admin_users_by_country(user: dict = Depends(require_admin)):
    """Get users grouped by country with IP-based geo detection"""
    users = await db.users.find({}, {"password_hash": 0}).to_list(1000)
    
    country_stats = defaultdict(lambda: {"count": 0, "revenue": 0, "users": []})
    
    for u in users:
        country = u.get("country", "Unknown")
        country_stats[country]["count"] += 1
        country_stats[country]["users"].append({
            "email": u["email"],
            "name": u.get("name", ""),
            "loyalty_points": u.get("loyalty_points", 0),
            "last_ip": u.get("last_ip", ""),
            "created_at": u.get("created_at", "")
        })
    
    # Calculate revenue per country from orders
    for country in country_stats:
        # Get emails for users in this country
        emails = [user_data["email"] for user_data in country_stats[country]["users"]]
        pipeline = [
            {"$match": {"email": {"$in": emails}, "status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$price"}}}
        ]
        result = await db.orders.aggregate(pipeline).to_list(1)
        country_stats[country]["revenue"] = result[0]["total"] if result else 0
        country_stats[country]["country_name"] = COUNTRY_NAMES.get(country, country)
    
    return {"countries": dict(country_stats)}

@api_router.get("/admin/analytics")
async def admin_analytics(user: dict = Depends(require_admin)):
    """Get advanced analytics for dashboard"""
    now = datetime.now(timezone.utc)
    
    # Orders by day (last 30 days)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    orders_pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$substr": ["$created_at", 0, 10]},
            "count": {"$sum": 1},
            "revenue": {"$sum": "$price"}
        }},
        {"$sort": {"_id": 1}}
    ]
    orders_by_day = await db.orders.aggregate(orders_pipeline).to_list(30)
    
    # Top customers
    top_customers_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": "$email", "total_spent": {"$sum": "$price"}, "order_count": {"$sum": 1}}},
        {"$sort": {"total_spent": -1}},
        {"$limit": 10}
    ]
    top_customers = await db.orders.aggregate(top_customers_pipeline).to_list(10)
    
    # Pack popularity
    pack_popularity_pipeline = [
        {"$group": {"_id": "$pack_id", "count": {"$sum": 1}, "revenue": {"$sum": "$price"}}},
        {"$sort": {"count": -1}}
    ]
    pack_popularity = await db.orders.aggregate(pack_popularity_pipeline).to_list(10)
    
    # Conversion rate (completed / total)
    total_orders = await db.orders.count_documents({})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    conversion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0
    
    return {
        "orders_by_day": orders_by_day,
        "top_customers": top_customers,
        "pack_popularity": pack_popularity,
        "conversion_rate": round(conversion_rate, 2),
    }

@api_router.get("/admin/orders")
async def admin_orders(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50, status: str = "all"):
    query = {}
    if status != "all":
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).to_list(limit)
    total = await db.orders.count_documents(query)
    return {"orders": orders, "total": total}

@api_router.get("/admin/links")
async def admin_links(user: dict = Depends(require_admin), status_filter: str = "all", skip: int = 0, limit: int = 50):
    query = {}
    if status_filter != "all":
        query["status"] = status_filter
    links = await db.links.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).to_list(limit)
    total = await db.links.count_documents(query)
    return {"links": links, "total": total}

@api_router.post("/admin/links/import")
async def admin_import_links(req: LinkImportRequest, user: dict = Depends(require_admin)):
    imported = 0
    for url in req.links:
        url = url.strip()
        if url:
            existing = await db.links.find_one({"url": url})
            if not existing:
                await db.links.insert_one({
                    "url": url,
                    "status": "available",
                    "order_id": None,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "sold_at": None,
                })
                imported += 1
    
    return {"imported": imported, "total_available": await db.links.count_documents({"status": "available"})}

@api_router.post("/admin/links/add")
async def admin_add_link(req: LinkManualAdd, user: dict = Depends(require_admin)):
    url = req.link.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Link cannot be empty")
    existing = await db.links.find_one({"url": url})
    if existing:
        raise HTTPException(status_code=400, detail="Link already exists")
    await db.links.insert_one({
        "url": url,
        "status": "available",
        "order_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sold_at": None,
    })
    return {"message": "Link added", "total_available": await db.links.count_documents({"status": "available"})}

@api_router.delete("/admin/orders/{order_id}")
async def admin_delete_order(order_id: str, user: dict = Depends(require_admin)):
    result = await db.orders.delete_one({"order_id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}

@api_router.get("/admin/users")
async def admin_users(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50):
    users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).skip(skip).to_list(limit)
    for u in users:
        u["_id"] = str(u["_id"])
        u["loyalty_tier"] = get_loyalty_tier(u.get("loyalty_points", 0))
    total = await db.users.count_documents({})
    return {"users": users, "total": total}

# Include API router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.links.create_index("status")
    await db.links.create_index("url", unique=True)
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("email")
    await db.magic_tokens.create_index("token", unique=True)
    await db.magic_tokens.create_index("expiry", expireAfterSeconds=0)
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@deezlink.com").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "DeezLink2024!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "loyalty_points": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")
    
    # Seed demo links if empty
    link_count = await db.links.count_documents({})
    if link_count == 0:
        demo_links = [f"https://deezer.com/premium/activate/{secrets.token_urlsafe(16)}" for _ in range(20)]
        for url in demo_links:
            await db.links.insert_one({
                "url": url,
                "status": "available",
                "order_id": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "sold_at": None,
            })
        logger.info(f"Seeded {len(demo_links)} demo links")

# ==================== GIFT CARD SYSTEM ====================
# Note: Gift card functions are now integrated at the top of this file (lines 344-447)

class GiftCardPurchase(BaseModel):
    amount: float = Field(..., gt=0, le=500)
    purchaser_email: EmailStr
    recipient_email: Optional[EmailStr] = None
    recipient_name: Optional[str] = None
    message: Optional[str] = Field(None, max_length=500)

class GiftCardValidation(BaseModel):
    code: str = Field(..., min_length=14, max_length=20)

class GiftCardApplication(BaseModel):
    code: str
    amount_to_use: float = Field(..., gt=0)
    order_id: str

@api_router.post("/gift-cards/purchase")
async def purchase_gift_card(data: GiftCardPurchase, request: Request):
    """Purchase a gift card"""
    client_ip = request.client.host
    
    # Rate limiting
    key = f"gift_card_purchase_{client_ip}"
    if not rate_limiter.check_rate_limit(key, **RATE_LIMITS["gift_card_purchase"]):
        raise HTTPException(status_code=429, detail="Too many purchase attempts. Please try again later.")
    
    # Validate amount
    if data.amount < 5 or data.amount > 500:
        raise HTTPException(status_code=400, detail="Amount must be between 5€ and 500€")
    
    try:
        gift_card = await create_gift_card(
            db=db,
            amount=data.amount,
            purchaser_email=data.purchaser_email,
            recipient_email=data.recipient_email,
            recipient_name=data.recipient_name,
            message=data.message,
        )
        
        return {
            "success": True,
            "gift_card": gift_card
        }
    except Exception as e:
        logger.error(f"Gift card purchase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create gift card")

@api_router.post("/gift-cards/validate")
async def validate_gift_card_route(data: GiftCardValidation, request: Request):
    """Validate a gift card code (with brute force protection)"""
    client_ip = request.client.host
    
    # Strict rate limiting for validation to prevent brute force
    key = f"gift_card_validate_{client_ip}"
    if not rate_limiter.check_rate_limit(key, **RATE_LIMITS["gift_card_validate"]):
        raise HTTPException(status_code=429, detail="Too many validation attempts. Please wait 10 minutes.")
    
    # Validate code format
    code = data.code.strip().upper()
    if not code.startswith("DEEZ-"):
        raise HTTPException(status_code=400, detail="Invalid gift card format")
    
    try:
        result = await validate_gift_card(db, code, "anonymous")
        
        if not result["valid"]:
            return {"valid": False, "error": result.get("error", "Invalid code")}
        
        return {
            "valid": True,
            "balance": result["balance"]
        }
    except Exception as e:
        logger.error(f"Gift card validation error: {e}")
        return {"valid": False, "error": "Validation failed"}

@api_router.post("/gift-cards/apply")
async def apply_gift_card_route(data: GiftCardApplication, request: Request):
    """Apply gift card to order"""
    client_ip = request.client.host
    
    # Rate limiting
    key = f"gift_card_apply_{client_ip}"
    if not rate_limiter.check_rate_limit(key, **RATE_LIMITS["gift_card_validate"]):
        raise HTTPException(status_code=429, detail="Too many attempts")
    
    code_hash = hash_gift_card_code(data.code)
    
    try:
        result = await apply_gift_card_to_order(
            db=db,
            code_hash=code_hash,
            amount_to_use=data.amount_to_use,
            user_email="order_email",  # Should be from authenticated user
            order_id=data.order_id
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to apply gift card"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gift card application error: {e}")
        raise HTTPException(status_code=500, detail="Failed to apply gift card")


    
    logger.info(f"DeezLink API started - SMTP: {SMTP_SERVER}:{SMTP_PORT}, OxaPay: {'configured' if OXAPAY_API_KEY else 'not configured'}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

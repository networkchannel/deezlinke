from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import logging
import uuid
import bcrypt
import jwt
import httpx
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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

# Pricing Packs - 2 packs fixes + custom
PACKS = [
    {"id": "single", "name_key": "pack_single", "quantity": 1, "price": 5.00, "unit_price": 5.00, "discount": 0, "icon": "disc"},
    {"id": "famille", "name_key": "pack_famille", "quantity": 5, "price": 20.00, "unit_price": 4.00, "discount": 20, "icon": "users", "highlighted": True},
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

def send_magic_link_email(email: str, token: str, lang: str = "fr"):
    """Send magic link authentication email"""
    base_url = os.environ.get('CORS_ORIGINS', 'https://deezlink.com').split(',')[0]
    magic_link = f"{base_url}/login?token={token}"
    
    if lang == "fr":
        subject = "Votre lien de connexion DeezLink"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #09040D; color: #fff; padding: 40px;">
            <div style="max-width: 500px; margin: 0 auto; background: #130A1C; border-radius: 16px; padding: 32px;">
                <h1 style="color: #C2FF00; margin: 0 0 24px;">🎵 DeezLink</h1>
                <p style="color: #A19BA8; font-size: 16px; line-height: 1.6;">
                    Bonjour,<br><br>
                    Cliquez sur le bouton ci-dessous pour vous connecter à votre compte DeezLink :
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{magic_link}" style="display: inline-block; background: #C2FF00; color: #09040D; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                        Se connecter
                    </a>
                </div>
                <p style="color: #5C5666; font-size: 12px;">
                    Ce lien expire dans 30 minutes.<br>
                    Si vous n'avez pas demandé ce lien, ignorez cet email.
                </p>
            </div>
        </body>
        </html>
        """
    elif lang == "ar":
        subject = "رابط تسجيل الدخول إلى DeezLink"
        html = f"""
        <!DOCTYPE html>
        <html dir="rtl">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #09040D; color: #fff; padding: 40px;">
            <div style="max-width: 500px; margin: 0 auto; background: #130A1C; border-radius: 16px; padding: 32px;">
                <h1 style="color: #C2FF00; margin: 0 0 24px;">🎵 DeezLink</h1>
                <p style="color: #A19BA8; font-size: 16px; line-height: 1.6;">
                    مرحبًا،<br><br>
                    انقر على الزر أدناه لتسجيل الدخول إلى حسابك:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{magic_link}" style="display: inline-block; background: #C2FF00; color: #09040D; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                        تسجيل الدخول
                    </a>
                </div>
                <p style="color: #5C5666; font-size: 12px;">
                    تنتهي صلاحية هذا الرابط خلال 30 دقيقة.
                </p>
            </div>
        </body>
        </html>
        """
    else:
        subject = "Your DeezLink Login Link"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #09040D; color: #fff; padding: 40px;">
            <div style="max-width: 500px; margin: 0 auto; background: #130A1C; border-radius: 16px; padding: 32px;">
                <h1 style="color: #C2FF00; margin: 0 0 24px;">🎵 DeezLink</h1>
                <p style="color: #A19BA8; font-size: 16px; line-height: 1.6;">
                    Hello,<br><br>
                    Click the button below to log in to your DeezLink account:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{magic_link}" style="display: inline-block; background: #C2FF00; color: #09040D; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                        Log In
                    </a>
                </div>
                <p style="color: #5C5666; font-size: 12px;">
                    This link expires in 30 minutes.<br>
                    If you didn't request this link, please ignore this email.
                </p>
            </div>
        </body>
        </html>
        """
    
    return send_email(email, subject, html)

def send_order_confirmation_email(email: str, order_id: str, links: List[str], lang: str = "fr"):
    """Send order confirmation with links"""
    links_html = "".join([f'<li style="margin: 8px 0;"><a href="{link}" style="color: #C2FF00;">{link}</a></li>' for link in links])
    
    if lang == "fr":
        subject = f"Votre commande DeezLink #{order_id}"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #09040D; color: #fff; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background: #130A1C; border-radius: 16px; padding: 32px;">
                <h1 style="color: #C2FF00; margin: 0 0 24px;">🎵 DeezLink</h1>
                <h2 style="color: #fff;">Merci pour votre achat !</h2>
                <p style="color: #A19BA8;">Commande #{order_id}</p>
                <div style="background: #09040D; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <h3 style="color: #FF0092; margin: 0 0 16px;">Vos liens d'activation :</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        {links_html}
                    </ul>
                </div>
                <p style="color: #5C5666; font-size: 12px;">
                    Chaque lien est garanti minimum 1 mois.<br>
                    Conservez précieusement ces liens.
                </p>
            </div>
        </body>
        </html>
        """
    else:
        subject = f"Your DeezLink Order #{order_id}"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background: #09040D; color: #fff; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background: #130A1C; border-radius: 16px; padding: 32px;">
                <h1 style="color: #C2FF00; margin: 0 0 24px;">🎵 DeezLink</h1>
                <h2 style="color: #fff;">Thank you for your purchase!</h2>
                <p style="color: #A19BA8;">Order #{order_id}</p>
                <div style="background: #09040D; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <h3 style="color: #FF0092; margin: 0 0 16px;">Your activation links:</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        {links_html}
                    </ul>
                </div>
                <p style="color: #5C5666; font-size: 12px;">
                    Each link is guaranteed for a minimum of 1 month.<br>
                    Keep these links safe.
                </p>
            </div>
        </body>
        </html>
        """
    
    return send_email(email, subject, html)

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

# ==================== ROUTES (NO /api prefix) ====================

# --- Auth Routes ---
@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request):
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
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

# --- Magic Link Auth ---
@api_router.post("/auth/magic")
async def magic_link_request(req: MagicLinkRequest, request: Request):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    
    # Generate magic token
    magic_token = secrets.token_urlsafe(32)
    expiry = datetime.now(timezone.utc) + timedelta(minutes=30)
    
    # Store token in DB
    await db.magic_tokens.delete_many({"email": email})  # Remove old tokens
    await db.magic_tokens.insert_one({
        "email": email,
        "token": magic_token,
        "expiry": expiry.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send email
    send_magic_link_email(email, magic_token, req.language)
    
    return {"message": "Magic link sent", "email": email}

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
    
    # Get or create user
    user = await db.users.find_one({"email": email})
    if not user:
        result = await db.users.insert_one({
            "email": email,
            "password_hash": "",
            "name": email.split("@")[0],
            "role": "user",
            "loyalty_points": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        user = await db.users.find_one({"_id": result.inserted_id})
    
    # Delete used token
    await db.magic_tokens.delete_one({"token": req.token})
    
    # Create session
    access_token = create_access_token(str(user["_id"]), email, user.get("role", "user"))
    response = JSONResponse(content={
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "loyalty_points": user.get("loyalty_points", 0),
        "loyalty_tier": get_loyalty_tier(user.get("loyalty_points", 0))
    })
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400 * 30, path="/")
    return response

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
        logger.info(f"Local IP detected, using defaults")
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
async def create_order(req: OrderCreateRequest):
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
    
    return {
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "total_links": total_links,
        "available_links": available_links,
        "sold_links": sold_links,
        "total_revenue": total_revenue,
        "total_users": total_users,
    }

@api_router.get("/admin/orders")
async def admin_orders(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).to_list(limit)
    total = await db.orders.count_documents({})
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
    
    logger.info(f"DeezLink API started - SMTP: {SMTP_SERVER}:{SMTP_PORT}, OxaPay: {'configured' if OXAPAY_API_KEY else 'not configured'}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

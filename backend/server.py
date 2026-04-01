from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends
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

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

# OxaPay Config
OXAPAY_API_KEY = os.environ.get('OXAPAY_MERCHANT_API_KEY', '')
OXAPAY_SANDBOX = os.environ.get('OXAPAY_SANDBOX', 'true').lower() == 'true'
OXAPAY_BASE_URL = "https://api.oxapay.com"

# Pricing Packs - 2 packs fixes + custom
PACKS = [
    {"id": "single", "name_key": "pack_single", "quantity": 1, "price": 5.00, "unit_price": 5.00, "discount": 0, "icon": "disc"},
    {"id": "famille", "name_key": "pack_famille", "quantity": 5, "price": 20.00, "unit_price": 4.00, "discount": 20, "icon": "users", "highlighted": True},
]

ADMIN_IP = "5.49.128.70"

# Currency rates (approximate, for display)
CURRENCY_MAP = {
    "FR": {"currency": "EUR", "symbol": "\u20ac", "rate": 1.0},
    "US": {"currency": "USD", "symbol": "$", "rate": 1.08},
    "GB": {"currency": "GBP", "symbol": "\u00a3", "rate": 0.86},
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

# --- Pydantic Models ---
class LoginRequest(BaseModel):
    email: str
    password: str

class MagicLinkRequest(BaseModel):
    email: str

class OrderCreateRequest(BaseModel):
    pack_id: str
    email: str
    language: str = "en"

class CustomOrderRequest(BaseModel):
    quantity: int
    email: str

# --- Custom Pricing Logic ---
def calculate_custom_price(quantity: int) -> dict:
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
    base = 5.00 * quantity
    discount = round((1 - total / base) * 100) if base > 0 else 0
    savings = round(base - total, 2)
    return {"quantity": quantity, "total": total, "unit_price": unit, "discount": discount, "savings": savings}

class LinkImportRequest(BaseModel):
    links: List[str]

class LinkManualAdd(BaseModel):
    link: str

# --- Auth Routes ---
@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request):
    from fastapi.responses import JSONResponse
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user["_id"]), email, user.get("role", "user"))
    response = JSONResponse(content={
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user")
    })
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    return response

@api_router.post("/auth/logout")
async def logout():
    from fastapi.responses import JSONResponse
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token", path="/")
    return response

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# --- Magic Link Auth (email-only login/signup) ---
@api_router.post("/auth/magic")
async def magic_link_login(req: MagicLinkRequest, request: Request):
    from fastapi.responses import JSONResponse
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    
    user = await db.users.find_one({"email": email})
    if not user:
        # Auto-create user account (no password)
        result = await db.users.insert_one({
            "email": email,
            "password_hash": "",
            "name": email.split("@")[0],
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        user = await db.users.find_one({"_id": result.inserted_id})
    
    token = create_access_token(str(user["_id"]), email, user.get("role", "user"))
    response = JSONResponse(content={
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user")
    })
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=86400 * 30, path="/")
    return response

# --- Admin Auto-Login by IP ---
@api_router.get("/admin/check-ip")
async def check_admin_ip(request: Request):
    client_ip = request.headers.get("x-forwarded-for", request.client.host)
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    is_admin_ip = client_ip == ADMIN_IP
    return {"is_admin": is_admin_ip, "ip": client_ip}

@api_router.post("/admin/auto-login")
async def admin_auto_login(request: Request):
    from fastapi.responses import JSONResponse
    client_ip = request.headers.get("x-forwarded-for", request.client.host)
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    if client_ip != ADMIN_IP:
        raise HTTPException(status_code=403, detail="Not authorized")
    
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
    response.set_cookie(key="access_token", value=token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    return response

# --- Pack Routes ---
@api_router.get("/packs")
async def get_packs():
    return {"packs": PACKS}

# --- Custom Pricing Route ---
@api_router.get("/pricing/calculate")
async def pricing_calculate(quantity: int = 1):
    if quantity < 1 or quantity > 1000:
        raise HTTPException(status_code=400, detail="Quantity must be between 1 and 1000")
    return calculate_custom_price(quantity)

# --- Geo IP Route ---
@api_router.get("/geo")
async def get_geo(request: Request):
    client_ip = request.headers.get("x-forwarded-for", request.client.host)
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    
    # Default values
    result = {"country": "FR", "language": "en", "currency": "EUR", "symbol": "\u20ac", "rate": 1.0}
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as http_client:
            resp = await http_client.get(f"http://ip-api.com/json/{client_ip}?fields=countryCode,country")
            if resp.status_code == 200:
                data = resp.json()
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
    # Find the pack
    pack = next((p for p in PACKS if p["id"] == req.pack_id), None)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack")
    
    order_id = str(uuid.uuid4())[:8].upper()
    order = {
        "order_id": order_id,
        "pack_id": req.pack_id,
        "quantity": pack["quantity"],
        "price": pack["price"],
        "currency": "EUR",
        "email": req.email.strip().lower(),
        "status": "pending",
        "payment_url": None,
        "track_id": None,
        "links": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # Try OxaPay or mock
    if OXAPAY_API_KEY:
        try:
            payload = {
                "merchant": OXAPAY_API_KEY,
                "amount": pack["price"],
                "currency": "EUR",
                "orderId": order_id,
                "description": f"DeezLink Premium - {pack['quantity']} link(s)",
                "callbackUrl": f"{os.environ.get('BACKEND_URL', '')}/api/webhooks/oxapay",
                "returnUrl": f"{os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')[0]}/order/{order_id}",
                "sandbox": OXAPAY_SANDBOX,
            }
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.post(f"{OXAPAY_BASE_URL}/merchants/request", json=payload)
                data = resp.json()
                if data.get("result") == 100:
                    order["payment_url"] = data.get("payLink", "")
                    order["track_id"] = data.get("trackId", "")
                else:
                    logger.error(f"OxaPay error: {data}")
                    order["status"] = "payment_mock"
                    order["payment_url"] = f"/order/{order_id}?mock=true"
        except Exception as e:
            logger.error(f"OxaPay request failed: {e}")
            order["status"] = "payment_mock"
            order["payment_url"] = f"/order/{order_id}?mock=true"
    else:
        # Mock mode - simulate payment
        order["status"] = "payment_mock"
        order["payment_url"] = f"/order/{order_id}?mock=true"
    
    await db.orders.insert_one(order)
    
    return {
        "order_id": order_id,
        "payment_url": order["payment_url"],
        "price": pack["price"],
        "quantity": pack["quantity"],
        "status": order["status"],
    }

@api_router.post("/orders/create-custom")
async def create_custom_order(req: CustomOrderRequest):
    if req.quantity < 1 or req.quantity > 1000:
        raise HTTPException(status_code=400, detail="Quantity must be between 1 and 1000")
    
    pricing = calculate_custom_price(req.quantity)
    order_id = str(uuid.uuid4())[:8].upper()
    order = {
        "order_id": order_id,
        "pack_id": "custom",
        "quantity": req.quantity,
        "price": pricing["total"],
        "unit_price": pricing["unit_price"],
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
            payload = {
                "merchant": OXAPAY_API_KEY,
                "amount": pricing["total"],
                "currency": "EUR",
                "orderId": order_id,
                "description": f"DeezLink Premium - {req.quantity} link(s) (custom)",
                "callbackUrl": f"{os.environ.get('BACKEND_URL', '')}/api/webhooks/oxapay",
                "returnUrl": f"{os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')[0]}/order/{order_id}",
                "sandbox": OXAPAY_SANDBOX,
            }
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.post(f"{OXAPAY_BASE_URL}/merchants/request", json=payload)
                data = resp.json()
                if data.get("result") == 100:
                    order["payment_url"] = data.get("payLink", "")
                    order["track_id"] = data.get("trackId", "")
                else:
                    order["status"] = "payment_mock"
                    order["payment_url"] = f"/order/{order_id}?mock=true"
        except Exception:
            order["status"] = "payment_mock"
            order["payment_url"] = f"/order/{order_id}?mock=true"
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
    """Mock payment confirmation for testing without OxaPay key"""
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] not in ["pending", "payment_mock"]:
        return {"message": "Order already processed", "status": order["status"]}
    
    # Assign available links
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
    
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": new_status,
            "links": assigned_links,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"status": new_status, "links_assigned": len(assigned_links)}

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
            # Assign links
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
            await db.orders.update_one(
                {"order_id": order_id},
                {"$set": {"status": new_status, "links": assigned_links, "track_id": track_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
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
    
    # Revenue
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

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup: seed admin + indexes
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.links.create_index("status")
    await db.links.create_index("url", unique=True)
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("email")
    
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
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")
    
    # Write test credentials
    creds_path = ROOT_DIR / "test_credentials.md"
    creds_path.parent.mkdir(parents=True, exist_ok=True)
    creds_path.write_text(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n## Endpoints\n- Login: POST /api/auth/login\n- Me: GET /api/auth/me\n- Logout: POST /api/auth/logout\n")
    
    # Seed some demo links if empty
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

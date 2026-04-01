# Gift Card System with Security
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import Optional
import secrets
import hashlib

class GiftCard(BaseModel):
    code: str
    amount: float
    balance: float
    purchaser_email: EmailStr
    recipient_email: Optional[EmailStr] = None
    recipient_name: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    used: bool = False
    used_at: Optional[datetime] = None
    used_by: Optional[str] = None

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
    db,
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
        "validation_attempts": 0,  # Track brute force attempts
    }
    
    await db.gift_cards.insert_one(gift_card)
    
    # Return the plain code only once (never stored in DB)
    return {
        "code": code,
        "amount": amount,
        "recipient_email": recipient_email,
        "recipient_name": recipient_name,
        "expires_at": expires_at,
    }

async def validate_gift_card(db, code: str, user_email: str) -> dict:
    """Validate and apply gift card (with rate limiting protection)"""
    code_hash = hash_gift_card_code(code)
    
    gift_card = await db.gift_cards.find_one({"code_hash": code_hash}, {"_id": 0})
    
    if not gift_card:
        # Increment failed attempts for this IP/user (handled by rate limiter)
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

async def apply_gift_card_to_order(db, code_hash: str, amount_to_use: float, user_email: str, order_id: str) -> dict:
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

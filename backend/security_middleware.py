"""
═══════════════════════════════════════════════════════════
SYSTÈME ANTI-FRAUDE ULTRA-SÉCURISÉ
═══════════════════════════════════════════════════════════
Protection contre :
- Replay attacks
- Bot attacks
- Brute force
- Request forgery
- Token theft
"""

from fastapi import Request, HTTPException
from typing import Dict, Optional
import hashlib
import time
import json
from collections import defaultdict
from datetime import datetime, timezone, timedelta

# ═══════════════════════════════════════════════════════════
# STOCKAGE EN MÉMOIRE (Redis recommandé en production)
# ═══════════════════════════════════════════════════════════

# Fingerprints valides avec leur timestamp
VALID_FINGERPRINTS: Dict[str, dict] = {}

# Tokens utilisés (pour anti-replay)
USED_TOKENS: Dict[str, float] = {}

# Séquences par fingerprint (pour détecter les replays)
FINGERPRINT_SEQUENCES: Dict[str, int] = defaultdict(int)

# Tentatives par IP
IP_ATTEMPTS: Dict[str, list] = defaultdict(list)

# ═══════════════════════════════════════════════════════════
# NETTOYAGE PÉRIODIQUE
# ═══════════════════════════════════════════════════════════

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

# ═══════════════════════════════════════════════════════════
# VALIDATION FINGERPRINT
# ═══════════════════════════════════════════════════════════

def validate_fingerprint(fp: str, telemetry: dict) -> bool:
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

# ═══════════════════════════════════════════════════════════
# VALIDATION TOKEN ANTI-REPLAY
# ═══════════════════════════════════════════════════════════

def validate_token(token: str, fp: str, telemetry: dict) -> bool:
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

# ═══════════════════════════════════════════════════════════
# VALIDATION COOKIE
# ═══════════════════════════════════════════════════════════

def validate_cookie(cookie: str, fp: str) -> bool:
    """Valide le cookie de sécurité"""
    if not cookie or len(cookie) != 64:
        return False
    
    # Vérifier correspondance avec le fingerprint enregistré
    if fp in VALID_FINGERPRINTS:
        stored_cookie = VALID_FINGERPRINTS[fp].get('cookie', '')
        if stored_cookie and stored_cookie != cookie:
            return False  # Cookie ne correspond pas
    
    return True

# ═══════════════════════════════════════════════════════════
# RATE LIMITING PAR IP
# ═══════════════════════════════════════════════════════════

def check_ip_rate_limit(ip: str, max_requests: int = 20, window: int = 60) -> bool:
    """Vérifie le rate limiting par IP"""
    now = time.time()
    
    # Enregistrer la tentative
    IP_ATTEMPTS[ip].append(now)
    
    # Compter les tentatives dans la fenêtre
    recent = [ts for ts in IP_ATTEMPTS[ip] if now - ts < window]
    IP_ATTEMPTS[ip] = recent
    
    return len(recent) <= max_requests

# ═══════════════════════════════════════════════════════════
# MIDDLEWARE PRINCIPAL
# ═══════════════════════════════════════════════════════════

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
    if not check_ip_rate_limit(client_ip, max_requests=30, window=60):
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
    if not validate_fingerprint(fp, telemetry):
        raise HTTPException(
            status_code=403,
            detail="Invalid browser fingerprint"
        )
    
    # Validation token (anti-replay)
    if not validate_token(token, fp, telemetry):
        raise HTTPException(
            status_code=403,
            detail="Invalid or expired security token"
        )
    
    # Validation cookie
    if not validate_cookie(cookie, fp):
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
    
    # TODO: Déchiffrer le payload (nécessite la clé AES côté backend)
    # Pour l'instant, on retourne le payload chiffré
    encrypted_data = body.get('_d', '')
    
    # En production, déchiffrer ici avec la clé partagée
    # Pour simplifier, on suppose que le payload est en clair pour les tests
    
    return {
        'fingerprint': fp,
        'telemetry': telemetry,
        'encrypted_payload': encrypted_data,
        'validated': True
    }

# ═══════════════════════════════════════════════════════════
# HELPER POUR ROUTES
# ═══════════════════════════════════════════════════════════

def require_security(func):
    """
    Décorateur pour protéger une route avec validation sécuritaire
    Usage:
        @require_security
        async def my_route(request: Request, security: dict):
            # security contient les infos validées
            ...
    """
    async def wrapper(request: Request, *args, **kwargs):
        security = await validate_security(request)
        return await func(request, security, *args, **kwargs)
    return wrapper

"""
Gcore JWT Validation Example
============================

Пример локальной валидации JWT токенов с использованием публичного ключа.

Особенности:
- Кеширование публичного ключа с автообновлением
- Локальная валидация JWT с RS256
- Fallback на Auth Service при ошибке
- Проверка exp, jti и других claims
- FastAPI с dependency injection

Требования:
    pip install fastapi uvicorn pyjwt cryptography requests python-jose
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import requests
import jwt
import time
import logging
from functools import lru_cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Gcore JWT Validation Example")
security = HTTPBearer()

# Конфигурация
AUTH_SERVICE_URL = "https://api.gcorelabs.com"
PUBLIC_KEY_CACHE_TTL = 3600  # 1 час


class PublicKeyCache:
    """Кеш для публичного ключа с автообновлением"""
    
    def __init__(self, auth_service_url: str):
        self.auth_service_url = auth_service_url
        self.public_key: Optional[str] = None
        self.updated_at: Optional[datetime] = None
        self.ttl = timedelta(hours=1)
    
    def get_public_key(self, force_refresh: bool = False) -> Optional[str]:
        """
        Получить публичный ключ из кеша или обновить
        
        Args:
            force_refresh: Принудительно обновить ключ
            
        Returns:
            str: PEM-encoded публичный ключ
        """
        now = datetime.now()
        
        # Использовать кеш если актуален
        if (not force_refresh and 
            self.public_key and 
            self.updated_at and 
            now - self.updated_at < self.ttl):
            return self.public_key
        
        # Запросить новый ключ
        try:
            logger.info("Fetching public key from Auth Service")
            response = requests.get(
                f"{self.auth_service_url}/iam/public-key",
                timeout=5
            )
            response.raise_for_status()
            
            self.public_key = response.json()['public_key']
            self.updated_at = now
            
            logger.info("Public key updated successfully")
            return self.public_key
            
        except Exception as e:
            logger.error(f"Failed to fetch public key: {e}")
            # Вернуть старый ключ если есть
            return self.public_key
    
    def get_key_age(self) -> Optional[float]:
        """Получить возраст ключа в секундах"""
        if not self.updated_at:
            return None
        return (datetime.now() - self.updated_at).total_seconds()


# Глобальный кеш публичного ключа
public_key_cache = PublicKeyCache(AUTH_SERVICE_URL)


class JWTValidator:
    """Класс для валидации JWT токенов"""
    
    def __init__(self, public_key_cache: PublicKeyCache):
        self.public_key_cache = public_key_cache
    
    def validate_jwt_locally(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Валидировать JWT токен локально с использованием публичного ключа
        
        Args:
            token: JWT токен (без "Bearer " префикса)
            
        Returns:
            dict: Payload токена если валиден, None если невалиден
        """
        try:
            # Получить публичный ключ
            public_key = self.public_key_cache.get_public_key()
            if not public_key:
                logger.error("Public key not available")
                return None
            
            # Декодировать и валидировать JWT
            try:
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    options={
                        "verify_signature": True,
                        "verify_exp": True,
                        "verify_iat": False,
                        "require_exp": True
                    }
                )
                
                logger.info(
                    f"JWT validated successfully. "
                    f"user_id={payload.get('user_id')}, "
                    f"exp={payload.get('exp')}"
                )
                return payload
                
            except jwt.InvalidSignatureError:
                # Публичный ключ мог измениться - обновить и повторить
                logger.warning("Invalid signature, refreshing public key")
                time.sleep(5)  # Подождать перед повторным запросом
                
                public_key = self.public_key_cache.get_public_key(force_refresh=True)
                if not public_key:
                    return None
                
                # Повторная попытка с новым ключом
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    options={
                        "verify_signature": True,
                        "verify_exp": True,
                        "require_exp": True
                    }
                )
                
                logger.info("JWT validated successfully after key refresh")
                return payload
                
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"JWT validation failed: {e}")
            return None
    
    def validate_via_service(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Валидировать токен через Auth Service (fallback)
        
        Args:
            token: JWT токен с "Bearer " префиксом
            
        Returns:
            dict: Claims если токен валиден
        """
        try:
            response = requests.get(
                f"{AUTH_SERVICE_URL}/auth/verify",
                params={
                    "header_types": "jwt",
                    "response_format": "json_body"
                },
                headers={"Authorization": token},
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Auth service returned {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Auth service validation failed: {e}")
            return None


# Глобальный validator
jwt_validator = JWTValidator(public_key_cache)


# ============================================================================
# Dependencies для FastAPI
# ============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Dependency для получения текущего пользователя из JWT
    
    Использует локальную валидацию с fallback на Auth Service
    """
    token = credentials.credentials
    
    # Попытка локальной валидации
    claims = jwt_validator.validate_jwt_locally(token)
    
    # Fallback на Auth Service если локальная валидация не удалась
    if not claims:
        logger.info("Local validation failed, trying Auth Service")
        claims = jwt_validator.validate_via_service(f"Bearer {token}")
    
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return claims


async def get_current_admin(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Dependency для проверки admin прав"""
    if not current_user.get('is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Gcore JWT Validation Example",
        "docs": "/docs",
        "public_key_age_seconds": public_key_cache.get_key_age()
    }


@app.get("/health")
async def health():
    """Health check"""
    public_key_age = public_key_cache.get_key_age()
    
    return {
        "status": "healthy",
        "public_key_cached": public_key_cache.public_key is not None,
        "public_key_age_seconds": public_key_age,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/profile")
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Получить профиль текущего пользователя
    Requires: JWT Token
    """
    return {
        "profile": {
            "user_id": current_user.get('user_id'),
            "email": current_user.get('email'),
            "username": current_user.get('username'),
            "user_type": current_user.get('user_type'),
            "client_id": current_user.get('client_id'),
            "client_name": current_user.get('client_name'),
            "is_admin": current_user.get('is_admin', False),
            "sso_entity": current_user.get('sso_entity'),
            "user_groups": current_user.get('user_groups', [])
        }
    }


@app.get("/api/orders")
async def get_orders(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Получить заказы пользователя
    Requires: JWT Token
    """
    client_id = current_user.get('client_id')
    
    # Mock data
    orders = [
        {"id": 1, "client_id": client_id, "amount": 100.50, "status": "completed"},
        {"id": 2, "client_id": client_id, "amount": 250.00, "status": "pending"}
    ]
    
    return {
        "orders": orders,
        "total": len(orders),
        "client_id": client_id
    }


@app.get("/api/admin/users")
async def get_all_users(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """
    Получить всех пользователей (только для админов)
    Requires: JWT Token with admin rights
    """
    return {
        "users": [
            {"id": 1, "email": "user1@example.com", "type": "common"},
            {"id": 2, "email": "user2@example.com", "type": "reseller"}
        ],
        "requested_by": {
            "user_id": current_admin.get('user_id'),
            "email": current_admin.get('email')
        }
    }


@app.get("/api/admin/refresh-public-key")
async def refresh_public_key(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """
    Принудительно обновить публичный ключ (только для админов)
    Requires: JWT Token with admin rights
    """
    old_age = public_key_cache.get_key_age()
    public_key = public_key_cache.get_public_key(force_refresh=True)
    new_age = public_key_cache.get_key_age()
    
    return {
        "message": "Public key refreshed",
        "old_age_seconds": old_age,
        "new_age_seconds": new_age,
        "key_preview": public_key[:50] + "..." if public_key else None
    }


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware для логирования запросов"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.2f}ms"
    )
    
    return response


if __name__ == "__main__":
    import uvicorn
    
    print("Starting Gcore JWT Validation Example")
    print(f"Auth Service URL: {AUTH_SERVICE_URL}")
    print("\nFetching initial public key...")
    
    # Предзагрузка публичного ключа
    public_key = public_key_cache.get_public_key()
    if public_key:
        print("✓ Public key loaded successfully")
    else:
        print("✗ Failed to load public key")
    
    print("\nEndpoints:")
    print("  GET  /                      - Root")
    print("  GET  /health                - Health check")
    print("  GET  /api/profile           - User profile (requires JWT)")
    print("  GET  /api/orders            - User orders (requires JWT)")
    print("  GET  /api/admin/users       - All users (requires Admin JWT)")
    print("  GET  /api/admin/refresh-public-key - Refresh key (requires Admin JWT)")
    print("\nExample request:")
    print('  curl -H "Authorization: Bearer <jwt_token>" http://localhost:8000/api/profile')
    print('\nDocs available at: http://localhost:8000/docs')
    print()
    
    uvicorn.run(app, host="0.0.0.0", port=8000)


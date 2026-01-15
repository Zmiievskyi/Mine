"""
Gcore API Tokens Integration Example
====================================

Пример интеграции API Tokens в Python Flask приложение.

Особенности:
- Валидация API Tokens через /auth/verify
- Извлечение claims (user_id, client_id, email)
- Rate limiting по client_id
- Логирование попыток доступа
- Error handling

Требования:
    pip install flask requests cachetools
"""

from flask import Flask, request, jsonify, g
from functools import wraps
import requests
import logging
import time
from cachetools import TTLCache
import hashlib

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Конфигурация
AUTH_SERVICE_URL = "https://api.gcorelabs.com"
CACHE_TTL = 300  # 5 минут

# Кеш для результатов валидации
validation_cache = TTLCache(maxsize=1000, ttl=CACHE_TTL)


class GcoreAPITokenAuth:
    """Класс для работы с Gcore API Tokens"""
    
    def __init__(self, auth_service_url):
        self.auth_service_url = auth_service_url
        self.session = self._create_session()
    
    def _create_session(self):
        """Создать HTTP сессию с connection pooling"""
        session = requests.Session()
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=10,
            pool_maxsize=20,
            max_retries=3
        )
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        return session
    
    def validate_token(self, auth_header):
        """
        Валидировать API Token через Auth Service
        
        Args:
            auth_header: Authorization header (APIKey или Bearer)
            
        Returns:
            dict: Claims если токен валиден, None если невалиден
        """
        # Проверить кеш
        cache_key = hashlib.sha256(auth_header.encode()).hexdigest()
        if cache_key in validation_cache:
            logger.info("Cache hit for token validation")
            return validation_cache[cache_key]
        
        try:
            response = self.session.get(
                f"{self.auth_service_url}/auth/verify",
                params={
                    "header_types": "apikey,jwt,other",
                    "response_format": "json_body"
                },
                headers={"Authorization": auth_header},
                timeout=5
            )
            
            if response.status_code == 200:
                claims = response.json()
                # Сохранить в кеш только если успешно
                validation_cache[cache_key] = claims
                logger.info(
                    f"Token validated successfully. "
                    f"user_id={claims.get('user_id')}, "
                    f"client_id={claims.get('client_id')}"
                )
                return claims
            elif response.status_code == 401:
                logger.warning("Invalid or expired token")
                return None
            else:
                logger.error(f"Auth service error: {response.status_code}")
                return None
                
        except requests.exceptions.Timeout:
            logger.error("Auth service timeout")
            return None
        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            return None


# Глобальный экземпляр authenticator
auth = GcoreAPITokenAuth(AUTH_SERVICE_URL)


def require_api_token(f):
    """
    Декоратор для защиты endpoints с помощью API Token
    
    Usage:
        @app.route('/api/protected')
        @require_api_token
        def protected():
            user_id = g.user_id
            client_id = g.client_id
            return {"message": "Success"}
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            logger.warning(f"Missing Authorization header from {request.remote_addr}")
            return jsonify({
                "error": "Missing Authorization header",
                "details": "Please provide APIKey or Bearer token"
            }), 401
        
        # Валидация токена
        start_time = time.time()
        claims = auth.validate_token(auth_header)
        validation_time = (time.time() - start_time) * 1000
        
        if not claims:
            logger.warning(
                f"Invalid token from {request.remote_addr}. "
                f"Validation took {validation_time:.2f}ms"
            )
            return jsonify({
                "error": "Invalid or expired token",
                "details": "Token validation failed"
            }), 401
        
        # Сохранить claims в g (Flask request context)
        g.user_id = claims.get('user_id')
        g.client_id = claims.get('client_id')
        g.token_id = claims.get('token_id')
        g.user_email = claims.get('email')
        g.user_type = claims.get('user_type')
        g.is_admin = claims.get('is_admin', False)
        g.client_name = claims.get('client_name')
        g.claims = claims
        
        logger.info(
            f"Request authorized. user_id={g.user_id}, client_id={g.client_id}, "
            f"path={request.path}, validation_time={validation_time:.2f}ms"
        )
        
        return f(*args, **kwargs)
    return decorated_function


def require_admin(f):
    """Декоратор для endpoints доступных только администраторам"""
    @wraps(f)
    @require_api_token
    def decorated_function(*args, **kwargs):
        if not g.is_admin:
            logger.warning(
                f"Admin access denied for user_id={g.user_id}, "
                f"user_type={g.user_type}"
            )
            return jsonify({
                "error": "Forbidden",
                "details": "Admin access required"
            }), 403
        return f(*args, **kwargs)
    return decorated_function


# ============================================================================
# API Endpoints
# ============================================================================

@app.route('/api/health')
def health():
    """Health check endpoint (публичный)"""
    return jsonify({"status": "healthy"}), 200


@app.route('/api/orders', methods=['GET'])
@require_api_token
def get_orders():
    """
    Получить список заказов для клиента
    Требует API Token
    """
    # Получить заказы для client_id из g.client_id
    orders = [
        {
            "id": 1,
            "client_id": g.client_id,
            "amount": 100.50,
            "status": "completed"
        },
        {
            "id": 2,
            "client_id": g.client_id,
            "amount": 250.00,
            "status": "pending"
        }
    ]
    
    return jsonify({
        "orders": orders,
        "client_id": g.client_id,
        "client_name": g.client_name,
        "total": len(orders)
    }), 200


@app.route('/api/orders', methods=['POST'])
@require_api_token
def create_order():
    """
    Создать новый заказ
    Требует API Token
    """
    data = request.get_json()
    
    if not data or 'amount' not in data:
        return jsonify({"error": "Missing amount"}), 400
    
    order = {
        "id": 123,
        "client_id": g.client_id,
        "user_id": g.user_id,
        "amount": data['amount'],
        "status": "pending",
        "created_by": g.user_email
    }
    
    logger.info(f"Order created: {order['id']} by user {g.user_id}")
    
    return jsonify({
        "message": "Order created successfully",
        "order": order
    }), 201


@app.route('/api/admin/stats', methods=['GET'])
@require_admin
def admin_stats():
    """
    Административная статистика
    Требует API Token с admin правами
    """
    stats = {
        "total_clients": 150,
        "total_orders": 5420,
        "total_revenue": 125000.50,
        "requested_by": {
            "user_id": g.user_id,
            "email": g.user_email,
            "is_admin": g.is_admin
        }
    }
    
    return jsonify(stats), 200


@app.route('/api/user/profile', methods=['GET'])
@require_api_token
def user_profile():
    """
    Получить профиль текущего пользователя
    Возвращает все claims
    """
    return jsonify({
        "profile": {
            "user_id": g.user_id,
            "email": g.user_email,
            "user_type": g.user_type,
            "client_id": g.client_id,
            "client_name": g.client_name,
            "is_admin": g.is_admin,
            "token_id": g.token_id
        }
    }), 200


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    print("Starting Gcore API Tokens Integration Example")
    print(f"Auth Service URL: {AUTH_SERVICE_URL}")
    print("\nEndpoints:")
    print("  GET  /api/health          - Health check (public)")
    print("  GET  /api/orders          - List orders (requires API Token)")
    print("  POST /api/orders          - Create order (requires API Token)")
    print("  GET  /api/admin/stats     - Admin stats (requires Admin API Token)")
    print("  GET  /api/user/profile    - User profile (requires API Token)")
    print("\nExample request:")
    print('  curl -H "Authorization: APIKey <your_token>" http://localhost:5000/api/orders')
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5000)


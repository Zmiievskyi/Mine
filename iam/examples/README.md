# Примеры интеграции Gcore Authorization

Эта папка содержит практические примеры интеграции различных методов авторизации Gcore.

## Структура

```
examples/
├── api_tokens_integration.py          # Python Flask + API Tokens
├── jwt_validation.py                  # Python FastAPI + JWT валидация
└── nginx_ingress_configs/             # Kubernetes Nginx Ingress конфигурации
    ├── auth-service.yaml              # Deployment Auth Service
    ├── app-with-auth.yaml             # App с аутентификацией
    └── app-with-snippet.yaml          # App с условной аутентификацией
```

## Быстрый старт

### 1. API Tokens Integration (Python Flask)

**Установка зависимостей:**
```bash
pip install flask requests cachetools
```

**Запуск:**
```bash
python api_tokens_integration.py
```

**Endpoints:**
- `GET /api/health` - Health check (публичный)
- `GET /api/orders` - Список заказов (требует API Token)
- `POST /api/orders` - Создание заказа (требует API Token)
- `GET /api/admin/stats` - Статистика (требует Admin API Token)
- `GET /api/user/profile` - Профиль пользователя (требует API Token)

**Пример запроса:**
```bash
curl -H "Authorization: APIKey <your_token>" \
     http://localhost:5000/api/orders
```

**Особенности:**
- Валидация через `/auth/verify`
- Кеширование результатов (TTL: 5 минут)
- Rate limiting готов
- Comprehensive logging
- Admin role checking

---

### 2. JWT Validation (Python FastAPI)

**Установка зависимостей:**
```bash
pip install fastapi uvicorn pyjwt cryptography requests python-jose
```

**Запуск:**
```bash
python jwt_validation.py
```

**Endpoints:**
- `GET /` - Root информация
- `GET /health` - Health check
- `GET /api/profile` - Профиль пользователя (JWT)
- `GET /api/orders` - Заказы (JWT)
- `GET /api/admin/users` - Все пользователи (Admin JWT)
- `GET /api/admin/refresh-public-key` - Обновить публичный ключ (Admin JWT)

**Пример запроса:**
```bash
curl -H "Authorization: Bearer <jwt_token>" \
     http://localhost:8000/api/profile
```

**Особенности:**
- Локальная валидация JWT с RS256
- Автоматическое кеширование публичного ключа
- Fallback на Auth Service при ошибке
- FastAPI dependency injection
- Swagger docs: http://localhost:8000/docs

---

### 3. Nginx Ingress Configs (Kubernetes)

**Файлы:**

#### `auth-service.yaml`
Полный deployment Authentication Service для использования с Nginx Ingress:
- Service + Deployment
- 3 реплики для HA
- HorizontalPodAutoscaler
- PodDisruptionBudget
- Health checks
- Ingress (опционально)

**Применить:**
```bash
kubectl apply -f nginx_ingress_configs/auth-service.yaml
```

#### `app-with-auth.yaml`
Пример приложения с полной аутентификацией:
- Все endpoints защищены
- Headers от Auth Service передаются в backend
- Кеширование результатов валидации
- CORS и rate limiting настроены

**Применить:**
```bash
kubectl apply -f nginx_ingress_configs/app-with-auth.yaml
```

**Annotations:**
```yaml
nginx.ingress.kubernetes.io/auth-url: "http://gcore-auth-service/auth/verify"
nginx.ingress.kubernetes.io/auth-response-headers: "X-User-Id, X-Client-Id, ..."
```

#### `app-with-snippet.yaml`
Условная аутентификация с `auth-snippet`:
- Публичные пути: `/health`, `/metrics`, `/public/*`, `/docs`, `/swagger`
- Приватные пути: все остальное
- Один Ingress вместо двух

**Применить:**
```bash
kubectl apply -f nginx_ingress_configs/app-with-snippet.yaml
```

**Auth snippet example:**
```yaml
nginx.ingress.kubernetes.io/auth-snippet: |
  if ($request_uri = "/health") {
    return 200;
  }
  if ($request_uri ~* "^/public") {
    return 200;
  }
```

---

## Тестирование

### Получение токенов для тестов

#### API Token (Sysadmin)
```bash
curl -X POST "https://api.gcorelabs.com/iam/tokens" \
  -H "Authorization: Bearer <your_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Token",
    "description": "For testing integration",
    "exp_date": "2024-12-31T23:59:59Z"
  }'
```

#### JWT Token (User Login)
```bash
curl -X POST "https://api.gcorelabs.com/auth/jwt/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@company.com",
    "password": "your_password"
  }'
```

### Тестирование валидации

```bash
# Проверить что токен валидный
curl -X GET "https://api.gcorelabs.com/auth/verify?header_types=apikey,jwt&response_format=json_body" \
  -H "Authorization: Bearer <token>"

# Должно вернуть 200 + JSON с claims
```

---

## Кастомизация

### Изменение Auth Service URL

В Python примерах измените константу:
```python
AUTH_SERVICE_URL = "https://api.gcorelabs.com"  # Production
# или
AUTH_SERVICE_URL = "https://api.preprod.gcorelabs.com"  # PreProd
```

### Добавление дополнительных headers

В Nginx Ingress конфигурации:
```yaml
nginx.ingress.kubernetes.io/auth-response-headers: "X-User-Id, X-Client-Id, X-Custom-Header"
```

И в Auth Service убедитесь что он возвращает `X-Custom-Header`.

### Настройка кеширования

Python (TTL cache):
```python
cache = TTLCache(maxsize=10000, ttl=300)  # 5 минут
```

Nginx Ingress (auth cache):
```yaml
nginx.ingress.kubernetes.io/auth-cache-key: "$http_authorization"
nginx.ingress.kubernetes.io/auth-cache-duration: "200 202 401 5m"
```

---

## Дополнительные ресурсы

- **Основной документ:** [`../GCORE_AUTHORIZATION_INTEGRATION_GUIDE.md`](../GCORE_AUTHORIZATION_INTEGRATION_GUIDE.md)
- **Gcore API Docs:** https://api.gcorelabs.com/docs
- **Nginx Ingress Docs:** https://kubernetes.github.io/ingress-nginx/
- **JWT.io:** https://jwt.io/ (для debugging JWT токенов)

---

## Troubleshooting

### Python примеры не запускаются

**Проблема:** `ModuleNotFoundError: No module named 'flask'`

**Решение:**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

pip install -r ../requirements.txt
```

### Kubernetes примеры: Auth Service недоступен

**Проблема:** `dial tcp: lookup gcore-auth-service on ...: no such host`

**Решение:**
Убедитесь что Auth Service задеплоен:
```bash
kubectl get pods -l app=gcore-auth-service
kubectl get svc gcore-auth-service
```

### Токен валидный, но получаю 401

**Проблема:** Токен валиден в Auth Service, но app возвращает 401

**Решение (Python):**
Проверьте логи:
```bash
# Должно показать "JWT validated successfully" или "Token validated successfully"
```

**Решение (Nginx Ingress):**
```bash
# Проверить Nginx logs
kubectl logs -n ingress-nginx <nginx-pod> | grep auth

# Проверить что auth-url доступен от Ingress pod
kubectl exec -n ingress-nginx <nginx-pod> -- curl http://gcore-auth-service/health
```

---

## Лицензия

Примеры предоставлены как есть для внутреннего использования в Gcore.


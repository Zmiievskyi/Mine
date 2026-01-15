# Руководство по интеграции авторизации Gcore во внешний портал

## Содержание

1. [Введение и обзор методов интеграции](#введение-и-обзор-методов-интеграции)
2. [Метод 1: API Tokens (Machine-to-Machine)](#метод-1-api-tokens-machine-to-machine)
3. [Метод 2: JWT/SAML SSO (User Authentication)](#метод-2-jwtsaml-sso-user-authentication)
4. [Метод 3: Nginx Ingress External Auth (Kubernetes)](#метод-3-nginx-ingress-external-auth-kubernetes)
5. [Метод 4: Direct Integration (Application Code)](#метод-4-direct-integration-application-code)
6. [Технические детали](#технические-детали)
7. [Метрики и мониторинг](#метрики-и-мониторинг)
8. [Сравнение методов и рекомендации](#сравнение-методов-и-рекомендации)
9. [Практические примеры интеграции](#практические-примеры-интеграции)
10. [Troubleshooting и FAQ](#troubleshooting-и-faq)
11. [Приложения](#приложения)

---

## Введение и обзор методов интеграции

### О документе

Это руководство предоставляет исчерпывающую информацию о том, как интегрировать систему авторизации Gcore в ваш внешний портал. Документ основан на официальной документации Gcore Confluence и содержит практические примеры, архитектурные диаграммы и рекомендации по выбору оптимального метода интеграции.

### Архитектура Authentication Service

Gcore Authentication Service — это централизованный сервис для управления аутентификацией и авторизацией пользователей и приложений в экосистеме Gcore. Он предоставляет различные механизмы интеграции для разных сценариев использования.

```mermaid
graph TB
    ExternalPortal[Внешний портал]
    Users[Пользователи]
    Services[Внешние сервисы]
    
    subgraph gcoreAuth[Gcore Authentication Service]
        AuthService[Authentication Service]
        IAMApi[IAM API]
        TokenManagement[Token Management]
        SAMLHandler[SAML Handler]
    end
    
    subgraph integrationMethods[Методы интеграции]
        APITokens[API Tokens]
        JWTTokens[JWT Tokens]
        SAMLAuth[SAML SSO]
        NginxIngress[Nginx Ingress]
    end
    
    IdP[Identity Provider<br/>Azure AD, Okta, etc.]
    
    Users -->|1. SAML SSO| IdP
    IdP -->|2. SAML Response| SAMLHandler
    SAMLHandler -->|3. JWT Token| ExternalPortal
    
    Users -->|4. Login credentials| AuthService
    AuthService -->|5. Access/Refresh JWT| ExternalPortal
    
    Services -->|6. API Token| AuthService
    AuthService -->|7. Validated claims| ExternalPortal
    
    ExternalPortal -.->|Uses| APITokens
    ExternalPortal -.->|Uses| JWTTokens
    ExternalPortal -.->|Uses| SAMLAuth
    ExternalPortal -.->|Uses| NginxIngress
    
    IAMApi -->|Manage| TokenManagement
```

### Матрица выбора метода интеграции

Выбор подходящего метода интеграции зависит от нескольких факторов:

| Критерий | API Tokens | JWT/SAML SSO | Nginx Ingress | Direct Integration |
|----------|-----------|--------------|---------------|-------------------|
| **Тип аутентификации** | Machine-to-Machine | User Authentication | Universal | Universal |
| **Инфраструктура** | Любая | Любая | Kubernetes | Любая |
| **Сложность внедрения** | Низкая | Средняя | Низкая (при K8s) | Средняя |
| **Независимость от кода** | Нет | Нет | Да | Нет |
| **Гибкость** | Высокая | Средняя | Средняя | Очень высокая |
| **Best for** | API интеграции | Пользовательские порталы | Микросервисы | Кастомные решения |

### Когда использовать каждый метод

#### API Tokens
**Используйте когда:**
- Нужна интеграция между сервисами (machine-to-machine)
- Требуется программный доступ к API Gcore
- Нет интерактивных пользователей
- Нужна простая ротация токенов

**Примеры применения:**
- Интеграция с внешними системами мониторинга
- Автоматизированные скрипты
- CI/CD пайплайны
- Сервисные аккаунты

#### JWT/SAML SSO
**Используйте когда:**
- Нужна аутентификация реальных пользователей
- Уже есть корпоративный Identity Provider (Azure AD, Okta и т.д.)
- Требуется Single Sign-On
- Нужно централизованное управление пользователями

**Примеры применения:**
- Корпоративные порталы
- Веб-приложения с пользователями
- Интеграция с существующей инфраструктурой SSO
- Multi-tenant приложения

#### Nginx Ingress External Auth
**Используйте когда:**
- Приложение развернуто в Kubernetes
- Хотите вынести аутентификацию на уровень инфраструктуры
- Нужна централизованная политика безопасности
- Не хотите изменять код приложения

**Примеры применения:**
- Микросервисная архитектура в K8s
- Legacy приложения без встроенной аутентификации
- Централизованный API Gateway
- Multi-service deployments

#### Direct Integration
**Используйте когда:**
- Нужна максимальная гибкость
- Требуется кастомная логика обработки токенов
- Хотите полный контроль над процессом аутентификации
- Нужна поддержка нескольких методов одновременно

**Примеры применения:**
- Сложные бизнес-требования
- Гибридные сценарии (SSO + API tokens)
- Кастомные middleware
- Приложения с особыми требованиями к безопасности

### Базовые концепции

#### Типы токенов в Gcore

1. **ACCESS Token** — JWT токен для доступа к ресурсам (lifetime: 1 час)
2. **REFRESH Token** — JWT токен для обновления ACCESS токена (lifetime: 24 часа)
3. **API Token** — Permanent token для machine-to-machine интеграции (lifetime: устанавливается пользователем)
4. **SAML Token** — Токен, полученный через SAML SSO flow

#### Формат токенов

**JWT Token:**
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJleHAiOjE2ODI...
```

**API Token:**
```
24126$98c2a5f8b1d34e6789...
```

#### Endpoints Authentication Service

- **Вход через credentials:** `POST /auth/jwt/login`
- **Обновление токена:** `POST /auth/jwt/refresh`
- **Валидация токена:** `GET /auth/verify`
- **Управление API токенами:** `/iam/tokens` (CRUDL API)

---

## Метод 1: API Tokens (Machine-to-Machine)

### Описание

API Tokens — это механизм аутентификации для сервис-сервисного взаимодействия (machine-to-machine). Они заменяют устаревшие технические токены и предоставляют более гибкий и безопасный способ интеграции.

### Преимущества API Tokens

✅ **Компактный размер** — меньше JWT токенов, удобны для использования в скриптах  
✅ **Отзываемость** — можно отозвать конкретный токен без влияния на другие  
✅ **Ротация без downtime** — возможность создать новый токен до удаления старого  
✅ **Per-application** — отдельные токены для каждого приложения  
✅ **Управляемый lifetime** — пользователь сам задает срок действия  

⚠️ **Недостатки:**
- Authentication Service может стать bottleneck / Single Point of Failure
- Дополнительный сетевой запрос для валидации

### Формат API Token

```
<token_id>$<random_string>

Пример:
24126$98c2a5f8b1d34e67891f2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4
```

**Структура:**
- `token_id` — числовой идентификатор токена в БД
- `random_string` — случайная строка длиной 128 символов (хешируется при хранении)

### Endpoint для валидации: `/auth/verify`

Authentication Service предоставляет универсальный endpoint для валидации всех типов токенов.

**URL:** `GET https://auth-service.example.com/auth/verify`

**Параметры запроса:**

| Параметр | Описание | Возможные значения |
|----------|----------|-------------------|
| `header_types` | Типы токенов для обработки | `apikey`, `jwt`, `other` (comma-separated) |
| `response_format` | Формат ответа | `jwt_header`, `jwt_body`, `json_header`, `json_body` |

### Потоки интеграции

```mermaid
sequenceDiagram
    participant Client as Внешний сервис
    participant Portal as Ваш портал
    participant AuthSvc as Auth Service
    participant Backend as Backend API
    
    Note over Client,Backend: Поток 1: Конвертация API Token → JWT
    Client->>Portal: Request с API Token
    Portal->>AuthSvc: GET /auth/verify?header_types=apikey&response_format=jwt_body
    AuthSvc->>AuthSvc: Валидация API Token
    AuthSvc-->>Portal: JWT Token
    Portal->>Portal: Валидация JWT локально
    Portal->>Backend: Request с валидированными данными
    
    Note over Client,Backend: Поток 2: Валидация любого токена → JWT
    Client->>Portal: Request с API Token или JWT
    Portal->>AuthSvc: GET /auth/verify?header_types=apikey,jwt&response_format=jwt_body
    AuthSvc->>AuthSvc: Валидация токена
    AuthSvc-->>Portal: JWT Token
    Portal->>Portal: Валидация JWT локально
    Portal->>Backend: Request с валидированными данными
    
    Note over Client,Backend: Поток 3: Прямая работа с Claims (Рекомендуется)
    Client->>Portal: Request с токеном
    Portal->>AuthSvc: GET /auth/verify?header_types=apikey,jwt,other&response_format=json_body
    AuthSvc->>AuthSvc: Валидация токена
    AuthSvc-->>Portal: JSON с claims
    Portal->>Portal: Работа с claims напрямую
    Portal->>Backend: Request с данными пользователя
```

### Поток 1: Конвертация API Token в JWT

Подходит, если ваше приложение уже умеет работать с JWT.

**Пример запроса:**

```bash
curl -X GET "https://auth-service.example.com/auth/verify?header_types=apikey&response_format=jwt_body" \
  -H "Authorization: APIKey 24126$98c2a5f8b1d34e67891f2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4"
```

**Ответ (200 OK):**

```
eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJleHAiOjE2ODIzNDU2NzgsImp0aSI6ImFiY2RlZi0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJ1c2VyX2lkIjoxMjM0LCJjbGllbnRfaWQiOjU2NzgsInRva2VuX2lkIjoyNDEyNiwiaXNzdWVkX2J5Ijp7InVzZXJfaWQiOjEyMzQsInVzZXJfdHlwZSI6InN5c3RlbV9hZG1pbiJ9LCJ0b2tlbl90eXBlIjoiYXBpX3Rva2VuIiwidXNlcl90eXBlIjoic3lzdGVtX2FkbWluIiwidXNlcl9ncm91cHMiOltdLCJlbWFpbCI6ImFkbWluQGdjb3JlLmNvbSIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc19hZG1pbiI6dHJ1ZSwiY2xpZW50X25hbWUiOiJHY29yZSJ9.signature...
```

Теперь вы можете валидировать этот JWT локально.

### Поток 2: Универсальная валидация (API Token или JWT)

Подходит, если ваше приложение принимает разные типы токенов.

**Пример запроса:**

```bash
curl -X GET "https://auth-service.example.com/auth/verify?header_types=apikey,jwt&response_format=jwt_body" \
  -H "Authorization: APIKey 24126$98c2a5f8b1d..."
```

или

```bash
curl -X GET "https://auth-service.example.com/auth/verify?header_types=apikey,jwt&response_format=jwt_body" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

**Ответ:** JWT Token (как в Потоке 1)

### Поток 3: Прямая работа с Claims (Рекомендуется)

Самый гибкий подход — получение claims в формате JSON без промежуточного JWT.

**Пример запроса:**

```bash
curl -X GET "https://auth-service.example.com/auth/verify?header_types=apikey,jwt,other&response_format=json_body" \
  -H "Authorization: APIKey 24126$98c2a5f8b1d..."
```

**Ответ (200 OK):**

```json
{
  "exp": 1682345678,
  "jti": "abcdef-1234-5678-90ab-cdef12345678",
  "user_id": 1234,
  "client_id": 5678,
  "token_id": 24126,
  "issued_by": {
    "user_id": 1234,
    "user_type": "system_admin"
  },
  "token_type": "api_token",
  "user_type": "system_admin",
  "user_groups": [],
  "email": "admin@gcore.com",
  "username": "admin",
  "sso_entity": null,
  "is_admin": true,
  "client_name": "Gcore",
  "federation_id": null
}
```

**Ответ при ошибке (401 Unauthorized):**

```json
{
  "error": "Invalid token",
  "details": "Token has expired"
}
```

### Управление API Tokens через IAM API

Gcore предоставляет REST API для создания, чтения, обновления и удаления (CRUDL) API токенов.

**Base URL:** `https://api.gcorelabs.com/iam`

#### Создание Sysadmin API Token

**Endpoint:** `POST /iam/tokens`

**Request:**

```bash
curl -X POST "https://api.gcorelabs.com/iam/tokens" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CI/CD Integration",
    "description": "Token for automated deployments",
    "exp_date": "2024-12-31T23:59:59Z"
  }'
```

**Response (201 Created):**

```json
{
  "id": 24126,
  "name": "CI/CD Integration",
  "description": "Token for automated deployments",
  "token": "24126$98c2a5f8b1d34e67891f2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
  "exp_date": "2024-12-31T23:59:59Z",
  "created": "2024-01-15T10:30:00Z",
  "user_id": 1234,
  "user_email": "admin@gcore.com",
  "last_usage": null
}
```

⚠️ **Важно:** Токен показывается только один раз при создании! Сохраните его в безопасном месте.

#### Получение списка токенов

**Endpoint:** `GET /iam/tokens`

**Параметры запроса:**

| Параметр | Описание | Пример |
|----------|----------|--------|
| `limit` | Количество записей | `20` |
| `offset` | Смещение для пагинации | `0` |
| `deleted` | Фильтр по удаленным | `false` |
| `expired` | Фильтр по истекшим | `false` |
| `name` | Поиск по имени | `CI/CD` |
| `user_email` | Фильтр по email пользователя | `admin@gcore.com` |
| `ordering` | Сортировка | `id`, `created`, `exp_date`, `last_usage` |

**Request:**

```bash
curl -X GET "https://api.gcorelabs.com/iam/tokens?limit=20&offset=0&expired=false&ordering=-created" \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response (200 OK):**

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 24126,
      "name": "CI/CD Integration",
      "description": "Token for automated deployments",
      "exp_date": "2024-12-31T23:59:59Z",
      "created": "2024-01-15T10:30:00Z",
      "user_id": 1234,
      "user_email": "admin@gcore.com",
      "last_usage": "2024-01-20T14:25:00Z"
    }
  ]
}
```

#### Получение информации о конкретном токене

**Endpoint:** `GET /iam/tokens/{id}`

```bash
curl -X GET "https://api.gcorelabs.com/iam/tokens/24126" \
  -H "Authorization: Bearer <your_jwt_token>"
```

#### Удаление токена

**Endpoint:** `DELETE /iam/tokens/{id}`

```bash
curl -X DELETE "https://api.gcorelabs.com/iam/tokens/24126" \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Response (204 No Content)**

### Создание токенов через Admin Panel

Альтернативный способ — использование веб-интерфейса:

**Production:** https://admin.gcore.top/security/api-tokens  
**PreProd:** https://admin.admin.preprod.world/security/api-tokens

### Best Practices

1. **Используйте описательные имена** — укажите назначение токена и сервис
2. **Устанавливайте разумный exp_date** — не создавайте токены без срока действия
3. **Один токен на приложение** — не переиспользуйте токены между сервисами
4. **Ротация токенов:**
   - Создайте новый токен
   - Обновите конфигурацию сервиса
   - Убедитесь что новый токен работает
   - Удалите старый токен
5. **Храните токены безопасно:**
   - Используйте переменные окружения или Secret Management системы
   - Не коммитьте токены в Git
   - Используйте Kubernetes Secrets или аналоги
6. **Мониторинг:**
   - Отслеживайте `last_usage` для выявления неиспользуемых токенов
   - Настройте алерты на истекающие токены
   - Логируйте попытки использования невалидных токенов

### Пример интеграции в Python

См. [`examples/api_tokens_integration.py`](examples/api_tokens_integration.py)

---

## Метод 2: JWT/SAML SSO (User Authentication)

### Описание

JWT (JSON Web Token) и SAML (Security Assertion Markup Language) SSO — это стандартные протоколы для аутентификации пользователей и реализации Single Sign-On. Gcore поддерживает оба подхода для интеграции с корпоративными Identity Providers.

### Поддерживаемые Identity Providers

Gcore IAM поддерживает следующие IdP:

- **Azure Active Directory** (Azure AD)
- **Microsoft Active Directory** (AD)
- **OneLogin**
- **Okta**
- **PingFederate 7**
- Любые SAML 2.0 совместимые провайдеры

### SAML SSO Workflow

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant Browser as Браузер
    participant SP as Gcore<br/>Service Provider
    participant IdP as Identity Provider<br/>Azure AD / Okta
    participant Portal as Ваш портал
    
    Note over User,Portal: SP-Initiated Flow
    User->>Browser: Открывает портал
    Browser->>SP: GET /login
    SP->>Browser: Redirect to IdP с SAML Request
    Browser->>IdP: SAML Authentication Request
    IdP->>User: Запрос credentials
    User->>IdP: Логин + пароль
    IdP->>IdP: Валидация credentials
    IdP->>Browser: SAML Response + Assertion
    Browser->>SP: POST SAML Response
    SP->>SP: Валидация SAML Assertion
    SP->>SP: Создание JWT Token
    SP->>Browser: Set JWT Token
    Browser->>Portal: Request с JWT Token
    Portal->>Portal: Валидация JWT
    Portal->>Browser: Protected resources
    
    Note over User,Portal: IdP-Initiated Flow
    User->>IdP: Логин в IdP
    IdP->>Browser: SAML Assertion
    Browser->>SP: POST SAML Assertion
    SP->>SP: Валидация + создание JWT
    SP->>Browser: Redirect to Portal с JWT
```

### Настройка SAML SSO в Gcore

#### Шаг 1: Получение данных от Identity Provider

Для интеграции вам понадобятся следующие данные от IdP:

| Параметр | Описание | Пример |
|----------|----------|--------|
| **SSO URL** | URL для SAML Authentication | `https://login.microsoftonline.com/...` |
| **Entity ID** | Уникальный идентификатор IdP | `https://sts.windows.net/fc8b6b47-...` |
| **Signing Certificate** | X.509 сертификат для проверки подписи | PEM или XML metadata |

#### Шаг 2: Загрузка SAML Metadata

Gcore поддерживает загрузку конфигурации через XML metadata файл.

**SAML Metadata URL для Azure AD:**

**Production:**
```
https://login.microsoftonline.com/fc8b6b47-53ef-4529-aea4-8c6c20a851cf/federationmetadata/2007-06/federationmetadata.xml?appid=d492f271-123b-4dea-a07d-be4d79775a59
```

**PreProd:**
```
https://login.microsoftonline.com/fc8b6b47-53ef-4529-aea4-8c6c20a851cf/federationmetadata/2007-06/federationmetadata.xml?appid=61368bfe-3acf-4ad1-b7bf-a3c557f9ce51
```

**Пример SAML Metadata XML:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="https://sts.windows.net/fc8b6b47-53ef-4529-aea4-8c6c20a851cf/">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                         Location="https://login.microsoftonline.com/..."/>
    <KeyDescriptor use="signing">
      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
        <X509Data>
          <X509Certificate>MIIC8DCCAdigAwIBAgIQ...</X509Certificate>
        </X509Data>
      </KeyInfo>
    </KeyDescriptor>
  </IDPSSODescriptor>
</EntityDescriptor>
```

#### Шаг 3: Конфигурация в Admin Panel

**URL для настройки (Prod):** https://admin.gcore.top/

Навигация:
1. Users → Resellers → Login as Reseller
2. Security → Authorization
3. Раздел "SSO login"

**Параметры конфигурации:**

| Поле | Обязательно | Описание |
|------|-------------|----------|
| **Name** | Да | Имя IdP провайдера (отображается пользователям) |
| **Entity ID** | Да | Идентификатор из metadata |
| **Domains** | Да | Email домены для автоматического редиректа |
| **SAML Metadata** | Да | XML файл с metadata |
| **Force redirect to IdP** | Нет | Автоматически перенаправлять на IdP без выбора |

**Настройки для Control Panel и Admin Panel:**

Можно отдельно включить/выключить SSO для:
- **Control Panel (LKK)** — пользовательская панель
- **Admin Panel** — административная панель

#### Шаг 4: Обновление SAML Metadata

При необходимости обновить metadata:

1. Скачайте новый XML файл от IdP
2. Перейдите в Security → Authorization
3. Удалите старый metadata файл (кнопка Delete)
4. Загрузите новый XML файл
5. Сохраните изменения

### JWT SSO для специфичных сценариев

Для некоторых интеграций (например, Zendesk) используется упрощенный JWT SSO протокол.

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant LKK as Gcore Control Panel
    participant IAM as IAM API
    participant Zendesk as Zendesk
    
    Note over User,Zendesk: JWT SSO для Zendesk
    User->>LKK: Аутентифицирован в LKK
    User->>LKK: Нажимает кнопку Support
    LKK->>IAM: Request JWT для Zendesk
    IAM->>IAM: Создает JWT с claims
    IAM->>IAM: Подписывает JWT секретным ключом
    IAM->>LKK: Redirect URL с JWT
    LKK->>Zendesk: Redirect с JWT token
    Zendesk->>Zendesk: Валидация JWT
    Zendesk->>User: Authenticated session
```

### JWT Token Payload для SSO

При успешной SAML аутентификации Gcore создает JWT токен со следующей структурой:

```json
{
  "exp": 1682345678,
  "jti": "unique-token-id",
  "user_id": 1234,
  "client_id": 5678,
  "issued_by": {
    "user_id": 1234,
    "user_type": "common"
  },
  "token_type": "access",
  "user_type": "common",
  "user_groups": [],
  "email": "user@company.com",
  "username": "john.doe",
  "sso_entity": "https://sts.windows.net/...",
  "is_admin": false,
  "client_name": "Company Name",
  "federation_id": 123
}
```

**Важные поля для SSO:**

- `sso_entity` — Entity ID из SAML metadata (указывает что это SSO пользователь)
- `email` — email из SAML assertion
- `username` — username из SAML assertion
- `federation_id` — ID федерации в Gcore

### Валидация JWT токенов в вашем приложении

#### Метод 1: Получение публичного ключа от Gcore

Gcore использует RS256 (RSA Signature with SHA-256) для подписи JWT токенов.

**Endpoint для получения публичного ключа:**

```
GET https://api.gcorelabs.com/iam/public-key
```

**Пример ответа:**

```json
{
  "public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----"
}
```

**Алгоритм кеширования публичного ключа:**

1. Запросить ключ один раз при старте приложения
2. Кешировать ключ в памяти
3. Если валидация JWT fails с ошибкой подписи:
   - Подождать 5 секунд
   - Запросить новый публичный ключ
   - Обновить кеш
   - Повторить валидацию

#### Метод 2: Валидация через Authentication Service

Альтернативно, можно использовать `/auth/verify` для валидации JWT:

```bash
curl -X GET "https://auth-service.example.com/auth/verify?header_types=jwt&response_format=json_body" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### Конфигурация авторизации для Resellers

Resellers могут гибко настраивать методы аутентификации для своих клиентов:

#### Опции аутентификации

| Опция | Описание |
|-------|----------|
| **Username/Password login** | Классический вход по логину и паролю |
| **SSO login** | Вход через Identity Provider |
| **Both enabled** | Пользователь может выбрать метод |
| **Only SSO** | Только SSO (отключен вход по паролю) |

#### Важные предупреждения

⚠️ **При отключении Username/Password:**
- Убедитесь что SSO настроен корректно
- Все пользователи должны быть добавлены в IdP
- Система покажет предупреждение: "If you disable the "Username/Password login" method for users, only "SSO login" will be available to them. Users must be added on the Identity provider side. Otherwise, they cannot be authorized by SSO."

⚠️ **При отключении SSO и включении Username/Password:**
- Пользователи должны будут сбросить пароли
- Система покажет: "Your users should reset their password for further authorization"

⚠️ **Если оба метода отключены для панели:**
- "None of the authorization methods are activated for Control Panel"

### Сценарии использования

#### Сценарий 1: Только SSO для Control Panel

**Use case:** Корпоративные пользователи, централизованное управление доступом

**Конфигурация:**
- SSO login для Control Panel: ✅ Enabled
- Username/Password для Control Panel: ❌ Disabled
- Admin Panel: любая конфигурация

**Процесс приглашения новых пользователей:**
1. Администратор добавляет пользователя в IdP (Azure AD, Okta)
2. Администратор приглашает пользователя в Gcore
3. Пользователь получает email с ссылкой на портал
4. Пользователь автоматически перенаправляется на IdP
5. После аутентификации в IdP — доступ к порталу

#### Сценарий 2: Оба метода для Control Panel

**Use case:** Гибридный подход, часть пользователей через SSO, часть по паролю

**Конфигурация:**
- SSO login для Control Panel: ✅ Enabled
- Username/Password для Control Panel: ✅ Enabled

**Процесс входа:**
1. Пользователь открывает страницу входа
2. Система показывает выбор метода:
   - "Continue with SSO"
   - "Continue with Username/Password"
3. Пользователь выбирает предпочитаемый метод

#### Сценарий 3: Разные методы для Control Panel и Admin Panel

**Use case:** SSO для обычных пользователей, пароли для администраторов

**Конфигурация:**
- SSO для Control Panel: ✅ Enabled
- Username/Password для Control Panel: ❌ Disabled
- SSO для Admin Panel: ❌ Disabled
- Username/Password для Admin Panel: ✅ Enabled

### Just-In-Time (JIT) Provisioning

Gcore поддерживает автоматическое создание пользователей при первом входе через SSO.

**Требуемые атрибуты в SAML Assertion:**
- `email` (обязательно)
- `firstName` (опционально)
- `lastName` (опционально)
- `groups` (опционально, для автоматического назначения ролей)

### SCIM (System for Cross-domain Identity Management)

Для автоматической синхронизации пользователей между IdP и Gcore можно использовать SCIM протокол.

**Поддерживаемые операции:**
- Создание пользователей
- Обновление пользователей
- Деактивация пользователей
- Синхронизация групп

**События через RabbitMQ:**

При изменениях в федерации/клиенте Gcore отправляет события в RabbitMQ:
- `client.federation.created`
- `client.federation.updated`
- `client.federation.deleted`
- `reseller.federation.changed`

### Пример интеграции

См. [`examples/jwt_validation.py`](examples/jwt_validation.py) для примера валидации JWT токенов.

---

## Метод 3: Nginx Ingress External Auth (Kubernetes)

### Описание

Nginx Ingress External Authentication — это метод интеграции на уровне инфраструктуры для приложений, развернутых в Kubernetes. Он позволяет централизованно управлять аутентификацией без изменения кода приложения.

### Преимущества подхода

✅ **Независимость от кода** — не нужно изменять приложение  
✅ **Централизация** — единая политика аутентификации для всех сервисов  
✅ **Переиспользование** — один Authentication Service для множества backend'ов  
✅ **Простота внедрения** — только изменения в Ingress конфигурации  
✅ **Гибкость** — легко исключить публичные endpoints из аутентификации  

### Архитектура

```mermaid
graph LR
    User[Пользователь]
    Ingress[Nginx Ingress<br/>Controller]
    AuthSvc[Gcore Auth<br/>Service]
    Backend1[Backend App 1]
    Backend2[Backend App 2]
    Backend3[Backend App 3]
    
    User -->|1. Request + Token| Ingress
    Ingress -->|2. Validate token| AuthSvc
    AuthSvc -->|3. 200 + Headers| Ingress
    Ingress -->|4. Request + Auth headers| Backend1
    Ingress -->|4. Request + Auth headers| Backend2
    Ingress -->|4. Request + Auth headers| Backend3
    
    AuthSvc -.->|401 Unauthorized| Ingress
    Ingress -.->|401| User
```

### Как это работает

1. **Пользователь** отправляет запрос к вашему сервису с токеном в header `Authorization`
2. **Nginx Ingress** перехватывает запрос и делает sub-request к Authentication Service
3. **Authentication Service** валидирует токен:
   - Если валиден → возвращает 200 + модифицированные headers
   - Если невалиден → возвращает 401
4. **Nginx Ingress** при получении 200:
   - Добавляет headers от Auth Service в оригинальный запрос
   - Проксирует запрос к Backend приложению
5. **Backend** получает запрос с дополнительными headers (user_id, client_id, новый JWT и т.д.)

### Конфигурация Ingress

#### Базовая конфигурация

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    # URL Authentication Service для валидации
    nginx.ingress.kubernetes.io/auth-url: "https://auth-service.example.com/auth/verify?header_types=apikey,jwt&response_format=json_body"
    
    # Headers которые будут переданы от Auth Service к Backend
    nginx.ingress.kubernetes.io/auth-response-headers: "Authorization, X-Platform-User-ID, X-Platform-Client-ID"
spec:
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 8080
```

### Ключевые annotations

| Annotation | Описание | Пример |
|-----------|----------|--------|
| `nginx.ingress.kubernetes.io/auth-url` | URL для валидации токенов | `https://auth-service.example.com/auth/verify` |
| `nginx.ingress.kubernetes.io/auth-response-headers` | Headers для передачи в backend | `Authorization, X-Platform-User-ID` |
| `nginx.ingress.kubernetes.io/auth-snippet` | Custom Nginx конфигурация | См. примеры ниже |

### Authentication Service для Nginx Ingress

Authentication Service должен реализовывать endpoint который:
1. Принимает все headers от Ingress
2. Валидирует токен из `Authorization` header
3. Возвращает 200 + новые headers при успехе
4. Возвращает 401 при ошибке

**Пример ответа от Auth Service при успешной валидации:**

```http
HTTP/1.1 200 OK
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
X-Platform-User-ID: 1234
X-Platform-Client-ID: 5678
X-User-Email: user@company.com
X-User-Type: common
X-Is-Admin: false
```

**Backend приложение получит эти headers автоматически!**

### Исключение публичных endpoints из аутентификации

Часто нужно исключить некоторые пути (например, `/health`, `/public`, `/swagger`) из аутентификации.

#### Метод 1: Два отдельных Ingress контроллера

Создайте два Ingress ресурса — один с auth, другой без:

**Ingress с аутентификацией:**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-private
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "https://auth-service.example.com/auth/verify"
    nginx.ingress.kubernetes.io/auth-response-headers: "Authorization, X-Platform-User-ID, X-Platform-Client-ID"
spec:
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 8080
      - path: /dashboard
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 8080
```

**Ingress без аутентификации (публичный):**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-public
spec:
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /health
        pathType: Exact
        backend:
          service:
            name: my-app-service
            port:
              number: 8080
      - path: /public
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 8080
      - path: /swagger
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 8080
```

#### Метод 2: Использование auth-snippet

Более гибкий подход — использовать `auth-snippet` для условной аутентификации:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "https://auth-service.example.com/auth/verify"
    nginx.ingress.kubernetes.io/auth-response-headers: "Authorization, X-Platform-User-ID, X-Platform-Client-ID"
    nginx.ingress.kubernetes.io/auth-snippet: |
      # Пропустить аутентификацию для публичных путей
      if ($request_uri = "/health") {
        return 200;
      }
      if ($request_uri = "/metrics") {
        return 200;
      }
      if ($request_uri ~* "^/public") {
        return 200;
      }
      if ($request_uri ~* "^/swagger") {
        return 200;
      }
spec:
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 8080
```

**Важно:** `return 200` в `auth-snippet` означает "пропустить аутентификацию", а не вернуть 200 клиенту!

### Полный пример: POC-2 из Confluence

Ниже полный working example из песочницы Gcore (POC-2):

#### Authentication Service (Go)

```go
package main

import (
    "fmt"
    "math/rand"
    "net/http"
    "strconv"
    "strings"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        
        // Проверка наличия токена
        if strings.Contains(authHeader, "Bearer token") {
            // Токен валиден - добавляем headers для backend
            w.Header().Add("UserID", strconv.Itoa(rand.Int()))
            w.Header().Add("UserRole", "admin")
            w.Header().Add("Other", "not used")
            w.Header().Add("Authorization", "Bearer current-platform-token")
            
            w.WriteHeader(http.StatusOK)
            fmt.Fprint(w, "ok")
        } else {
            // Токен невалиден
            w.WriteHeader(http.StatusForbidden)
            fmt.Fprint(w, "unauthorized")
        }
    })
    
    http.ListenAndServe(":8080", nil)
}
```

#### Kubernetes Deployment для Auth Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: poc-authservice
  labels:
    app: poc-authservice
spec:
  ports:
    - name: "8000"
      port: 8000
      protocol: TCP
      targetPort: 8080
  selector:
    app: poc-authservice
    component: authservice
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: poc-authservice
spec:
  replicas: 1
  selector:
    matchLabels:
      app: poc-authservice
  template:
    metadata:
      labels:
        app: poc-authservice
        component: authservice
    spec:
      containers:
        - name: authservice
          image: registry.gcdn.co/drone/ingress-externalauth-authsvc-amd64:0.3
          imagePullPolicy: IfNotPresent
          resources:
            requests:
              cpu: 100m
              memory: 50Mi
            limits:
              cpu: 250m
              memory: 200Mi
          ports:
            - containerPort: 8080
              name: tcp-8080
              protocol: TCP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: poc-authservice
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
spec:
  rules:
  - host: poc-authservice.sandbox.example.com
    http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: poc-authservice
              port:
                number: 8000
```

#### Backend Application (Go)

```go
package main

import (
    "fmt"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    // Backend получает headers от Auth Service через Ingress
    userID := r.Header.Get("UserID")
    userRole := r.Header.Get("UserRole")
    authorization := r.Header.Get("Authorization")
    
    fmt.Fprintf(w, "PRIVATE: UserID: %s, UserRole: %s, Authorization: %s",
        userID, userRole, authorization)
}

func publicHandler(w http.ResponseWriter, r *http.Request) {
    // Публичный endpoint - headers пустые
    userID := r.Header.Get("UserID")
    userRole := r.Header.Get("UserRole")
    authorization := r.Header.Get("Authorization")
    
    fmt.Fprintf(w, "PUBLIC: UserID: %s, UserRole: %s, Authorization: %s",
        userID, userRole, authorization)
}

func main() {
    http.HandleFunc("/private", handler)
    http.HandleFunc("/public", publicHandler)
    http.ListenAndServe(":8080", nil)
}
```

#### Kubernetes Deployment для Backend

```yaml
apiVersion: v1
kind: Service
metadata:
  name: poc-sample-app
  labels:
    app: poc-sample-app
spec:
  ports:
    - name: "8000"
      port: 8000
      protocol: TCP
      targetPort: 8080
  selector:
    app: poc-sample-app
    component: samplebackend
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: poc-sample-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: poc-sample-app
  template:
    metadata:
      labels:
        app: poc-sample-app
        component: samplebackend
    spec:
      containers:
        - name: samplebackend
          image: registry.gcdn.co/drone/ingress-externalauth-echosvc-amd64:0.3
          imagePullPolicy: IfNotPresent
          resources:
            requests:
              cpu: 100m
              memory: 50Mi
            limits:
              cpu: 250m
              memory: 200Mi
          ports:
            - containerPort: 8080
              name: tcp-8080
              protocol: TCP
---
# Ingress с аутентификацией для /private
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: poc-sample-app
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "http://poc-authservice.sandbox.example.com/"
    nginx.ingress.kubernetes.io/auth-response-headers: "Authorization, UserID, UserRole"
spec:
  rules:
  - host: poc-sample-app.sandbox.example.com
    http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: poc-sample-app
              port:
                number: 8000
---
# Ingress без аутентификации для /public
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: poc-sample-app-public
spec:
  rules:
  - host: poc-sample-app.sandbox.example.com
    http:
      paths:
        - path: /public
          pathType: Prefix
          backend:
            service:
              name: poc-sample-app
              port:
                number: 8000
```

### Тестирование

```bash
# 403 Forbidden - нет токена
curl https://poc-sample-app.sandbox.example.com/private

# 200 OK - публичный endpoint (всегда доступен)
curl https://poc-sample-app.sandbox.example.com/public
# Ответ: PUBLIC: UserID: , UserRole: , Authorization:

# 200 OK - с валидным токеном
curl -H "Authorization: Bearer token" \
     https://poc-sample-app.sandbox.example.com/private
# Ответ: PRIVATE: UserID: 2933568871211445515, UserRole: admin, Authorization: Bearer current-platform-token
```

### Интеграция с Gcore Auth Service

Для реальной интеграции используйте Gcore Authentication Service:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    # Используем Gcore Auth Service
    nginx.ingress.kubernetes.io/auth-url: "https://api.gcorelabs.com/auth/verify?header_types=apikey,jwt&response_format=json_header"
    
    # Headers которые вернет Auth Service
    nginx.ingress.kubernetes.io/auth-response-headers: "X-User-Id, X-Client-Id, X-User-Email, X-User-Type, X-Is-Admin, Authorization"
spec:
  rules:
  - host: my-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 8080
```

### Best Practices

1. **Используйте auth-snippet для исключения публичных путей** — проще поддерживать один Ingress
2. **Кешируйте результаты валидации** — настройте `nginx.ingress.kubernetes.io/auth-cache-key` и `nginx.ingress.kubernetes.io/auth-cache-duration`
3. **Настройте timeouts:**
   ```yaml
   nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
   nginx.ingress.kubernetes.io/auth-request-timeout: "10"
   ```
4. **Мониторинг:**
   - Логируйте auth-errors
   - Отслеживайте latency Auth Service
   - Настройте health checks для Auth Service
5. **Высокая доступность:**
   - Разверните минимум 2 реплики Auth Service
   - Используйте HPA (Horizontal Pod Autoscaler)
   - Настройте PodDisruptionBudget

### Дополнительные ресурсы

Официальная документация Nginx Ingress:
- [External Authentication](https://kubernetes.github.io/ingress-nginx/examples/auth/external-auth/)
- [Custom Headers](https://kubernetes.github.io/ingress-nginx/examples/customization/external-auth-headers/)
- [Annotations Reference](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#external-authentication)

См. также [`examples/nginx_ingress_configs/`](examples/nginx_ingress_configs/) для готовых YAML конфигураций.

---

## Метод 4: Direct Integration (Application Code)

### Описание

Direct Integration — это прямая интеграция Authentication Service в код вашего приложения. Этот подход дает максимальную гибкость и контроль над процессом аутентификации.

### Когда использовать

✅ **Максимальная гибкость** — нужна кастомная логика обработки токенов  
✅ **Гибридные сценарии** — поддержка нескольких методов аутентификации одновременно  
✅ **Сложные требования** — специфичная бизнес-логика  
✅ **Полный контроль** — нужен контроль над каждым аспектом аутентификации  
✅ **Не K8s окружение** — приложение вне Kubernetes  

### Схемы валидации токенов

Gcore Authentication Service поддерживает четыре схемы интеграции:

#### Схема 1: Валидация Permanent Tokens

Если вы используете только API Tokens (permanent tokens):

```mermaid
sequenceDiagram
    participant Client as Клиент
    participant App as Ваше приложение
    participant AuthSvc as Auth Service
    participant DB as Ваша БД
    
    Client->>App: Request с API Token
    App->>AuthSvc: POST /auth/verify (API Token)
    AuthSvc->>AuthSvc: Валидация токена
    AuthSvc-->>App: Claims (user_id, client_id, etc.)
    App->>DB: Запрос данных для user
    DB-->>App: Данные пользователя
    App-->>Client: Response
```

**Когда использовать:**
- Только machine-to-machine интеграции
- Все токены — это API Tokens
- Нет обычных пользователей с JWT

#### Схема 2: Валидация всех типов токенов

Валидация и API Tokens, и JWT токенов через Authentication Service:

```mermaid
sequenceDiagram
    participant Client as Клиент
    participant App as Ваше приложение
    participant AuthSvc as Auth Service
    
    alt API Token
        Client->>App: Request с API Token
        App->>AuthSvc: /auth/verify?header_types=apikey,jwt
        AuthSvc-->>App: Claims
    else JWT Token
        Client->>App: Request с JWT
        App->>AuthSvc: /auth/verify?header_types=apikey,jwt
        AuthSvc-->>App: Claims
    end
    
    App->>App: Обработка запроса с claims
    App-->>Client: Response
```

**Когда использовать:**
- Микс API Tokens и JWT токенов
- Не хотите валидировать JWT локально
- Нужна централизованная проверка blacklist

#### Схема 3: Валидация с конвертацией в JWT

Конвертируете API Token в JWT через Auth Service, затем валидируете JWT локально:

```mermaid
sequenceDiagram
    participant Client as Клиент
    participant App as Ваше приложение
    participant AuthSvc as Auth Service
    participant Cache as Кеш публичных ключей
    
    Client->>App: Request с API Token
    App->>AuthSvc: /auth/verify?response_format=jwt_body
    AuthSvc-->>App: JWT Token
    
    App->>App: Проверка наличия публичного ключа в кеше
    
    alt Ключ в кеше
        App->>App: Валидация JWT с ключом из кеша
    else Ключа нет или валидация failed
        App->>AuthSvc: GET /iam/public-key
        AuthSvc-->>App: Public Key
        App->>Cache: Сохранить ключ в кеш
        App->>App: Валидация JWT
    end
    
    App->>App: Извлечение claims из JWT
    App-->>Client: Response
```

**Когда использовать:**
- Высокая нагрузка — не хотите делать запрос к Auth Service на каждый request
- Хотите кешировать результаты валидации
- Нужна офлайн валидация (с небольшой задержкой в revoke)

#### Схема 4: Прямая работа с Claims (Рекомендуется)

Получение claims напрямую в JSON формате без промежуточного JWT:

```mermaid
sequenceDiagram
    participant Client as Клиент
    participant App as Ваше приложение
    participant AuthSvc as Auth Service
    
    Client->>App: Request с токеном (любого типа)
    App->>AuthSvc: /auth/verify?header_types=apikey,jwt,other&response_format=json_body
    AuthSvc-->>App: JSON Claims
    App->>App: Работа с claims напрямую
    App-->>Client: Response
```

**Когда использовать:**
- Не нужна промежуточная конвертация в JWT
- Хотите работать с claims как с обычным JSON объектом
- Поддержка любых типов токенов
- Самый простой и гибкий подход

### Типы токенов и их время жизни

| Тип токена | Lifetime | Описание | Revocable |
|-----------|----------|----------|-----------|
| **ACCESS** | 1 час | JWT токен для доступа к ресурсам | Через blacklist |
| **REFRESH** | 24 часа | JWT токен для обновления ACCESS | Через blacklist |
| **API Token** | Определяется пользователем | Permanent token для API | Да (индивидуально) |
| **PASSWORD_RESET** | Кратковременный | Токен для сброса пароля | Одноразовый |
| **TECHNICAL** | Устаревший | Старые технические токены | Deprecated |

### Процесс получения JWT токенов для пользователей

#### Аутентификация через credentials

**Endpoint:** `POST /auth/jwt/login`

**Request:**

```bash
curl -X POST "https://api.gcorelabs.com/auth/jwt/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@company.com",
    "password": "SecurePassword123"
  }'
```

**Response (200 OK):**

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "expires_in": 3600
}
```

#### Обновление токена

**Endpoint:** `POST /auth/jwt/refresh`

**Request:**

```bash
curl -X POST "https://api.gcorelabs.com/auth/jwt/refresh" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <refresh_token>"
```

**Response (200 OK):**

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "expires_in": 3600
}
```

**Важно:** REFRESH токен не обновляется! Он используется до истечения 24 часов.

### Механизм отзыва токенов

#### Blacklist для JWT

JWT токены могут быть добавлены в blacklist:
- При логауте пользователя
- При смене пароля
- При отзыве токена администратором

**Проверка blacklist:**
- Выполняется автоматически в `/auth/verify`
- Если токен в blacklist → 401 Unauthorized

#### Индивидуальная отзыва API Tokens

API Tokens можно отозвать индивидуально через IAM API:

```bash
DELETE /iam/tokens/{token_id}
```

После удаления токен немедленно становится невалидным.

### Локальная валидация JWT

Если вы выбрали схему с локальной валидацией JWT, вот как это реализовать:

#### Получение и кеширование публичного ключа

**Алгоритм:**

1. При старте приложения запросить публичный ключ
2. Сохранить в памяти (in-memory cache)
3. При валидации JWT использовать кешированный ключ
4. Если валидация fails с ошибкой подписи:
   - Подождать 5 секунд
   - Запросить новый публичный ключ
   - Обновить кеш
   - Повторить валидацию

**Endpoint:** `GET https://api.gcorelabs.com/iam/public-key`

**Response:**

```json
{
  "public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3z...\n-----END PUBLIC KEY-----"
}
```

### Примеры реализации

#### Python Flask Middleware

```python
from functools import wraps
from flask import request, jsonify, g
import requests
import jwt
from datetime import datetime, timedelta

class GcoreAuthMiddleware:
    def __init__(self, app, auth_service_url):
        self.app = app
        self.auth_service_url = auth_service_url
        self.public_key = None
        self.public_key_updated_at = None
        self.cache_duration = timedelta(hours=1)
    
    def get_public_key(self, force_refresh=False):
        """Получить и кешировать публичный ключ"""
        now = datetime.now()
        
        if (not force_refresh and 
            self.public_key and 
            self.public_key_updated_at and 
            now - self.public_key_updated_at < self.cache_duration):
            return self.public_key
        
        try:
            response = requests.get(f"{self.auth_service_url}/iam/public-key")
            response.raise_for_status()
            self.public_key = response.json()['public_key']
            self.public_key_updated_at = now
            return self.public_key
        except Exception as e:
            self.app.logger.error(f"Failed to fetch public key: {e}")
            return None
    
    def validate_token_via_service(self, token):
        """Валидация через Auth Service (Схема 4)"""
        try:
            response = requests.get(
                f"{self.auth_service_url}/auth/verify",
                params={
                    "header_types": "apikey,jwt,other",
                    "response_format": "json_body"
                },
                headers={"Authorization": token}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
        except Exception as e:
            self.app.logger.error(f"Token validation failed: {e}")
            return None
    
    def validate_jwt_locally(self, token):
        """Валидация JWT локально (Схема 3)"""
        try:
            # Попытка валидации с текущим ключом
            public_key = self.get_public_key()
            if not public_key:
                return None
            
            try:
                payload = jwt.decode(
                    token.replace("Bearer ", ""),
                    public_key,
                    algorithms=["RS256"]
                )
                return payload
            except jwt.InvalidSignatureError:
                # Обновить публичный ключ и повторить
                import time
                time.sleep(5)
                public_key = self.get_public_key(force_refresh=True)
                if not public_key:
                    return None
                
                payload = jwt.decode(
                    token.replace("Bearer ", ""),
                    public_key,
                    algorithms=["RS256"]
                )
                return payload
                
        except jwt.ExpiredSignatureError:
            self.app.logger.warning("Token has expired")
            return None
        except Exception as e:
            self.app.logger.error(f"JWT validation failed: {e}")
            return None

def require_auth(validation_method="service"):
    """Декоратор для защиты endpoints"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            
            if not auth_header:
                return jsonify({"error": "Missing Authorization header"}), 401
            
            # Выбор метода валидации
            middleware = current_app.extensions.get('gcore_auth')
            
            if validation_method == "service":
                claims = middleware.validate_token_via_service(auth_header)
            elif validation_method == "local":
                claims = middleware.validate_jwt_locally(auth_header)
            else:
                return jsonify({"error": "Invalid validation method"}), 500
            
            if not claims:
                return jsonify({"error": "Invalid or expired token"}), 401
            
            # Сохранить claims в контексте запроса
            g.user_id = claims.get('user_id')
            g.client_id = claims.get('client_id')
            g.user_email = claims.get('email')
            g.user_type = claims.get('user_type')
            g.is_admin = claims.get('is_admin', False)
            g.claims = claims
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Использование
from flask import Flask, g

app = Flask(__name__)

# Инициализация middleware
auth_middleware = GcoreAuthMiddleware(
    app, 
    auth_service_url="https://api.gcorelabs.com"
)
app.extensions['gcore_auth'] = auth_middleware

@app.route('/api/protected')
@require_auth(validation_method="service")
def protected_endpoint():
    return jsonify({
        "message": "Success",
        "user_id": g.user_id,
        "email": g.user_email,
        "is_admin": g.is_admin
    })

@app.route('/api/user/profile')
@require_auth(validation_method="local")
def user_profile():
    # Доступ ко всем claims
    return jsonify({
        "profile": {
            "user_id": g.user_id,
            "email": g.user_email,
            "client_name": g.claims.get('client_name'),
            "user_groups": g.claims.get('user_groups', [])
        }
    })
```

#### Node.js / Express Middleware

```javascript
const axios = require('axios');
const jwt = require('jsonwebtoken');

class GcoreAuthMiddleware {
  constructor(authServiceUrl) {
    this.authServiceUrl = authServiceUrl;
    this.publicKey = null;
    this.publicKeyUpdatedAt = null;
    this.cacheDuration = 60 * 60 * 1000; // 1 hour
  }

  async getPublicKey(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && 
        this.publicKey && 
        this.publicKeyUpdatedAt && 
        now - this.publicKeyUpdatedAt < this.cacheDuration) {
      return this.publicKey;
    }

    try {
      const response = await axios.get(`${this.authServiceUrl}/iam/public-key`);
      this.publicKey = response.data.public_key;
      this.publicKeyUpdatedAt = now;
      return this.publicKey;
    } catch (error) {
      console.error('Failed to fetch public key:', error);
      return null;
    }
  }

  async validateTokenViaService(token) {
    try {
      const response = await axios.get(`${this.authServiceUrl}/auth/verify`, {
        params: {
          header_types: 'apikey,jwt,other',
          response_format: 'json_body'
        },
        headers: { Authorization: token }
      });
      
      return response.status === 200 ? response.data : null;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  async validateJWTLocally(token) {
    try {
      const publicKey = await this.getPublicKey();
      if (!publicKey) return null;

      try {
        const payload = jwt.verify(
          token.replace('Bearer ', ''),
          publicKey,
          { algorithms: ['RS256'] }
        );
        return payload;
      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          // Refresh public key and retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          const newKey = await this.getPublicKey(true);
          if (!newKey) return null;
          
          const payload = jwt.verify(
            token.replace('Bearer ', ''),
            newKey,
            { algorithms: ['RS256'] }
          );
          return payload;
        }
        throw error;
      }
    } catch (error) {
      console.error('JWT validation failed:', error);
      return null;
    }
  }
}

// Middleware function
function requireAuth(validationMethod = 'service') {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const middleware = req.app.get('gcoreAuth');
    let claims;

    if (validationMethod === 'service') {
      claims = await middleware.validateTokenViaService(authHeader);
    } else if (validationMethod === 'local') {
      claims = await middleware.validateJWTLocally(authHeader);
    } else {
      return res.status(500).json({ error: 'Invalid validation method' });
    }

    if (!claims) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach claims to request
    req.user = {
      id: claims.user_id,
      clientId: claims.client_id,
      email: claims.email,
      userType: claims.user_type,
      isAdmin: claims.is_admin || false,
      claims: claims
    };

    next();
  };
}

// Usage
const express = require('express');
const app = express();

const authMiddleware = new GcoreAuthMiddleware('https://api.gcorelabs.com');
app.set('gcoreAuth', authMiddleware);

app.get('/api/protected', requireAuth('service'), (req, res) => {
  res.json({
    message: 'Success',
    user_id: req.user.id,
    email: req.user.email,
    is_admin: req.user.isAdmin
  });
});

app.get('/api/user/profile', requireAuth('local'), (req, res) => {
  res.json({
    profile: {
      user_id: req.user.id,
      email: req.user.email,
      client_name: req.user.claims.client_name,
      user_groups: req.user.claims.user_groups || []
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Best Practices

1. **Выбирайте правильную схему валидации:**
   - Высокая нагрузка → Локальная валидация JWT (Схема 3)
   - Нужен актуальный blacklist → Валидация через сервис (Схема 4)
   - Микс токенов → Универсальная валидация (Схема 2)

2. **Кешируйте публичные ключи:**
   - Храните в памяти, не в БД
   - Обновляйте только при ошибке валидации
   - TTL: 1 час

3. **Обрабатывайте ошибки gracefully:**
   - 401 для невалидных токенов
   - 403 для валидных токенов без прав
   - 500 при ошибках Auth Service

4. **Логирование:**
   - Логируйте все попытки авторизации
   - Храните user_id в логах для аудита
   - Алертите на повторяющиеся ошибки

5. **Безопасность:**
   - Всегда используйте HTTPS
   - Не логируйте токены полностью (только первые/последние символы)
   - Ротируйте API Tokens регулярно

### Дополнительные примеры

Полные рабочие примеры доступны в:
- [`examples/api_tokens_integration.py`](examples/api_tokens_integration.py)
- [`examples/jwt_validation.py`](examples/jwt_validation.py)

---

## Технические детали

### JWT Payload Structure

Все JWT токены в системе Gcore имеют стандартизированную структуру payload. Понимание этих полей критично для корректной интеграции.

#### Полная структура JWT Payload

```json
{
  "exp": 1682345678,
  "jti": "abcdef-1234-5678-90ab-cdef12345678",
  "user_id": 1234,
  "client_id": 5678,
  "token_id": 24126,
  "issued_by": {
    "user_id": 1234,
    "user_type": "system_admin"
  },
  "token_type": "access",
  "user_type": "common",
  "user_groups": ["developers", "qa"],
  "role_params": {
    "role": "developer",
    "read_only": false,
    "federations": [123, 456],
    "alias": "dev_user",
    "resellers_wl": [10, 20],
    "resellers_bl": [30]
  },
  "email": "user@company.com",
  "username": "john.doe",
  "sso_entity": "https://sts.windows.net/fc8b6b47-...",
  "is_admin": false,
  "client_name": "Company Name",
  "federation_id": 123
}
```

#### Описание полей

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `exp` | integer | Да | Unix timestamp истечения токена |
| `jti` | string | Да | Уникальный идентификатор токена (JWT ID) |
| `user_id` | integer | Да | ID пользователя в системе Gcore |
| `client_id` | integer | Да | ID клиента (компании) |
| `token_id` | integer | Нет | ID токена (только для API Tokens) |
| `issued_by` | object | Да | Информация о том, кто выпустил токен |
| `issued_by.user_id` | integer | Да | ID пользователя, создавшего токен |
| `issued_by.user_type` | string | Да | Тип пользователя-создателя |
| `token_type` | string | Да | Тип токена |
| `user_type` | string | Да | Тип пользователя |
| `user_groups` | array | Да | Список групп пользователя |
| `role_params` | object | Нет | Дополнительные параметры роли |
| `email` | string | Да | Email пользователя |
| `username` | string | Да | Username пользователя |
| `sso_entity` | string | Нет | Entity ID IdP (если SSO пользователь) |
| `is_admin` | boolean | Да | Является ли пользователь администратором |
| `client_name` | string | Да | Название клиента (компании) |
| `federation_id` | integer | Нет | ID федерации (если применимо) |

#### Типы токенов (token_type)

| Значение | Описание | Lifetime |
|----------|----------|----------|
| `access` | Токен для доступа к ресурсам | 1 час |
| `refresh` | Токен для обновления access токена | 24 часа |
| `password_reset` | Токен для сброса пароля | Кратковременный |
| `api_token` | Permanent API Token | Определяется пользователем |
| `technical` | Устаревший технический токен | Deprecated |

#### Типы пользователей (user_type)

| Значение | Описание | Права |
|----------|----------|-------|
| `reseller` | Реселлер | Полный доступ к своим клиентам |
| `sales` | Продажи | Ограниченный доступ |
| `common` | Обычный пользователь | Доступ к своему клиенту |
| `system_admin` | Системный администратор | Полный доступ ко всей системе |
| `video_platform` | Видеоплатформа | Специфичные права для видео |

#### Role Params Structure

`role_params` — это опциональное поле для расширенных параметров роли:

```json
{
  "role": "developer",
  "read_only": false,
  "federations": [123, 456],
  "alias": "dev_user",
  "resellers_wl": [10, 20],
  "resellers_bl": [30]
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `role` | string | Название роли |
| `read_only` | boolean | Только чтение |
| `federations` | array | Доступные федерации |
| `alias` | string | Псевдоним пользователя |
| `resellers_wl` | array | Whitelist реселлеров |
| `resellers_bl` | array | Blacklist реселлеров |

### Алгоритмы и безопасность

#### JWT Signature Algorithm: RS256

Gcore использует **RS256** (RSA Signature with SHA-256) для подписи JWT токенов.

**Преимущества RS256:**
- Асимметричная криптография
- Публичный ключ может быть распространен свободно
- Только Authentication Service имеет приватный ключ
- Невозможно подделать токен без приватного ключа

**Структура JWT:**

```
Header.Payload.Signature

eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJleHAiOjE2ODI....<signature>
```

**Header:**
```json
{
  "typ": "JWT",
  "alg": "RS256"
}
```

#### Хеширование API Tokens

API Tokens хранятся в БД в хешированном виде с использованием **PBKDF2** или **Argon2**.

**Формат API Token:**
```
<token_id>$<random_string>
```

**Процесс валидации:**
1. Извлечь `token_id` из токена
2. Получить хеш из БД по `token_id`
3. Хешировать `random_string` с тем же алгоритмом
4. Сравнить хеши

**PBKDF2 параметры:**
- Algorithm: SHA-256
- Iterations: 100,000+
- Salt: уникальный для каждого токена

**Argon2 параметры:**
- Type: Argon2id
- Memory: 64 MB
- Iterations: 3
- Parallelism: 4

#### Получение и верификация публичного ключа

**Формат публичного ключа (PEM):**

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3z8F7xkqE2mP9vYmQ1h
K7xR5tN3wL8fV2zX9qY4pM6nH8wT5vU3kL2jR9xW8sF4tY6pQ3nM7wR5xZ8qE2m
...
-----END PUBLIC KEY-----
```

**Алгоритм кеширования:**

```python
class PublicKeyCache:
    def __init__(self):
        self.key = None
        self.updated_at = None
        self.ttl = timedelta(hours=1)
    
    def get_key(self, force_refresh=False):
        now = datetime.now()
        
        # Использовать кеш если актуален
        if (not force_refresh and 
            self.key and 
            self.updated_at and 
            now - self.updated_at < self.ttl):
            return self.key
        
        # Запросить новый ключ
        self.key = fetch_public_key_from_api()
        self.updated_at = now
        return self.key
    
    def verify_token(self, token):
        try:
            # Попытка с текущим ключом
            key = self.get_key()
            payload = jwt.decode(token, key, algorithms=['RS256'])
            return payload
        except jwt.InvalidSignatureError:
            # Ждем и обновляем ключ
            time.sleep(5)
            key = self.get_key(force_refresh=True)
            payload = jwt.decode(token, key, algorithms=['RS256'])
            return payload
```

#### Blacklist механизм

Для отзыва JWT токенов до истечения срока действия используется blacklist.

**Когда токен попадает в blacklist:**
- Пользователь вышел из системы (logout)
- Пользователь сменил пароль
- Администратор отозвал токен
- Подозрительная активность

**Проверка blacklist:**
```python
def is_token_blacklisted(jti):
    # jti - уникальный идентификатор токена
    return redis_client.exists(f"blacklist:{jti}")

def add_to_blacklist(jti, ttl):
    # Добавить в blacklist до истечения срока токена
    redis_client.setex(f"blacklist:{jti}", ttl, "1")
```

**Важно:** Локальная валидация JWT не проверяет blacklist! Используйте `/auth/verify` если нужна актуальная проверка отзыва.

### Regex для распознавания типов токенов

Для автоматического определения типа токена используйте regex:

**JWT Token:**
```regex
^eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9\.[a-zA-Z0-9\+/]+\..+$
```

**API Token:**
```regex
^[0-9]+\$[0-9a-z]{128}$
```

**Пример использования:**

```python
import re

JWT_PATTERN = re.compile(r'^eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9\.[a-zA-Z0-9\+/]+\..+$')
API_TOKEN_PATTERN = re.compile(r'^[0-9]+\$[0-9a-z]{128}$')

def detect_token_type(token):
    token = token.replace("Bearer ", "").replace("APIKey ", "")
    
    if JWT_PATTERN.match(token):
        return "jwt"
    elif API_TOKEN_PATTERN.match(token):
        return "apikey"
    else:
        return "unknown"
```

### Безопасность: Best Practices

#### 1. Всегда используйте HTTPS

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

#### 2. Не логируйте токены полностью

```python
# ❌ Плохо
logger.info(f"Received token: {token}")

# ✅ Хорошо
logger.info(f"Received token: {token[:10]}...{token[-10:]}")
```

#### 3. Храните токены безопасно

**В браузере:**
- ❌ НЕ используйте localStorage для sensitive токенов
- ✅ Используйте httpOnly cookies для refresh tokens
- ✅ Храните access tokens в памяти (React state, Vue store)

**В backend:**
- ✅ Переменные окружения
- ✅ Secret Management (AWS Secrets Manager, Vault)
- ✅ Kubernetes Secrets
- ❌ НЕ коммитьте в Git

#### 4. Rotate API Tokens регулярно

```bash
# Процесс ротации без downtime
# 1. Создать новый токен
curl -X POST https://api.gcorelabs.com/iam/tokens -d '{"name":"Service A v2", ...}'

# 2. Обновить конфигурацию с новым токеном (blue-green deployment)
kubectl set env deployment/service-a GCORE_API_TOKEN=<new_token>

# 3. Подождать rollout
kubectl rollout status deployment/service-a

# 4. Удалить старый токен
curl -X DELETE https://api.gcorelabs.com/iam/tokens/<old_token_id>
```

#### 5. Implement Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(
    app,
    key_func=lambda: g.user_id,  # Лимит на user_id
    default_limits=["1000 per hour", "100 per minute"]
)

@app.route('/api/resource')
@require_auth()
@limiter.limit("10 per minute")
def resource():
    return {"data": "..."}
```

#### 6. Валидация дополнительных claims

```python
def validate_claims(claims, required_user_type=None, required_client_id=None):
    # Проверка expiration
    if claims.get('exp', 0) < time.time():
        raise ValueError("Token expired")
    
    # Проверка user_type
    if required_user_type and claims.get('user_type') != required_user_type:
        raise ValueError(f"Invalid user_type. Required: {required_user_type}")
    
    # Проверка client_id
    if required_client_id and claims.get('client_id') != required_client_id:
        raise ValueError(f"Invalid client_id. Required: {required_client_id}")
    
    return True
```

#### 7. Мониторинг подозрительной активности

```python
def check_suspicious_activity(user_id, ip_address):
    # Проверка на множественные IP
    recent_ips = get_recent_ips_for_user(user_id)
    if len(recent_ips) > 5:
        alert_security_team(user_id, "Multiple IPs detected")
    
    # Проверка на геолокацию
    current_location = geolocate(ip_address)
    last_location = get_last_location(user_id)
    
    if distance(current_location, last_location) > 1000:  # km
        alert_security_team(user_id, "Impossible travel detected")
```

### Производительность и масштабирование

#### Кеширование результатов валидации

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)
def validate_token_cached(token_hash, timestamp):
    # timestamp для cache invalidation каждую минуту
    return validate_token_via_service(token_hash)

def validate_with_cache(token):
    # Хеш токена для кеша
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    # Timestamp с точностью до минуты
    cache_timestamp = int(time.time() // 60)
    
    return validate_token_cached(token_hash, cache_timestamp)
```

#### Connection Pooling для Auth Service

```python
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

def create_session_with_retries():
    session = requests.Session()
    
    # Retry стратегия
    retry = Retry(
        total=3,
        backoff_factor=0.3,
        status_forcelist=[500, 502, 503, 504]
    )
    
    # Connection pooling
    adapter = HTTPAdapter(
        pool_connections=10,
        pool_maxsize=20,
        max_retries=retry
    )
    
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    return session

# Глобальная сессия
auth_session = create_session_with_retries()
```

---

## Метрики и мониторинг

### Метрики Authentication Service

При интеграции с Gcore Authentication Service важно мониторить следующие метрики:

#### Application-level метрики

| Метрика | Тип | Описание | Threshold |
|---------|-----|----------|-----------|
| `auth_validation_requests_total` | Counter | Общее количество запросов к `/auth/verify` | - |
| `auth_validation_duration_seconds` | Histogram | Время обработки запроса валидации | p95 < 100ms |
| `auth_validation_errors_total` | Counter | Количество ошибок валидации | < 1% |
| `auth_public_key_refresh_total` | Counter | Количество обновлений публичного ключа | - |
| `auth_public_key_cache_hits` | Counter | Попадания в кеш публичного ключа | > 99% |
| `auth_blacklist_checks_total` | Counter | Проверки blacklist | - |
| `auth_token_type_requests` | Counter (labels: type) | Запросы по типам токенов | - |

#### HTTP Response codes

| Code | Описание | Action |
|------|----------|--------|
| 200 | Успешная валидация | Normal |
| 401 | Невалидный/истекший токен | Normal (если < 5%) |
| 403 | Токен в blacklist | Alert |
| 500 | Ошибка Auth Service | Alert (immediate) |
| 503 | Auth Service недоступен | Alert (immediate) |

#### Пример Prometheus metrics (Python)

```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Метрики
auth_requests = Counter(
    'gcore_auth_validation_requests_total',
    'Total auth validation requests',
    ['method', 'status']
)

auth_duration = Histogram(
    'gcore_auth_validation_duration_seconds',
    'Auth validation duration',
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

auth_errors = Counter(
    'gcore_auth_validation_errors_total',
    'Total auth validation errors',
    ['error_type']
)

public_key_age = Gauge(
    'gcore_auth_public_key_age_seconds',
    'Age of cached public key'
)

# Использование
def validate_token_with_metrics(token):
    start_time = time.time()
    method = "service" if use_service_validation else "local"
    
    try:
        claims = validate_token(token)
        status = "success" if claims else "invalid"
        auth_requests.labels(method=method, status=status).inc()
        
        if not claims:
            auth_errors.labels(error_type="invalid_token").inc()
        
        return claims
        
    except Exception as e:
        auth_requests.labels(method=method, status="error").inc()
        auth_errors.labels(error_type=type(e).__name__).inc()
        raise
        
    finally:
        duration = time.time() - start_time
        auth_duration.observe(duration)
```

### Failover конфигурация

#### Strategy 1: Multiple Auth Service replicas

```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
  ports:
  - port: 443
    targetPort: 8443
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3  # Минимум 3 реплики
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: auth-service
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 2000m
            memory: 2Gi
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - auth-service
            topologyKey: kubernetes.io/hostname
```

#### Strategy 2: Circuit Breaker pattern

```python
from pybreaker import CircuitBreaker

# Circuit breaker для Auth Service
auth_breaker = CircuitBreaker(
    fail_max=5,           # После 5 ошибок открыть circuit
    timeout_duration=60,  # Ждать 60 секунд перед retry
    exclude=[requests.HTTPError]  # Не считать HTTP ошибки
)

@auth_breaker
def validate_token_via_service(token):
    response = requests.get(
        f"{auth_service_url}/auth/verify",
        headers={"Authorization": token},
        timeout=5
    )
    response.raise_for_status()
    return response.json()

# Fallback при открытом circuit
def validate_token_with_fallback(token):
    try:
        return validate_token_via_service(token)
    except CircuitBreakerError:
        # Circuit открыт - использовать локальную валидацию
        logger.warning("Auth Service circuit open, using local validation")
        return validate_jwt_locally(token)
```

#### Strategy 3: Кеширование с TTL

```python
from cachetools import TTLCache
import threading

# Thread-safe cache
token_cache = TTLCache(maxsize=10000, ttl=300)  # 5 минут TTL
cache_lock = threading.Lock()

def validate_token_with_cache(token):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Проверить кеш
    with cache_lock:
        if token_hash in token_cache:
            return token_cache[token_hash]
    
    # Валидация
    claims = validate_token_via_service(token)
    
    # Сохранить в кеш только если успешно
    if claims:
        with cache_lock:
            token_cache[token_hash] = claims
    
    return claims
```

### Blue-Green Deployment стратегия

Для безопасного обновления интеграции с Authentication Service:

#### Этап 1: Подготовка Green environment

```bash
# Развернуть новую версию приложения (green)
kubectl apply -f deployment-green.yaml

# Проверить что green deployment работает
kubectl get pods -l version=green
```

#### Этап 2: Тестирование Green

```bash
# Направить 10% трафика на green
kubectl patch service my-app -p '{"spec":{"selector":{"version":"green"}}}'

# Мониторинг метрик
kubectl port-forward svc/my-app-green 9090:9090
# Проверить http://localhost:9090/metrics
```

#### Этап 3: Переключение трафика

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
    version: green  # Переключение на green
  ports:
  - port: 80
    targetPort: 8080
```

#### Этап 4: Rollback plan

```bash
# Если что-то пошло не так - быстрый rollback
kubectl patch service my-app -p '{"spec":{"selector":{"version":"blue"}}}'

# Или через deployment
kubectl rollout undo deployment/my-app
```

### Stress Testing рекомендации

#### Load Testing с Locust

```python
from locust import HttpUser, task, between

class AuthLoadTest(HttpUser):
    wait_time = between(0.5, 2)
    
    def on_start(self):
        # Получить токен для тестов
        self.token = "Bearer eyJ0eXAiOiJKV1Qi..."
    
    @task(10)
    def test_protected_endpoint(self):
        self.client.get(
            "/api/protected",
            headers={"Authorization": self.token}
        )
    
    @task(5)
    def test_public_endpoint(self):
        self.client.get("/api/public")
    
    @task(1)
    def test_invalid_token(self):
        self.client.get(
            "/api/protected",
            headers={"Authorization": "Bearer invalid"}
        )

# Запуск:
# locust -f load_test.py --host=https://my-app.example.com --users 1000 --spawn-rate 10
```

#### Целевые показатели производительности

| Метрика | Target | Acceptable |
|---------|--------|------------|
| Response time (p50) | < 50ms | < 100ms |
| Response time (p95) | < 200ms | < 500ms |
| Response time (p99) | < 500ms | < 1000ms |
| Throughput | > 1000 req/s | > 500 req/s |
| Error rate | < 0.1% | < 1% |
| Auth Service availability | > 99.9% | > 99% |

#### Рекомендации по stress testing

1. **Постепенное увеличение нагрузки:**
   - Начните с 10 пользователей
   - Увеличивайте на 10% каждые 30 секунд
   - Найдите breaking point

2. **Тестирование различных сценариев:**
   - Валидные токены (90%)
   - Невалидные токены (5%)
   - Истекшие токены (3%)
   - Токены в blacklist (2%)

3. **Мониторинг во время тестов:**
   - CPU/Memory usage
   - Response times
   - Error rates
   - Auth Service latency

4. **Soak testing:**
   - Постоянная нагрузка в течение 24 часов
   - Проверка на memory leaks
   - Проверка стабильности connections

### Health Check endpoints

#### Приложение

```python
from flask import Flask, jsonify

@app.route('/health')
def health_check():
    checks = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "checks": {}
    }
    
    # Проверка Auth Service connectivity
    try:
        response = requests.get(
            f"{auth_service_url}/health",
            timeout=2
        )
        checks["checks"]["auth_service"] = {
            "status": "up" if response.status_code == 200 else "down",
            "latency_ms": response.elapsed.total_seconds() * 1000
        }
    except Exception as e:
        checks["checks"]["auth_service"] = {
            "status": "down",
            "error": str(e)
        }
        checks["status"] = "degraded"
    
    # Проверка public key cache
    if public_key_cache.key:
        age = (datetime.now() - public_key_cache.updated_at).total_seconds()
        checks["checks"]["public_key_cache"] = {
            "status": "cached",
            "age_seconds": age
        }
    else:
        checks["checks"]["public_key_cache"] = {
            "status": "empty"
        }
    
    status_code = 200 if checks["status"] == "healthy" else 503
    return jsonify(checks), status_code

@app.route('/readiness')
def readiness_check():
    # Проверка готовности к приему трафика
    if not public_key_cache.key:
        return jsonify({"status": "not_ready", "reason": "public_key_not_loaded"}), 503
    
    return jsonify({"status": "ready"}), 200
```

#### Kubernetes Probes

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /readiness
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
```

### Alerting правила (Prometheus)

```yaml
groups:
- name: gcore_auth_alerts
  rules:
  - alert: HighAuthErrorRate
    expr: |
      (
        rate(gcore_auth_validation_errors_total[5m])
        /
        rate(gcore_auth_validation_requests_total[5m])
      ) > 0.05
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High auth validation error rate"
      description: "Auth error rate is {{ $value | humanizePercentage }}"

  - alert: AuthServiceDown
    expr: up{job="auth-service"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Auth Service is down"
      description: "Auth Service has been down for more than 1 minute"

  - alert: SlowAuthValidation
    expr: |
      histogram_quantile(0.95,
        rate(gcore_auth_validation_duration_seconds_bucket[5m])
      ) > 0.5
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Auth validation is slow"
      description: "P95 latency is {{ $value }}s"

  - alert: PublicKeyNotRefreshed
    expr: gcore_auth_public_key_age_seconds > 7200
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Public key is outdated"
      description: "Public key hasn't been refreshed for {{ $value }}s"
```

---

## Сравнение методов и рекомендации

### Полное сравнение методов интеграции

| Критерий | API Tokens | JWT/SAML SSO | Nginx Ingress | Direct Integration |
|----------|-----------|--------------|---------------|-------------------|
| **Сложность внедрения** | ⭐⭐ Низкая | ⭐⭐⭐ Средняя | ⭐⭐ Низкая (при K8s) | ⭐⭐⭐⭐ Средняя-высокая |
| **Время внедрения** | 2-4 часа | 1-2 дня | 1-4 часа | 1-3 дня |
| **Производительность** | ⭐⭐⭐ Хорошая | ⭐⭐⭐⭐ Отличная (с кешем) | ⭐⭐⭐⭐ Отличная | ⭐⭐⭐⭐⭐ Зависит от реализации |
| **Latency** | +20-50ms | +10-30ms (локальная) | +10-30ms | +5-50ms |
| **Масштабируемость** | ⭐⭐⭐ Хорошая | ⭐⭐⭐⭐⭐ Отличная | ⭐⭐⭐⭐⭐ Отличная | ⭐⭐⭐⭐ Хорошая |
| **Гибкость** | ⭐⭐⭐⭐ Высокая | ⭐⭐⭐ Средняя | ⭐⭐ Низкая | ⭐⭐⭐⭐⭐ Максимальная |
| **Независимость от кода** | ❌ Нет | ❌ Нет | ✅ Да | ❌ Нет |
| **Требует K8s** | ❌ Нет | ❌ Нет | ✅ Да | ❌ Нет |
| **Поддержка offline валидации** | ❌ Нет | ✅ Да (JWT) | ⭐ Частично | ✅ Да |
| **Blacklist проверка** | ✅ Да | ⭐ Через API | ✅ Да | ⭐ На выбор |
| **Ротация без downtime** | ✅ Легко | ⭐ Сложнее | ✅ Легко | ⭐ Зависит |
| **Мониторинг** | ⭐⭐⭐ Хороший | ⭐⭐⭐⭐ Отличный | ⭐⭐⭐⭐ Отличный | ⭐⭐⭐⭐⭐ Настраиваемый |
| **Use cases** | M2M, API, Scripts | User auth, SSO | K8s микросервисы | Все сценарии |
| **Поддержка типов токенов** | API Tokens | JWT, SAML | Все | Все |
| **Стоимость поддержки** | ⭐⭐ Низкая | ⭐⭐⭐ Средняя | ⭐⭐ Низкая | ⭐⭐⭐⭐ Высокая |

### Decision Matrix: Выбор метода

```mermaid
graph TD
    Start{Определить требования}
    
    Start -->|Kubernetes?| K8sCheck{В K8s?}
    Start -->|Тип аутентификации?| TypeCheck{M2M или Users?}
    
    K8sCheck -->|Да| NginxQuestion{Хотите изменять код?}
    K8sCheck -->|Нет| TypeCheck
    
    NginxQuestion -->|Нет| NginxIngress[✅ Nginx Ingress]
    NginxQuestion -->|Да| TypeCheck
    
    TypeCheck -->|Machine-to-Machine| APITokens[✅ API Tokens]
    TypeCheck -->|Users| SSOCheck{Есть IdP?}
    TypeCheck -->|Оба| Hybrid[✅ Direct Integration<br/>Гибридный подход]
    
    SSOCheck -->|Да, есть Azure/Okta| SAMLSSO[✅ JWT/SAML SSO]
    SSOCheck -->|Нет| CustomAuth[✅ JWT tokens<br/>+ Direct Integration]
    
    APITokens --> Validate1{Высокая нагрузка?}
    Validate1 -->|Да| Cache[+ Кеширование]
    Validate1 -->|Нет| Simple[Простая валидация через API]
    
    SAMLSSO --> SSOIntegration[Настройка IdP + JWT валидация]
```

### Рекомендации по сценариям

#### Сценарий 1: Стартап - MVP продукт

**Требования:**
- Быстрый запуск
- Небольшая команда
- 100-1000 пользователей
- API + веб-интерфейс

**Рекомендация:** **API Tokens + JWT Direct Integration**

**Почему:**
- Быстрое внедрение (1 день)
- Простая архитектура
- Легко поддерживать
- Можно масштабировать позже

**Архитектура:**
```
Users → Login → JWT Tokens
Services → API Tokens
Both → Direct validation via /auth/verify
```

---

#### Сценарий 2: Корпоративное приложение

**Требования:**
- 10,000+ пользователей
- Есть Azure AD / Okta
- Single Sign-On обязателен
- Compliance требования

**Рекомендация:** **SAML SSO + JWT локальная валидация**

**Почему:**
- Интеграция с существующим IdP
- Централизованное управление пользователями
- Высокая производительность (локальная валидация)
- Соответствие security стандартам

**Архитектура:**
```
Users → Azure AD → SAML → Gcore IAM → JWT
Your App → Validate JWT locally with public key
```

---

#### Сценарий 3: Микросервисная архитектура в K8s

**Требования:**
- 10+ микросервисов
- Kubernetes
- Не хотите изменять каждый сервис
- Нужна централизованная политика безопасности

**Рекомендация:** **Nginx Ingress External Auth**

**Почему:**
- Централизованная аутентификация на уровне Ingress
- Не нужно изменять код сервисов
- Legacy сервисы работают без изменений
- Простое добавление новых сервисов

**Архитектура:**
```
All Requests → Nginx Ingress → Auth Service → Validate
                     ↓
           Inject auth headers
                     ↓
              Microservices (получают готовые headers)
```

---

#### Сценарий 4: API Gateway для партнеров

**Требования:**
- Множество внешних партнеров
- API-only интеграция
- Разные уровни доступа
- Rate limiting per partner

**Рекомендация:** **API Tokens + Custom middleware**

**Почему:**
- Простая выдача токенов партнерам
- Ротация без влияния на других
- Гранулярный контроль доступа
- Легко отозвать токен партнера

**Архитектура:**
```
Partner A → API Token A → Validate → Rate limit by client_id
Partner B → API Token B → Validate → Rate limit by client_id
Custom middleware для дополнительной логики
```

---

#### Сценарий 5: Гибридное решение (B2B SaaS)

**Требования:**
- Пользователи компаний (SSO)
- API для интеграций (M2M)
- Мобильные приложения (JWT)
- Вебхуки (API Tokens)

**Рекомендация:** **Direct Integration с поддержкой всех методов**

**Почему:**
- Поддержка всех сценариев
- Гибкая маршрутизация по типу токена
- Единая точка валидации
- Максимальный контроль

**Архитектура:**
```
Corporate Users → SAML SSO → JWT
Mobile Apps → Login → JWT (access + refresh)
API Integrations → API Tokens
Webhooks → API Tokens

Middleware:
  - Detect token type (regex)
  - Route to appropriate validator
  - Unified claims format
  - Context propagation
```

### Комбинирование методов

Методы можно комбинировать для разных частей приложения:

#### Пример: E-commerce платформа

```yaml
# Public API → Nginx Ingress (для простоты)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: public-api
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "https://auth/verify"
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /v1
        backend:
          service:
            name: api-gateway
```

```python
# Internal services → Direct Integration с кешем
@app.route('/internal/orders')
@require_auth(validation_method="local", cache=True)
def get_orders():
    # Высокая производительность для внутренних запросов
    pass

# Admin panel → SAML SSO обязательно
@app.route('/admin')
@require_auth(validation_method="service", required_sso=True)
def admin_panel():
    if not g.claims.get('sso_entity'):
        return "SSO required", 403
    pass

# Webhooks → API Tokens only
@app.route('/webhooks/payment')
@require_auth(validation_method="service", allowed_types=["api_token"])
def payment_webhook():
    if g.claims.get('token_type') != 'api_token':
        return "API Token required", 403
    pass
```

### Чек-лист выбора метода

#### 1. Оцените ваше окружение

- [ ] Используете Kubernetes?
- [ ] Есть корпоративный IdP (Azure AD, Okta)?
- [ ] Сколько сервисов нужно интегрировать?
- [ ] Какая ожидаемая нагрузка (req/sec)?
- [ ] Критична ли latency?

#### 2. Определите требования

- [ ] Machine-to-machine аутентификация?
- [ ] Пользовательская аутентификация?
- [ ] Нужен Single Sign-On?
- [ ] Требуется offline валидация?
- [ ] Нужна проверка blacklist в реальном времени?

#### 3. Оцените команду

- [ ] Есть опыт с Kubernetes?
- [ ] Есть опыт с SAML/OAuth?
- [ ] Размер команды разработки?
- [ ] Время на внедрение?
- [ ] Бюджет на поддержку?

#### 4. Выберите метод

На основе ответов выше выберите из Decision Matrix.

### Миграционный путь

Если вы начинаете с простого решения и хотите мигрировать:

#### Phase 1: Start Simple (Week 1)
```
API Tokens только
Direct Integration
Валидация через /auth/verify
```

#### Phase 2: Add Users (Week 2-3)
```
+ JWT tokens для пользователей
+ Login/Refresh endpoints
+ Локальная валидация с кешем публичных ключей
```

#### Phase 3: Add SSO (Week 4-5)
```
+ SAML SSO конфигурация
+ Интеграция с Azure AD/Okta
+ JIT provisioning
```

#### Phase 4: Scale (Week 6+)
```
+ Nginx Ingress для новых сервисов
+ Миграция высоконагруженных endpoints на локальную валидацию
+ Advanced caching стратегии
+ Metrics & monitoring
```

### Типичные ошибки и как их избежать

#### ❌ Ошибка 1: Хранение токенов в localStorage

**Проблема:** XSS атаки могут украсть токены

**Решение:**
- Используйте httpOnly cookies для refresh tokens
- Храните access tokens в памяти (React state)
- Используйте Content Security Policy

#### ❌ Ошибка 2: Не кешировать публичные ключи

**Проблема:** Каждая валидация → запрос к IAM API

**Решение:**
```python
# Кешировать на 1 час, обновлять при ошибке
public_key_cache = TTLCache(maxsize=1, ttl=3600)
```

#### ❌ Ошибка 3: Игнорировать exp поле

**Проблема:** Использование истекших токенов

**Решение:**
```python
if claims.get('exp', 0) < time.time():
    raise TokenExpiredError()
```

#### ❌ Ошибка 4: Не обрабатывать Auth Service downtime

**Проблема:** Все requests fail когда Auth Service недоступен

**Решение:**
- Implement circuit breaker
- Fallback на локальную валидацию JWT
- Кеширование результатов валидации

#### ❌ Ошибка 5: Одинаковый API Token для всех сервисов

**Проблема:** Компрометация одного токена → все сервисы под угрозой

**Решение:**
- Один токен на сервис
- Описательные names
- Регулярная ротация

---

## Практические примеры интеграции

Этот раздел содержит end-to-end примеры интеграции для различных сценариев. Все примеры доступны в папке [`examples/`](examples/).

### Пример 1: Python Flask + API Tokens

**Сценарий:** Микросервис для обработки платежей, принимает API Tokens от других сервисов.

**Файл:** [`examples/api_tokens_integration.py`](examples/api_tokens_integration.py)

**Особенности:**
- Валидация API Tokens через `/auth/verify`
- Извлечение claims (user_id, client_id)
- Rate limiting по client_id
- Логирование попыток доступа

### Пример 2: Python FastAPI + JWT валидация

**Сценарий:** REST API с локальной валидацией JWT для высокой производительности.

**Файл:** [`examples/jwt_validation.py`](examples/jwt_validation.py)

**Особенности:**
- Кеширование публичного ключа
- Локальная валидация JWT с RS256
- Fallback на Auth Service при ошибке
- Dependency injection для аутентификации

### Пример 3: Node.js Express + SAML SSO

**Сценарий:** Веб-приложение с Single Sign-On через Azure AD.

**Файл:** [`examples/nodejs_saml_sso.js`](examples/nodejs_saml_sso.js)

**Особенности:**
- SAML Authentication flow
- Session management
- JWT refresh logic
- Protected routes

### Пример 4: Kubernetes Nginx Ingress

**Сценарий:** Микросервисная архитектура с централизованной аутентификацией.

**Файлы:** [`examples/nginx_ingress_configs/`](examples/nginx_ingress_configs/)

**Конфигурации:**
- `auth-service.yaml` — Deployment Auth Service
- `app-with-auth.yaml` — Ingress с аутентификацией
- `app-mixed.yaml` — Ingress с публичными и приватными путями
- `app-with-snippet.yaml` — Использование auth-snippet

### Пример 5: React SPA + FastAPI Backend

**Сценарий:** Single Page Application с token management.

**Файлы:**
- [`examples/react_spa_integration/`](examples/react_spa_integration/)

**Компоненты:**
- AuthContext для React
- Axios interceptors для auto-refresh
- Protected routes
- Backend middleware

### Пример 6: Гибридная интеграция (SSO + API Tokens)

**Сценарий:** B2B платформа с пользователями (SSO) и API интеграциями.

**Файл:** [`examples/hybrid_integration.py`](examples/hybrid_integration.py)

**Особенности:**
- Автоопределение типа токена
- Разные validation strategies
- Unified claims format
- Role-based access control

---

## Troubleshooting и FAQ

### Частые ошибки и их решения

#### Ошибка: "Invalid signature" при валидации JWT

**Симптомы:**
```python
jwt.exceptions.InvalidSignatureError: Signature verification failed
```

**Причины:**
1. Публичный ключ устарел (Gcore обновил ключи)
2. Токен подписан другим ключом
3. Токен поврежден

**Решение:**
```python
try:
    payload = jwt.decode(token, public_key, algorithms=["RS256"])
except jwt.InvalidSignatureError:
    # Обновить публичный ключ и повторить
    logger.info("Refreshing public key due to signature error")
    time.sleep(5)  # Rate limiting
    public_key = fetch_public_key(force_refresh=True)
    payload = jwt.decode(token, public_key, algorithms=["RS256"])
```

**Проверка:**
```bash
# Проверить что токен валидный JWT
echo "eyJ0eXAiOiJKV1QiLCJhbGc..." | cut -d'.' -f1 | base64 -d
# Должно вернуть: {"typ":"JWT","alg":"RS256"}
```

---

#### Ошибка: "Token has expired"

**Симптомы:**
```
401 Unauthorized
{"error": "Token has expired"}
```

**Причины:**
1. ACCESS токен истек (lifetime: 1 час)
2. REFRESH токен истек (lifetime: 24 часа)
3. API Token достиг exp_date

**Решение для ACCESS токенов:**
```python
def refresh_access_token(refresh_token):
    """Обновить ACCESS токен используя REFRESH токен"""
    response = requests.post(
        "https://api.gcorelabs.com/auth/jwt/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"}
    )
    
    if response.status_code == 200:
        return response.json()['access']
    else:
        # REFRESH токен тоже истек - нужен re-login
        return None
```

**Решение для API Tokens:**
1. Проверить exp_date токена через IAM API
2. Создать новый токен
3. Ротировать в приложении

---

#### Ошибка: Auth Service возвращает 503

**Симптомы:**
```
503 Service Unavailable
Connection timeout
```

**Причины:**
1. Auth Service перегружен
2. Network issues
3. Auth Service недоступен

**Решение: Circuit Breaker + Fallback**
```python
from pybreaker import CircuitBreaker

auth_breaker = CircuitBreaker(fail_max=5, timeout_duration=60)

@auth_breaker
def validate_token_via_service(token):
    return requests.get(auth_service_url, headers={"Authorization": token})

def validate_with_fallback(token):
    try:
        return validate_token_via_service(token)
    except CircuitBreakerError:
        logger.warning("Circuit breaker open, using local JWT validation")
        return validate_jwt_locally(token)
```

**Мониторинг:**
```yaml
# Prometheus alert
- alert: AuthServiceDown
  expr: up{job="auth-service"} == 0
  for: 1m
  labels:
    severity: critical
```

---

#### Ошибка: Nginx Ingress не передает headers в backend

**Симптомы:**
- Backend получает пустые headers (X-User-Id, X-Client-Id и т.д.)
- Аутентификация проходит успешно, но данные не передаются

**Причины:**
1. Неправильная конфигурация `auth-response-headers`
2. Headers названы неправильно
3. Auth Service не возвращает headers

**Решение:**

1. Проверить annotation:
```yaml
nginx.ingress.kubernetes.io/auth-response-headers: "X-User-Id, X-Client-Id, X-User-Email"
```

2. Проверить что Auth Service возвращает headers:
```bash
curl -v http://auth-service/auth/verify \
  -H "Authorization: Bearer <token>"
# Должно показать headers в ответе
```

3. Проверить Nginx logs:
```bash
kubectl logs -n ingress-nginx <nginx-pod> | grep auth
```

---

#### Ошибка: SAML metadata parsing failed

**Симптомы:**
```
Failed to parse SAML metadata
Invalid XML structure
```

**Причины:**
1. Некорректный XML файл
2. Unsupported IdP configuration
3. Missing required fields

**Решение:**

1. Валидировать XML:
```bash
xmllint --noout metadata.xml
```

2. Проверить обязательные поля:
```xml
<EntityDescriptor entityID="...">
  <IDPSSODescriptor>
    <SingleSignOnService Location="..." Binding="..."/>
    <KeyDescriptor use="signing">
      <X509Certificate>...</X509Certificate>
    </KeyDescriptor>
  </IDPSSODescriptor>
</EntityDescriptor>
```

3. Скачать свежий metadata от IdP:
```bash
curl -o metadata.xml "https://login.microsoftonline.com/.../federationmetadata/..."
```

---

#### Ошибка: API Token validation is slow

**Симптомы:**
- Latency > 500ms на валидацию
- Requests timeout
- Poor performance

**Причины:**
1. Нет кеширования результатов
2. Auth Service далеко географически
3. Много concurrent requests

**Решение:**

1. **Включить кеширование:**
```python
from cachetools import TTLCache

cache = TTLCache(maxsize=10000, ttl=300)

def validate_with_cache(token):
    cache_key = hashlib.sha256(token.encode()).hexdigest()
    if cache_key in cache:
        return cache[cache_key]
    
    claims = validate_token(token)
    if claims:
        cache[cache_key] = claims
    return claims
```

2. **Connection pooling:**
```python
session = requests.Session()
adapter = HTTPAdapter(pool_connections=10, pool_maxsize=20)
session.mount('https://', adapter)
```

3. **Мигрировать на локальную валидацию JWT:**
```python
# Вместо валидации через API
claims = validate_token_via_api(token)

# Использовать локальную валидацию
claims = jwt.decode(token, public_key, algorithms=["RS256"])
```

---

### FAQ

#### Q: Как часто нужно ротировать API Tokens?

**A:** Рекомендации:
- **Production:** Каждые 90 дней
- **Development:** Каждые 180 дней
- **После security incident:** Немедленно

Процесс ротации без downtime:
1. Создать новый токен
2. Deploy с новым токеном (blue-green)
3. Удалить старый токен после подтверждения

---

#### Q: Можно ли использовать один API Token для нескольких сервисов?

**A:** Технически - да, но **не рекомендуется**:

❌ **Проблемы:**
- Компрометация одного сервиса → все под угрозой
- Сложно отследить какой сервис делает запросы
- Нельзя отозвать доступ одного сервиса

✅ **Best practice:**
- Один токен на сервис
- Описательные имена: "Service-Name-Environment"
- Отдельное отслеживание `last_usage` per token

---

#### Q: Нужно ли проверять blacklist при локальной валидации JWT?

**A:** **Да, если критична безопасность**.

JWT токены статлесс и не могут быть отозваны до exp. Blacklist механизм позволяет отозвать токен принудительно.

**Варианты:**

1. **Всегда проверять через `/auth/verify`** (проверяет blacklist):
```python
claims = validate_via_auth_service(token)
```

2. **Локальная валидация + периодическая проверка blacklist:**
```python
claims = jwt.decode(token, public_key, algorithms=["RS256"])

# Проверять blacklist каждый N-ый запрос или раз в минуту
if should_check_blacklist(claims['jti']):
    if is_blacklisted(claims['jti']):
        raise TokenBlacklistedError()
```

3. **Кеширование blacklist локально:**
```python
# Синхронизировать blacklist каждые 30 секунд
blacklist_cache = set()

def sync_blacklist():
    blacklist_cache.update(fetch_blacklist_from_redis())

# В валидации
if claims['jti'] in blacklist_cache:
    raise TokenBlacklistedError()
```

---

#### Q: Как обрабатывать истечение REFRESH токена?

**A:** REFRESH токен действует 24 часа. После истечения нужен повторный login.

**Best practices:**

1. **Автоматический refresh перед истечением:**
```javascript
// React example
function scheduleTokenRefresh(accessToken, refreshToken) {
  const payload = jwtDecode(accessToken);
  const expiresIn = payload.exp * 1000 - Date.now();
  
  // Обновить за 5 минут до истечения
  const refreshIn = expiresIn - (5 * 60 * 1000);
  
  setTimeout(async () => {
    const newAccessToken = await refreshAccessToken(refreshToken);
    setAccessToken(newAccessToken);
    scheduleTokenRefresh(newAccessToken, refreshToken);
  }, refreshIn);
}
```

2. **Silent re-authentication (для SSO):**
```javascript
// Если REFRESH истек - попробовать SSO re-auth без redirect
if (refreshTokenExpired && isSSOUser) {
  try {
    await silentSSOReauth();
  } catch {
    redirectToLogin();
  }
}
```

3. **Предупреждение пользователя:**
```javascript
// За 5 минут до истечения REFRESH токена
if (refreshTokenExpiresIn < 5 * 60 * 1000) {
  showWarning("Session expiring soon. Please save your work.");
}
```

---

#### Q: Можно ли использовать Gcore Auth для мобильных приложений?

**A:** **Да**, но с особенностями:

**Рекомендуемый flow:**

1. **Login:** POST `/auth/jwt/login` → получить ACCESS + REFRESH
2. **Хранение:**
   - iOS: Keychain
   - Android: EncryptedSharedPreferences
3. **Refresh:** Автоматически обновлять ACCESS токен
4. **Logout:** Удалить токены из secure storage

**Пример (React Native):**
```javascript
import * as SecureStore from 'expo-secure-store';

// Сохранить
await SecureStore.setItemAsync('access_token', accessToken);
await SecureStore.setItemAsync('refresh_token', refreshToken);

// Получить
const accessToken = await SecureStore.getItemAsync('access_token');

// Удалить
await SecureStore.deleteItemAsync('access_token');
await SecureStore.deleteItemAsync('refresh_token');
```

**Важно:**
- ❌ НЕ хранить в AsyncStorage (небезопасно)
- ✅ Использовать Keychain/EncryptedSharedPreferences
- ✅ Implement biometric authentication для доступа к токенам

---

#### Q: Как мигрировать с технических токенов на API Tokens?

**A:** Пошаговый план миграции:

**Phase 1: Подготовка (Week 1)**
1. Создать API Tokens для всех сервисов
2. Обновить документацию
3. Тестирование в dev/staging

**Phase 2: Параллельная поддержка (Week 2-3)**
```python
def validate_token(auth_header):
    # Поддержка обоих типов
    if is_technical_token(auth_header):
        logger.warning("Technical token used (deprecated)")
        return validate_technical_token(auth_header)
    elif is_api_token(auth_header):
        return validate_api_token(auth_header)
    else:
        raise InvalidTokenError()
```

**Phase 3: Миграция сервисов (Week 4-6)**
- Сервис за сервисом обновлять на API Tokens
- Мониторить использование технических токенов
- Логировать все использования

**Phase 4: Deprecation (Week 7-8)**
```python
if is_technical_token(auth_header):
    # Последнее предупреждение
    logger.error("Technical tokens will be disabled in 7 days!")
    alert_team("Service X still using technical token")
    # Но пока разрешить
    return validate_technical_token(auth_header)
```

**Phase 5: Отключение (Week 9)**
```python
if is_technical_token(auth_header):
    raise TokenDeprecatedError("Technical tokens are no longer supported")
```

---

#### Q: Как организовать rate limiting по client_id?

**A:** **Несколько подходов:**

**1. На уровне приложения:**
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=lambda: g.client_id,  # Rate limit по client_id
    default_limits=["1000 per hour"]
)

@app.route('/api/resource')
@require_auth()
@limiter.limit("100 per minute")
def resource():
    return {"data": "..."}
```

**2. На уровне Nginx Ingress:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    # Rate limiting по X-Client-Id header (от Auth Service)
    nginx.ingress.kubernetes.io/limit-rps: "100"
    nginx.ingress.kubernetes.io/limit-key: "$http_x_client_id"
```

**3. На уровне API Gateway:**
```yaml
# Kong example
plugins:
  - name: rate-limiting
    config:
      minute: 100
      policy: local
      limit_by: header
      header_name: X-Client-Id
```

---

#### Q: Что делать если Auth Service временно недоступен?

**A:** **Implement graceful degradation:**

**Strategy 1: Fallback на локальную валидацию**
```python
def validate_token_with_degradation(token):
    try:
        # Попытка через Auth Service (проверяет blacklist)
        return validate_via_service(token, timeout=2)
    except (Timeout, ConnectionError):
        logger.warning("Auth Service unavailable, using local validation")
        # Fallback на локальную валидацию (без blacklist)
        return validate_jwt_locally(token)
```

**Strategy 2: Кеширование с увеличенным TTL**
```python
def validate_with_extended_cache(token):
    cache_key = hash(token)
    
    # Обычный кеш (5 минут)
    if cache_key in normal_cache:
        return normal_cache[cache_key]
    
    try:
        claims = validate_via_service(token)
        normal_cache[cache_key] = claims
        # Также сохранить в extended cache (1 час)
        extended_cache[cache_key] = claims
        return claims
    except ServiceUnavailable:
        # Использовать extended cache при недоступности
        if cache_key in extended_cache:
            logger.warning("Using extended cache due to service unavailability")
            return extended_cache[cache_key]
        raise
```

**Strategy 3: Health-based routing**
```yaml
# Kubernetes: Несколько Auth Service инстансов в разных регионах
apiVersion: v1
kind: Service
metadata:
  name: auth-service-primary
spec:
  ...
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service-fallback
spec:
  ...
```

```python
def validate_with_failover(token):
    try:
        return validate_via_service(token, url=PRIMARY_AUTH_SERVICE)
    except:
        logger.warning("Primary auth service failed, trying fallback")
        return validate_via_service(token, url=FALLBACK_AUTH_SERVICE)
```

---

## Приложения

### A. Ссылки на Confluence документацию

Этот документ основан на следующих страницах Gcore Confluence:

#### Основные документы

1. **Authentication service**  
   https://wiki.gcore.lu/spaces/IAMTEAM/pages/85035873/Authentication+service  
   Описание архитектуры Authentication Service, типы токенов, схемы интеграции, метрики.

2. **POC-2: Nginx Ingress & external authentication**  
   https://wiki.gcore.lu/spaces/IAMTEAM/pages/85035324/POC-2+Nginx+Ingress+external+authentication  
   Proof of Concept для Nginx Ingress external auth, примеры конфигураций.

3. **API tokens integration guide**  
   https://wiki.gcore.lu/spaces/IAMTEAM/pages/85047697/API+tokens+integration+guide  
   Руководство по интеграции API Tokens, endpoint `/auth/verify`, потоки валидации.

4. **Sysadmin API tokens**  
   https://wiki.gcore.lu/spaces/IAMTEAM/pages/85061478/Sysadmin+API+tokens  
   CRUDL API для управления API Tokens, создание через Admin Panel.

5. **Users. Authentication and authorization**  
   https://wiki.gcore.lu/spaces/DEV/pages/85041814/Users.+Authentication+and+authorization  
   JWT Payload structure, типы пользователей, формат токенов, валидация.

#### SAML SSO документация

6. **Identity providers**  
   https://wiki.gcore.lu/spaces/IAMTEAM/pages/76051850/Identity+providers  
   Обзор поддерживаемых Identity Providers.

7. **Public SAML SSO**  
   https://wiki.gcore.lu/spaces/DEV/pages/114091720/Public+SAML+SSO  
   SAML SSO workflow, поддерживаемые IdP, настройка.

8. **Instructions to Update SAML SSO Metadata for Gcore Reseller**  
   https://wiki.gcore.lu/spaces/DEV/pages/191246524/Instructions+to+Update+SAML+SSO+Metadata+for+Gcore+Reseller  
   Пошаговое руководство по обновлению SAML metadata.

9. **IAM-1611 JWT SSO SD (Draft)**  
   https://wiki.gcore.lu/spaces/DEV/pages/137631744/IAM-1611+JWT+SSO+SD+Draft  
   JWT SSO для специфичных интеграций (Zendesk).

#### Конфигурация и Use Cases

10. **Common requirements**  
    https://wiki.gcore.lu/spaces/DEV/pages/164467341/Common+requirements  
    Общие требования к настройкам авторизации, email уведомления, flows.

11. **All cases [relevant for May 2023]**  
    https://wiki.gcore.lu/spaces/DEV/pages/149227516/All+cases+relevant+for+May+2023  
    Различные сценарии приглашения и входа пользователей.

### B. API Спецификация

**OpenAPI Specification:**
- `auth-service.yaml` (прикреплен к странице Authentication service)
- `redoc-static.html` — интерактивная документация

**Base URLs:**
- **Production:** `https://api.gcorelabs.com`
- **PreProd:** `https://api.preprod.gcorelabs.com`

**Ключевые endpoints:**

```
# Authentication
POST   /auth/jwt/login          - Логин пользователя
POST   /auth/jwt/refresh        - Обновление токена
GET    /auth/verify             - Валидация токена

# IAM API
GET    /iam/public-key          - Получение публичного ключа
GET    /iam/tokens              - Список API Tokens
POST   /iam/tokens              - Создание API Token
GET    /iam/tokens/{id}         - Детали API Token
DELETE /iam/tokens/{id}         - Удаление API Token
```

### C. Чек-листы для внедрения

#### Чек-лист: API Tokens Integration

```
Подготовка:
[ ] Определить сервисы требующие API Tokens
[ ] Создать токены через Admin Panel или IAM API
[ ] Задокументировать назначение каждого токена
[ ] Настроить безопасное хранение (env vars, secrets)

Разработка:
[ ] Реализовать валидацию через /auth/verify
[ ] Добавить error handling (401, 500, timeout)
[ ] Реализовать кеширование результатов (optional)
[ ] Добавить логирование (user_id, client_id, path)
[ ] Написать unit тесты

Деплой:
[ ] Тестирование в dev/staging
[ ] Настроить мониторинг (latency, error rate)
[ ] Настроить алерты (auth service down, high error rate)
[ ] Документация для команды
[ ] Production deployment

Поддержка:
[ ] Мониторить last_usage токенов
[ ] Настроить календарь ротации (каждые 90 дней)
[ ] Регулярно проверять неиспользуемые токены
[ ] Удалять deprecated токены
```

#### Чек-лист: JWT/SAML SSO Integration

```
Подготовка:
[ ] Получить доступ к IdP (Azure AD, Okta, etc.)
[ ] Скачать SAML metadata XML
[ ] Определить list доменов для auto-redirect
[ ] Определить требуемые SAML атрибуты (email, firstName, etc.)

Конфигурация Gcore:
[ ] Войти в Admin Panel как Reseller
[ ] Перейти в Security → Authorization
[ ] Загрузить SAML metadata XML
[ ] Настроить domains
[ ] Включить SSO для Control Panel / Admin Panel
[ ] Настроить "Force redirect to IdP" (optional)
[ ] Сохранить изменения

Конфигурация IdP:
[ ] Создать приложение в IdP
[ ] Настроить Reply URL / ACS URL
[ ] Настроить SAML атрибуты mapping
[ ] Добавить пользователей в приложение
[ ] Протестировать SAML flow

Разработка (для вашего портала):
[ ] Реализовать локальную валидацию JWT
[ ] Кеширование публичного ключа
[ ] Handling JWT refresh
[ ] Error handling (expired, invalid)
[ ] Logout flow

Тестирование:
[ ] SP-initiated flow (из вашего портала)
[ ] IdP-initiated flow (из IdP)
[ ] JIT (Just-In-Time) provisioning
[ ] Token refresh
[ ] Logout

Production:
[ ] Документация для пользователей
[ ] Мониторинг SSO errors
[ ] Алерты на failed logins
[ ] Support процесс для SSO issues
```

#### Чек-лист: Nginx Ingress External Auth

```
Подготовка:
[ ] Kubernetes cluster с Nginx Ingress Controller
[ ] Определить список сервисов для интеграции
[ ] Определить публичные endpoints (без auth)
[ ] Deployment стратегия (blue-green, canary)

Deployment Auth Service:
[ ] Deploy Authentication Service (минимум 3 реплики)
[ ] Настроить HPA (auto-scaling)
[ ] Настроить PodDisruptionBudget
[ ] Настроить health checks
[ ] Тестирование доступности

Конфигурация Ingress:
[ ] Добавить nginx.ingress.kubernetes.io/auth-url annotation
[ ] Добавить nginx.ingress.kubernetes.io/auth-response-headers
[ ] Настроить auth-snippet для публичных путей (optional)
[ ] Настроить timeouts
[ ] Настроить rate limiting (optional)

Backend изменения:
[ ] Обновить код для чтения X-User-Id, X-Client-Id headers
[ ] Удалить старую логику аутентификации (optional)
[ ] Добавить логирование с user_id
[ ] Unit тесты

Тестирование:
[ ] Тест с валидным токеном → 200 + headers
[ ] Тест с невалидным токеном → 401
[ ] Тест без токена → 401
[ ] Тест публичных endpoints → 200 (без токена)
[ ] Load testing

Production:
[ ] Rolling update ingress конфигураций
[ ] Мониторинг auth service latency
[ ] Мониторинг 401/403 rate
[ ] Rollback план
```

### D. Шаблоны для разных сценариев

#### Шаблон: Flask приложение с API Tokens

```python
from flask import Flask, g, request, jsonify
from functools import wraps
import requests

app = Flask(__name__)

AUTH_SERVICE = "https://api.gcorelabs.com"

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Missing token"}), 401
        
        # Валидация через Auth Service
        resp = requests.get(
            f"{AUTH_SERVICE}/auth/verify",
            params={"header_types": "apikey,jwt", "response_format": "json_body"},
            headers={"Authorization": token}
        )
        
        if resp.status_code != 200:
            return jsonify({"error": "Invalid token"}), 401
        
        g.claims = resp.json()
        g.user_id = g.claims['user_id']
        return f(*args, **kwargs)
    return decorated

@app.route('/api/resource')
@require_auth
def resource():
    return {"user_id": g.user_id, "data": "..."}
```

#### Шаблон: FastAPI с JWT валидацией

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt

app = FastAPI()
security = HTTPBearer()

async def get_current_user(creds = Depends(security)):
    try:
        token = creds.credentials
        public_key = get_public_key()  # Кеширование
        payload = jwt.decode(token, public_key, algorithms=["RS256"])
        return payload
    except:
        raise HTTPException(401, "Invalid token")

@app.get("/api/resource")
async def resource(user = Depends(get_current_user)):
    return {"user_id": user['user_id'], "data": "..."}
```

#### Шаблон: Node.js Express

```javascript
const express = require('express');
const axios = require('axios');

const app = express();

async function requireAuth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({error: 'Missing token'});
  }
  
  try {
    const response = await axios.get(
      'https://api.gcorelabs.com/auth/verify',
      {
        params: {header_types: 'apikey,jwt', response_format: 'json_body'},
        headers: {Authorization: token}
      }
    );
    
    req.user = response.data;
    next();
  } catch {
    res.status(401).json({error: 'Invalid token'});
  }
}

app.get('/api/resource', requireAuth, (req, res) => {
  res.json({user_id: req.user.user_id, data: '...'});
});
```

### E. Глоссарий терминов

| Термин | Определение |
|--------|-------------|
| **ACCESS Token** | JWT токен для доступа к ресурсам (lifetime: 1 час) |
| **API Token** | Permanent token для machine-to-machine интеграции |
| **Argon2** | Алгоритм хеширования для хранения API Tokens |
| **Authentication** | Процесс проверки идентичности (кто вы) |
| **Authorization** | Процесс проверки прав доступа (что вам разрешено) |
| **Blacklist** | Список отозванных JWT токенов до истечения exp |
| **Claims** | Данные внутри JWT (user_id, email, exp, etc.) |
| **exp** | Unix timestamp истечения токена |
| **IdP** | Identity Provider (Azure AD, Okta, etc.) |
| **jti** | JWT ID - уникальный идентификатор токена |
| **JWT** | JSON Web Token - self-contained токен с claims |
| **JIT** | Just-In-Time provisioning - автосоздание пользователей при SSO |
| **PBKDF2** | Password-Based Key Derivation Function 2 |
| **REFRESH Token** | JWT токен для обновления ACCESS токена (24 часа) |
| **RS256** | RSA Signature with SHA-256 для подписи JWT |
| **SAML** | Security Assertion Markup Language для SSO |
| **SCIM** | System for Cross-domain Identity Management |
| **SP** | Service Provider (ваше приложение) |
| **SSO** | Single Sign-On - один логин для многих приложений |

### F. Полезные команды

#### Работа с JWT токенами

```bash
# Декодировать JWT (без проверки подписи)
echo "eyJ0eXAiOiJKV1QiLCJhbGc..." | cut -d'.' -f2 | base64 -d | jq

# Проверить exp время
echo "eyJ0eXAiOiJKV1QiLCJhbGc..." | cut -d'.' -f2 | base64 -d | jq '.exp | todate'

# Получить user_id из токена
echo "eyJ0eXAiOiJKV1QiLCJhbGc..." | cut -d'.' -f2 | base64 -d | jq '.user_id'
```

#### Тестирование endpoints

```bash
# Тест с API Token
curl -H "Authorization: APIKey 24126\$98c2..." \
     https://api.example.com/resource

# Тест с JWT
curl -H "Authorization: Bearer eyJ0eXAiOi..." \
     https://api.example.com/resource

# Тест валидации через Auth Service
curl -X GET "https://api.gcorelabs.com/auth/verify?header_types=jwt&response_format=json_body" \
     -H "Authorization: Bearer eyJ0eXAiOi..."
```

#### Kubernetes debugging

```bash
# Проверить Ingress annotations
kubectl get ingress my-app -o yaml | grep nginx.ingress

# Логи Nginx Ingress Controller
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=100 -f

# Проверить auth-url connectivity от Ingress pod
kubectl exec -n ingress-nginx <nginx-pod> -- curl http://auth-service/health

# Посмотреть headers переданные в Pod
kubectl exec <app-pod> -- env | grep X_
```

### G. Контакты и поддержка

**Внутренние ресурсы Gcore:**
- Confluence: https://wiki.gcore.lu/
- Admin Panel (Prod): https://admin.gcore.top/
- Admin Panel (PreProd): https://admin.admin.preprod.world/

**API Documentation:**
- Production: https://api.gcorelabs.com/docs
- PreProd: https://api.preprod.gcorelabs.com/docs

**Для вопросов по интеграции:**
- IAM Team в Confluence: https://wiki.gcore.lu/spaces/IAMTEAM

---

## Заключение

Это руководство предоставляет исчерпывающую информацию для интеграции авторизации Gcore в ваш внешний портал. Вы можете выбрать подходящий метод на основе ваших требований:

- **API Tokens** — для machine-to-machine интеграций
- **JWT/SAML SSO** — для корпоративных пользователей с IdP
- **Nginx Ingress External Auth** — для микросервисов в Kubernetes
- **Direct Integration** — для максимальной гибкости

Все примеры кода доступны в папке [`examples/`](examples/).

**Следующие шаги:**
1. Выберите метод интеграции (см. Decision Matrix)
2. Изучите соответствующий раздел документации
3. Проверьте примеры кода
4. Реализуйте и протестируйте в dev окружении
5. Deploy в production с мониторингом

**Удачи с интеграцией! 🚀**

---

*Документ создан на основе официальной документации Gcore Confluence*  
*Версия: 1.0*  
*Дата: Декабрь 2024*


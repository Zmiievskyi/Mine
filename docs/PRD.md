# MineGNK — Product Requirements Document

## 1. Vision

**MineGNK** — веб-портал для клиентов Gcore, которые арендуют GPU-серверы для участия в сети Gonka.

Портал предоставляет:
- Прозрачный мониторинг нод и дохода
- Единую точку входа для заказа новых нод
- Будущее: оплата GPU-аренды и других услуг Gcore

### Ключевой принцип
MineGNK — это **мониторинговый портал**, а не платформа self-service provisioning.

```
┌─────────────────────────────────────────────────────────────┐
│                     MineGNK Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  USER (Frontend - Angular 18)                              │
│    │                                                        │
│    └─→ Backend API (NestJS)                                │
│          │                                                  │
│          ├─→ Auth & User Management                        │
│          │     └─ user_id ↔ node_identifiers               │
│          │                                                  │
│          ├─→ Node Data Aggregator                          │
│          │     ├─ Hyperfusion Tracker                      │
│          │     ├─ Hashiro API                              │
│          │     ├─ Gonka API (epochs/participants)          │
│          │     └─ Cache (1-5 min TTL)                      │
│          │                                                  │
│          └─→ Gcore API (read-only)                         │
│                └─ Instance info (GPU specs)                │
│                                                             │
│  SUPPORT TEAM                                               │
│    │                                                        │
│    ├─→ Получает заявки на новые ноды                       │
│    ├─→ Создаёт VM на Gcore Cloud                           │
│    └─→ Привязывает node ID к user в Admin Panel            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Goals

| Goal | Description |
|------|-------------|
| Упростить вход в Gonka | "Майнинг под ключ" для клиентов Gcore |
| Увеличить загрузку GPU | Привлечь mining-клиентов на GPU-пул Gcore |
| Единый интерфейс | Статус нод, health, доход, заявки в одном месте |
| Основа для автоматизации | Будущий автоматический деплой нод через API |

---

## 3. Target Audience

### Primary (MVP)
- **Crypto/AI майнеры** без сильного DevOps/ML-бэкграунда
- **Трейдеры/инвесторы**, желающие получать доход с AI-инфраструктуры без владения железом

### Future
- **Институционалы** — фонды, небольшие хостинг-операторы

---

## 4. About Gonka Network

### Что такое Gonka?
Gonka — децентрализованная AI-сеть, использующая Proof-of-Work для реальных AI-вычислений (inference), а не бессмысленного хэшинга.

### Ключевые характеристики
- **Токен**: GNK (~310,000/день, halving каждые 4 года)
- **Поддерживаемые GPU**: 3080, 4090, H100, H200 и ~20 других моделей
- **Wallet**: Cosmos-based (Keplr/Leap)
- **Сеть**: ~6000 H100-эквивалентов, рост ~50%/месяц

### Связь с Gcore
- **Gcore = инфраструктура** — GPU серверы, которые сдаются в аренду
- **Gonka = данные** — метрики нод, доходы, статусы

---

## 5. User Stories (MVP)

### 5.1 Авторизация
> Как пользователь, я хочу войти в личный кабинет, чтобы видеть только свои ноды и статистику.

> Как администратор Gcore, я хочу видеть всех пользователей и управлять привязкой нод.

### 5.2 Просмотр списка нод
> Как пользователь, я хочу видеть список моих нод с ключевой информацией:
> - Node ID / wallet / host name
> - Статус (healthy / unhealthy / jailed / offline)
> - Тип GPU (A100, H100 и т.д.)
> - Производительность (tokens/sec, jobs/day)
> - Доход (GNK/день, GNK всего)

### 5.3 Детали ноды
> Как пользователь, я хочу открыть страницу ноды и увидеть:
> - История статуса (uptime/health)
> - История дохода (график GNK per day)
> - Технические параметры (GPU, RAM, локация)
> - Активная модель (если есть)
> - История inference jobs

### 5.4 Заявка на новую ноду
> Как пользователь, я хочу нажать "Add Node", заполнить форму и отправить заявку в Support.

Форма включает:
- Желаемый тип GPU
- Количество нод
- Бюджет/диапазон
- Сеть (Gonka, future: другие)
- Комментарии

### 5.5 Профиль пользователя
> Как пользователь, я хочу видеть и редактировать:
> - Email
> - Telegram/Discord (для нотификаций)
> - Предпочитаемая валюта (USD/EUR/GNK)

### 5.6 Admin Panel
> Как администратор, я хочу:
> - Видеть всех пользователей
> - Привязывать node identifiers к user_id
> - Видеть все заявки и менять их статусы

---

## 6. Data Architecture

### 6.1 Node Identification

**MVP решение**: Support привязывает ноды вручную через Admin Panel.

**Flow:**
1. User заказывает ноду через форму
2. Support создаёт VM на Gcore
3. Support заходит в Admin Panel
4. Support привязывает node_identifier к user_id
5. User видит свою ноду в Dashboard

**Node Identifiers** (требует исследования):
- Wallet address
- Operator address
- Worker ID
- Validator ID
- Node ID из трекера

### 6.2 Data Sources

| Source | URL | Data | Priority |
|--------|-----|------|----------|
| Gonka API | `node{1,2,3}.gonka.ai:8000` | `/v1/epochs/current/participants` — validators, hosts | HIGH |
| Hyperfusion | `tracker.gonka.hyperfusion.io` | Node stats, earnings, health | HIGH |
| Hashiro | `hashiro.tech/gonka` | Pool stats, earnings | HIGH |
| Gcore API | `api.gcore.com` | Instance specs (GPU type, region) | LOW |

### 6.3 Backend Data Aggregation

**Почему backend, а не frontend?**

1. **Безопасность** — логика user↔nodes скрыта на сервере
2. **Контроль доступа** — backend знает, чьи ноды показывать
3. **Кеширование** — не спамим публичные трекеры
4. **Future payments** — вся бизнес-логика на backend

**Data Flow:**
```
User Login → Backend проверяет user_id
           → Берёт node_identifiers из БД (user_nodes)
           → Запрашивает данные из трекеров (cache 1-5 min)
           → Возвращает JSON с данными только его нод
```

### 6.4 Caching Strategy

- **TTL**: 1-5 минут
- **Storage**: PostgreSQL или Redis
- **Update**: Background job (cron) или on-demand с TTL check

---

## 7. Functional Requirements

### 7.1 Authentication
- Email + пароль (MVP)
- Google OAuth (implemented - auto-links by email)
- JWT tokens (7-day expiry)
- Roles: User, Admin

### 7.2 Dashboard
- Summary cards: Active Nodes, Total GPUs, Monthly Earnings, Pending Requests
- Earnings chart (daily/weekly)
- Node overview table
- Recent activity feed

### 7.3 My Nodes (List)
- Table с фильтрами и сортировкой
- Columns: Node ID, Status, GPU, Earnings/day, Total Earnings
- Status badges (healthy/unhealthy/jailed)
- Link to details

### 7.4 Node Details
- Tabs: Overview, Metrics, History
- Health timeline
- Earnings chart
- Technical specs
- Inference jobs list

### 7.5 Add Node Request
- Form с валидацией
- Submit → создаёт тикет
- User видит статус заявки

### 7.6 User Profile
- Edit contact info
- Notification preferences
- Currency preference

### 7.7 Admin Panel
- Users list
- Node assignments (user_id ↔ node_identifiers)
- Support requests queue
- System stats

---

## 8. Non-Functional Requirements

### Security
- JWT/Session-based auth (7-day expiry)
- HTTPS everywhere
- XSS/CSRF protection (Helmet middleware)
- API keys только на backend
- Rate limiting (ThrottlerGuard)
- Strong password validation (8+ chars, upper+lower+number)
- Security event logging (login attempts)
- Payload size limits (100kb)
- Bcrypt password hashing (12 rounds)

### Performance
- Dashboard load < 3 seconds
- Cached node data (LRU cache with TTL, size limits)
- Pagination for list endpoints (default 20, max 100)
- Database indexes on foreign keys
- Database transactions for critical operations

### Scalability
- Поддержка других сетей (не только Gonka)
- Поддержка платежей (future)

### Privacy
- GDPR compliance
- Secure password hashing

---

## 9. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 18+ with GCore UI Kit (`@gcore/ui-kit`) |
| Backend | NestJS (Node.js) |
| Database | PostgreSQL 16 |
| Auth | JWT + bcrypt + Google OAuth (passport-google-oauth20) |
| External APIs | Gonka (trackers), Gcore (instances) |
| UI Reference | Storybook: https://ui-storybook.gcore.top/ |

---

## 10. Database Schema

### Tables

```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user', -- user, admin
  telegram VARCHAR(100),
  discord VARCHAR(100),
  currency_preference VARCHAR(10) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Nodes (reference data)
CREATE TABLE nodes (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(255) UNIQUE NOT NULL, -- wallet/node_id/operator
  identifier_type VARCHAR(50) NOT NULL, -- wallet, node_id, operator, validator
  gpu_type VARCHAR(50),
  region VARCHAR(100),
  gcore_instance_id VARCHAR(255), -- link to Gcore instance
  created_at TIMESTAMP DEFAULT NOW()
);

-- User-Node assignments (many-to-many)
CREATE TABLE user_nodes (
  user_id INTEGER REFERENCES users(id),
  node_id INTEGER REFERENCES nodes(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by INTEGER REFERENCES users(id), -- admin who assigned
  PRIMARY KEY (user_id, node_id)
);

-- Node stats cache
CREATE TABLE node_stats_cache (
  node_id INTEGER REFERENCES nodes(id),
  status VARCHAR(50), -- healthy, unhealthy, jailed, offline
  earnings_day DECIMAL(20, 8),
  earnings_total DECIMAL(20, 8),
  uptime_percent DECIMAL(5, 2),
  tokens_per_sec DECIMAL(10, 2),
  jobs_day INTEGER,
  active_model VARCHAR(255),
  fetched_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(50), -- hyperfusion, hashiro, gonka_api
  PRIMARY KEY (node_id)
);

-- Support requests
CREATE TABLE support_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- new_node, support, other
  gpu_type VARCHAR(50),
  quantity INTEGER,
  budget VARCHAR(100),
  network VARCHAR(50) DEFAULT 'gonka',
  comments TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Earnings history
CREATE TABLE earnings_history (
  id SERIAL PRIMARY KEY,
  node_id INTEGER REFERENCES nodes(id),
  date DATE NOT NULL,
  earnings_gnk DECIMAL(20, 8),
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (node_id, date)
);
```

---

## 11. API Endpoints (Backend)

### Auth (Implemented)
```
POST /api/auth/register     -- Register new user (email + password 8+ chars)
POST /api/auth/login        -- Login, returns JWT token
GET  /api/auth/me           -- Get current user profile (protected)
GET  /api/auth/google       -- Initiate Google OAuth (redirects to Google)
GET  /api/auth/google/callback -- Google OAuth callback (redirects to frontend)
```

### Nodes (Implemented)
```
GET  /api/nodes             -- List user's nodes (protected)
GET  /api/nodes/dashboard   -- Dashboard stats + top nodes (protected)
GET  /api/nodes/:address    -- Detailed node info (protected)
```

### Support Requests (Implemented)
```
POST /api/requests              -- Create new request (user)
GET  /api/requests/my           -- User's requests (user)
GET  /api/requests/:id          -- Get single request (user/admin)
DELETE /api/requests/:id        -- Cancel pending request (user)
GET  /api/requests/stats        -- Request statistics (admin)
```

### Admin (Implemented)
```
GET  /api/requests              -- All requests (admin only)
PUT  /api/requests/:id          -- Update request status (admin only)
GET  /api/admin/dashboard       -- Dashboard stats (admin only)
GET  /api/admin/users           -- List all users with nodes (admin only)
GET  /api/admin/users/:id       -- Get user with nodes (admin only)
PUT  /api/admin/users/:id       -- Update user role/status (admin only)
POST /api/admin/users/:id/nodes -- Assign node to user (admin only)
PUT  /api/admin/users/:userId/nodes/:nodeId -- Update node (admin only)
DELETE /api/admin/users/:userId/nodes/:nodeId -- Remove node (admin only)
```

### Health (Implemented)
```
GET  /api/health           -- Full health status (DB, Hyperfusion, uptime)
GET  /api/health/live      -- Kubernetes liveness probe
GET  /api/health/ready     -- Kubernetes readiness probe
```

### Documentation (Implemented)
```
GET  /api/docs             -- Swagger UI (interactive API documentation)
GET  /api/docs-json        -- OpenAPI 3.0 JSON specification
```

### Profile (Not Implemented)
```
GET  /api/profile
PUT  /api/profile
```

---

## 12. Implementation Phases

### Phase 1: Foundation
- [x] Project setup (Angular + NestJS) (2025-12-08)
- [x] Database schema (TypeORM entities) (2025-12-08)
- [x] Auth (register, login, JWT) (2025-12-08)
- [ ] Basic UI layout with GCore UI Kit (pending kit access)

### Phase 2: Dashboard & Mock Data
- [x] Dashboard page with cards (2025-12-08)
- [ ] Earnings chart (mock data)
- [x] Node list (skeleton) (2025-12-08)
- [ ] User profile page

### Phase 3: Gonka Integration
- [x] Gonka API research (identify endpoints) (2025-12-08)
- [x] Hyperfusion tracker integration (2025-12-08)
- [ ] Hashiro integration (skipped - no public API)
- [x] Backend caching layer (2025-12-08)

### Phase 4: Node Management
- [x] Node details page with tabs (2025-12-08)
- [x] Metrics visualization (inference count, missed rate, uptime) (2025-12-08)
- [ ] Earnings history (optional for MVP)
- [x] Admin: node assignment (2025-12-09)

### Phase 5: Request System
- [x] Add Node request form (2025-12-08)
- [x] Support requests list (2025-12-08)
- [x] Backend API (create, list, cancel requests) (2025-12-08)
- [x] Admin: request management (UI) (2025-12-09)
- [ ] Email notifications

### Phase 6: Admin Panel - COMPLETE
- [x] Admin dashboard with stats (2025-12-09)
- [x] Request management (approve/reject/complete) (2025-12-09)
- [x] User management (role, status) (2025-12-09)
- [x] Node assignment to users (2025-12-09)

### Phase 7: Polish & Launch
- [x] UI Framework - Angular Material 21 (2025-12-09)
- [x] Error handling - Global filters, retry logic, toast notifications (2025-12-09)
- [ ] Monitoring (Sentry)
- [x] Documentation - Swagger/OpenAPI at /api/docs (2025-12-09)
- [x] Security hardening - Rate limiting, Helmet headers, strong passwords (2025-12-09)
- [ ] Deploy

---

## 13. Future Features (Post-MVP)

### Payments
- Оплата GPU-аренды (карта, крипта)
- Связка: оплаченный тариф ↔ выделенные GPU ↔ ноды

### Notifications
- Email/Telegram/Push уведомления:
  - Нода ушла в unhealthy/jailed
  - Сильно упала доходность
  - Закончился оплаченный период

### Auto-Provisioning
- Автоматическое создание нод:
  - User выбирает конфигурацию
  - User оплачивает
  - Система автоматически поднимает ноду
  - Node ID привязывается к user

### Multi-Network Support
- Поддержка других AI-сетей (не только Gonka)

---

## 14. Open Research Items

1. ~~**Node Identifiers**: Какой identifier использовать?~~ **RESOLVED**: `gonka1...` address
2. ~~**Tracker APIs**: Документация API Hyperfusion/Hashiro~~ **RESOLVED**: See `docs/API_RESEARCH.md`
3. ~~**Gonka Epochs**: Формат данных~~ **RESOLVED**: See `docs/api-samples/`
4. ~~**Earnings Calculation**~~ **RESOLVED**: `earned_coins` field from Hyperfusion

### Remaining Research
- Hashiro API (no public API found, skipped for MVP)
- Gcore API integration (LOW priority)

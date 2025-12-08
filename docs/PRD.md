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
- Google OAuth (future)
- JWT tokens
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
- JWT/Session-based auth
- HTTPS everywhere
- XSS/CSRF protection
- API keys только на backend

### Performance
- Dashboard load < 3 seconds
- Cached node data (no tracker spam)

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
| Auth | JWT + bcrypt |
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

### Auth
```
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /auth/me
```

### Nodes
```
GET  /nodes/my              -- List user's nodes
GET  /nodes/:id             -- Node details
GET  /nodes/:id/metrics     -- Node metrics history
GET  /nodes/:id/earnings    -- Earnings history
```

### Support Requests
```
POST /support/requests      -- Create new request
GET  /support/requests/my   -- User's requests
```

### Admin
```
GET  /admin/users           -- List all users
GET  /admin/nodes           -- List all nodes
POST /admin/nodes/assign    -- Assign node to user
GET  /admin/requests        -- All support requests
PUT  /admin/requests/:id    -- Update request status
```

### Profile
```
GET  /profile
PUT  /profile
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
- [ ] Node details page
- [ ] Metrics visualization
- [ ] Earnings history
- [ ] Admin: node assignment

### Phase 5: Request System
- [ ] Add Node request form
- [ ] Support requests list
- [ ] Admin: request management
- [ ] Email notifications

### Phase 6: Polish & Launch
- [ ] UI polish
- [ ] Error handling
- [ ] Monitoring (Sentry)
- [ ] Documentation
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

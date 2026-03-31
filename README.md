# HotelTech — Промпт для реализации

## Описание продукта

**HotelTech** — white-label платформа автоматизации гостиничного бизнеса с полным циклом управления услугами, интеграцией с 1С, учётом рабочего времени персонала и API для сайта/соцсетей.

---

## Технический стек

| Компонент | Технология |
|-----------|------------|
| Backend | Node.js (NestJS) |
| Database | PostgreSQL |
| Cache | Redis |
| Queue | RabbitMQ |
| Frontend Web | React / Vue 3 |
| Mobile | Flutter |
| Deploy | Docker / Kubernetes |

---

## Функциональные модули

### 1. Заказ услуг (Guest Services)

- Room Service — заказ еды/напитков в номер
- Уборка — запуск/отмена
- Fitness — бронирование тренажёрного зала
- Завтраки — бронирование стола
- Трансфер — заказ такси
- SPA — запись на процедуры
- Чек-аут — продление/оплата номера

### 2. API для сайта и соцсетей

```
GET  /api/v1/rooms/available?date_from=&date_to=
POST /api/v1/bookings
GET  /api/v1/hotel/info
GET  /api/v1/rooms
GET  /api/v1/services
GET  /api/v1/reviews
POST /api/v1/telegram/webhook
```

Интеграции:
- Booking.com, Ostrovok.ru, Яндекс Путешествия
- Telegram бот для бронирования
- VK Mini App

### 3. Учёт рабочего времени персонала

- Сотрудники (профили, должности, права)
- Графики работы (смены)
- Отпуска/больничные
- Биометрия (face ID) / GPS-check-in / Фото на входе
- Табель учёта (Т-13) автоматически
- Расчёт ЗП (оклад + премии)

### 4. Интеграции

- 1С:Бухгалтерия / 1С:Отель
- PMS (Pyrus, TravelLine, Bnovo)
- Гостиничные замки (Salto, Galaxy)
- Эквайринг (Сбер, Тинькофф)
- Онлайн-кассы (Атол, Штрих)

### 5. Законодательство РФ

- 54-ФЗ (онлайн-кассы)
- 152-ФЗ (персональные данные)
- ФЗ-63 (ЭЦП)
- ЕГАИС (учёт алкоголя)
- ГосСОПКА (логирование)

---

## Архитектура

```
┌─────────────────────────────────────────────┐
│           Kubernetes Cluster                │
├─────────────────────────────────────────────┤
│  API Gateway (NestJS)                       │
│  ├── Auth Service                          │
│  ├── Order Service                         │
│  ├── Booking Service                       │
│  ├── Staff Service                         │
│  └── Payment Service                      │
│  PostgreSQL (репликация)                   │
│  Redis (кэш сессий)                        │
│  RabbitMQ (очереди)                         │
└─────────────────────────────────────────────┘
```

### White-Label конфигурация

```typescript
interface HotelConfig {
  brand: {
    name: string;
    logo: string;
    colors: { primary: string; secondary: string; };
  };
  modules: {
    roomService: boolean;
    spa: boolean;
    restaurant: boolean;
    cleaning: boolean;
    staffManagement: boolean;
  };
  integrations: {
    pms?: string;
    pos?: string;
    lockSystem?: string;
  };
}
```

---

## База данных (основные сущности)

```sql
-- Отели (мультитенантность)
CREATE TABLE hotels (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  config JSONB,  -- white-label конфиг
  created_at TIMESTAMP
);

-- Номера
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  hotel_id UUID REFERENCES hotels(id),
  room_number VARCHAR(20),
  room_type VARCHAR(50),
  price DECIMAL(10,2),
  status VARCHAR(20)  -- available, occupied, cleaning
);

-- Бронирования
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  hotel_id UUID REFERENCES hotels(id),
  room_id UUID REFERENCES rooms(id),
  check_in DATE,
  check_out DATE,
  guest_name VARCHAR(255),
  guest_phone VARCHAR(20),
  guest_email VARCHAR(255),
  total_price DECIMAL(10,2),
  status VARCHAR(20)  -- pending, confirmed, cancelled, completed
);

-- Заказы услуг
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  service_type VARCHAR(50),  -- room_service, cleaning, spa
  items JSONB,
  status VARCHAR(20),
  total DECIMAL(10,2),
  created_at TIMESTAMP
);

-- Персонал
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  hotel_id UUID REFERENCES hotels(id),
  name VARCHAR(255),
  position VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  hire_date DATE,
  salary DECIMAL(10,2),
  status VARCHAR(20)
);

-- Табель (посещения)
CREATE TABLE time_entries (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  check_in TIMESTAMP,
  check_out TIMESTAMP,
  hours_worked DECIMAL(5,2),
  status VARCHAR(20)  -- worked, overtime, sick, vacation
);
```

---

## API Endpoints

### Бронирование

```typescript
// Доступность номеров
GET /api/v1/rooms/available
  Query: { date_from: string, date_to: string, guests?: number }
  Response: { rooms: [{ id, type, price, available }] }

// Создание брони
POST /api/v1/bookings
  Body: { room_id, check_in, check_out, guest_name, guest_phone, guest_email }
  Response: { booking_id, total_price, payment_link }

// Подтверждение брони
POST /api/v1/bookings/:id/confirm
```

### Заказ услуг

```typescript
// Создание заказа
POST /api/v1/orders
  Body: { booking_id, service_type, items: [{ name, quantity, price }] }
  Response: { order_id, total, status }

// Статус заказа
GET /api/v1/orders/:id
```

### Управление персоналом

```typescript
// Список сотрудников
GET /api/v1/employees
  Query: { hotel_id, position? }

// Добавить сотрудника
POST /api/v1/employees
  Body: { name, position, phone, email, hire_date, salary }

// Табель за период
GET /api/v1/timesheet
  Query: { employee_id, month: '2026-03' }
  Response: { days: [{ date, hours, status, check_in, check_out }] }

// Отметка (через API с замка или ручная)
POST /api/v1/timesheet/check
  Body: { employee_id, type: 'check_in' | 'check_out', photo? }
```

### Публичный API

```typescript
// Для сайта отеля
GET  /api/v1/public/hotel/:slug
GET  /api/v1/public/rooms/:hotel_id
GET  /api/v1/public/services/:hotel_id

// Для Telegram бота
POST /api/v1/telegram/webhook
  Body: { message: { text, from } }
```

---

## Требования к реализации

### Обязательно

1. **Мультитенантность** — каждый отель работает изолированно
2. **54-ФЗ** — интеграция с онлайн-кассой (Атол/Штрих)
3. **1С** — выгрузка чеков и операций
4. **Telegram бот** — базовый функционал бронирования
5. **Табель** — автоматическая генерация Т-13

### Масштабируемость

- Stateless API (можно масштабировать горизонтально)
- Кэширование в Redis
- Очереди задач в RabbitMQ
- Docker compose для разработки

---

## Критерии приёмки

- [ ] API возвращает корректные данные о доступности
- [ ] Бронирование создаётся и подтверждается
- [ ] Заказы услуг создаются и отображаются в 1С
- [ ] Табель генерируется корректно
- [ ] Telegram бот отвечает на /start и создаёт бронь
- [ ] White-label: смена логотипа/цветов применяется
- [ ] Docker запускается без ошибок

---

## Файлы проекта

```
/src
  /common          # Общие утилиты, константы
  /config          # Конфигурация
  /database        # Миграции, entities
  /modules
    /auth          # Аутентификация
    /hotels        # Управление отелями
    /bookings      # Бронирования
    /orders        # Заказы услуг
    /employees     # Персонал
    /timesheet     # Табель
    /api           # Публичный API
    /telegram      # Telegram бот
    /integration   # 1С, кассы
  /gateway         # API Gateway
Dockerfile
docker-compose.yml
README.md
```

---

## Примеры запросов для тестирования

```bash
# Доступность
curl "http://localhost:3000/api/v1/rooms/available?date_from=2026-04-01&date_to=2026-04-05"

# Бронирование
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{"room_id":"uuid","check_in":"2026-04-01","check_out":"2026-04-03","guest_name":"Иван","guest_phone":"+79000000000"}'

# Табель
curl "http://localhost:3000/api/v1/timesheet?employee_id=uuid&month=2026-03"
```

---

Начни реализацию с:
1. Настройки проекта (NestJS + Docker)
2. Базы данных и сущностей
3. API Gateway и базовой аутентификации
4. Модуля бронирования

# 🏨 HotelTech — Backend

White-label платформа автоматизации гостиничного бизнеса с полным циклом управления услугами, интеграцией с 1С, учётом рабочего времени персонала и API для сайта/соцсетей.

## 📦 Репозитории

| Проект | Описание | Ссылка |
|--------|----------|--------|
| **HotelTech** | Backend API (этот репозиторий) | https://github.com/KirillZagray/hoteltech |
| **Guest-App** | PWA мобильное приложение для гостей | https://github.com/KirillZagray/guest-app |

## 🚀 Быстрый старт (Docker)

### Требования
- Docker
- Docker Compose

### Запуск

```bash
# Клонировать репозиторий
git clone https://github.com/KirillZagray/hoteltech.git
cd hoteltech

# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps
```

### Сервисы после запуска

| Сервис | URL | Описание |
|--------|-----|----------|
| PostgreSQL | localhost:5432 | База данных (логин: hotel/hotel123) |
| Redis | localhost:6379 | Кэш сессий |
| RabbitMQ | localhost:15672 | Очереди (логин: guest/guest) |

## 🔧 Локальная разработка

### Требования
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Установка

```bash
# Клонировать
git clone https://github.com/KirillZagray/hoteltech.git
cd hoteltech

# Установить зависимости
npm install

# Настроить окружение
cp .env.example .env
# Отредактируйте .env с вашими настройками БД

# Запустить базу данных
docker-compose up -d postgres redis

# Запустить приложение
npm run start:dev
```

### Переменные окружения (.env)

```env
# База данных
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=hotel
DATABASE_PASSWORD=hotel123
DATABASE_NAME=hoteltech

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Приложение
PORT=3000
JWT_SECRET=your-secret-key
```

## 📡 API Endpoints

### Бронирования
```
GET    /api/v1/rooms/available?date_from=&date_to=
POST   /api/v1/bookings
GET    /api/v1/bookings/:id
PATCH  /api/v1/bookings/:id/cancel
```

### Заказы услуг
```
POST   /api/v1/orders
GET    /api/v1/orders/:id
```

### Персонал
```
GET    /api/v1/employees
POST   /api/v1/employees
GET    /api/v1/timesheet?month=2026-03
POST   /api/v1/timesheet/check
```

### Публичный API (для сайта)
```
GET    /api/v1/public/hotel/:slug
GET    /api/v1/public/rooms/:hotel_id
GET    /api/v1/public/services/:hotel_id
```

### Telegram Webhook
```
POST   /api/v1/telegram/webhook
```

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────┐
│              Kubernetes Cluster             │
├─────────────────────────────────────────────┤
│  API Gateway (NestJS)                       │
│  ├── Auth Service                          │
│  ├── Order Service                         │
│  ├── Booking Service                       │
│  ├── Staff Service                         │
│  └── Payment Service                       │
│  PostgreSQL (репликация)                   │
│  Redis (кэш сессий)                        │
│  RabbitMQ (очереди)                         │
└─────────────────────────────────────────────┘
```

## 📚 Документация

- [54-ФЗ] — Онлайн-кассы (Атол, Штрих)
- [152-ФЗ] — Персональные данные
- [1С] — Интеграция с Бухгалтерия/Отель

## 🤝 Contributing

1. Fork репозиторий
2. Создайте ветку (`git checkout -b feature/feature-name`)
3. Commit изменения (`git commit -m 'Add feature'`)
4. Push в ветку (`git push origin feature/feature-name`)
5. Создайте Pull Request

## 📄 Лицензия

MIT

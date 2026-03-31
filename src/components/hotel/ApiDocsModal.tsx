'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FileText,
  ChevronDown,
  ChevronRight,
  Code,
  Lock,
  Building,
  Bed,
  Calendar,
  ShoppingCart,
  Users,
  Clock,
  Globe,
  Webhook,
  AlertCircle,
  Cpu
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface ApiDocsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiDocsModal({ open, onOpenChange }: ApiDocsModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['auth']));

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Скопировано в буфер обмена');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const downloadAsMarkdown = () => {
    const markdown = generateMarkdownDocs();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HotelTech-API-Documentation.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Документация скачана');
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Документация HotelTech
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadAsMarkdown}>
                <FileText className="h-4 w-4 mr-2" />
                Скачать MD
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="endpoints" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 border-b shrink-0">
            <TabsList className="grid grid-cols-5 w-full max-w-xl">
              <TabsTrigger value="endpoints">API</TabsTrigger>
              <TabsTrigger value="public">Публичный</TabsTrigger>
              <TabsTrigger value="integration">Интеграции</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="errors">Ошибки</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 py-4">
            <TabsContent value="endpoints" className="mt-0 space-y-4">
              {/* Authentication */}
              <ApiSection
                id="auth"
                icon={<Lock className="h-4 w-4" />}
                title="Аутентификация"
                expanded={expandedSections.has('auth')}
                onToggle={() => toggleSection('auth')}
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Все защищённые эндпоинты требуют API ключ в заголовке запроса.
                  </p>
                  <CodeBlock
                    id="auth-header"
                    code={`Authorization: Bearer <API_KEY>`}
                    language="http"
                    onCopy={copyToClipboard}
                    copied={copiedId === 'auth-header'}
                  />
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Как получить API ключ:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Войдите в панель администратора</li>
                      <li>Перейдите в Настройки → API</li>
                      <li>Нажмите &quot;Сгенерировать новый ключ&quot;</li>
                      <li>Сохраните ключ в безопасном месте</li>
                    </ol>
                  </div>
                </div>
              </ApiSection>

              {/* Hotels */}
              <ApiSection
                id="hotels"
                icon={<Building className="h-4 w-4" />}
                title="Отели"
                expanded={expandedSections.has('hotels')}
                onToggle={() => toggleSection('hotels')}
              >
                <div className="space-y-4">
                  <EndpointBlock
                    method="GET"
                    path="/api/hotels"
                    description="Получить список всех отелей"
                    baseUrl={baseUrl}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="POST"
                    path="/api/hotels"
                    description="Создать новый отель"
                    baseUrl={baseUrl}
                    body={{
                      name: "Grand Hotel",
                      slug: "grand-hotel",
                      address: "ул. Примерная, 123",
                      phone: "+7 (999) 123-45-67",
                      email: "info@grand-hotel.ru"
                    }}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="PUT"
                    path="/api/hotels/{id}"
                    description="Обновить данные отеля"
                    baseUrl={baseUrl}
                    body={{
                      name: "Grand Hotel Updated",
                      address: "ул. Новая, 456"
                    }}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                </div>
              </ApiSection>

              {/* Rooms */}
              <ApiSection
                id="rooms"
                icon={<Bed className="h-4 w-4" />}
                title="Номера"
                expanded={expandedSections.has('rooms')}
                onToggle={() => toggleSection('rooms')}
              >
                <div className="space-y-4">
                  <EndpointBlock
                    method="GET"
                    path="/api/rooms?hotelId={hotelId}"
                    description="Получить список номеров отеля"
                    baseUrl={baseUrl}
                    params={[
                      { name: "hotelId", type: "string", required: true, desc: "ID отеля" },
                      { name: "status", type: "string", required: false, desc: "Фильтр по статусу" },
                      { name: "roomType", type: "string", required: false, desc: "Фильтр по типу" }
                    ]}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="GET"
                    path="/api/rooms/available?hotelId={hotelId}&dateFrom=2026-04-01&dateTo=2026-04-05"
                    description="Проверить доступность номеров на даты"
                    baseUrl={baseUrl}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="POST"
                    path="/api/rooms"
                    description="Создать новый номер"
                    baseUrl={baseUrl}
                    body={{
                      roomNumber: "101",
                      roomType: "standard",
                      price: 5000,
                      capacity: 2,
                      amenities: ["wifi", "tv", "кондиционер"],
                      images: ["/uploads/rooms/example.jpg"],
                      status: "available"
                    }}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="PUT"
                    path="/api/rooms/{id}"
                    description="Обновить данные номера"
                    baseUrl={baseUrl}
                    body={{
                      price: 6000,
                      status: "cleaning"
                    }}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="DELETE"
                    path="/api/rooms/{id}"
                    description="Удалить номер"
                    baseUrl={baseUrl}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                </div>
              </ApiSection>

              {/* Bookings */}
              <ApiSection
                id="bookings"
                icon={<Calendar className="h-4 w-4" />}
                title="Бронирования"
                expanded={expandedSections.has('bookings')}
                onToggle={() => toggleSection('bookings')}
              >
                <div className="space-y-4">
                  <EndpointBlock
                    method="GET"
                    path="/api/bookings?hotelId={hotelId}"
                    description="Получить список бронирований"
                    baseUrl={baseUrl}
                    params={[
                      { name: "hotelId", type: "string", required: true, desc: "ID отеля" },
                      { name: "status", type: "string", required: false, desc: "Фильтр по статусу" },
                      { name: "confirmationCode", type: "string", required: false, desc: "Поиск по коду" }
                    ]}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="POST"
                    path="/api/bookings"
                    description="Создать бронирование"
                    baseUrl={baseUrl}
                    body={{
                      hotelId: "clx123abc",
                      roomId: "clx456def",
                      checkIn: "2026-04-01",
                      checkOut: "2026-04-05",
                      guestName: "Иван Петров",
                      guestPhone: "+7 (999) 123-45-67",
                      guestEmail: "guest@example.com",
                      guestCount: 2,
                      specialRequests: "Номер на верхнем этаже"
                    }}
                    responseExample={{
                      success: true,
                      data: {
                        id: "clx789ghi",
                        confirmationCode: "HT-12345",
                        totalPrice: 20000,
                        status: "pending"
                      }
                    }}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="POST"
                    path="/api/bookings/{id}/confirm"
                    description="Подтвердить бронирование"
                    baseUrl={baseUrl}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="POST"
                    path="/api/bookings/{id}/cancel"
                    description="Отменить бронирование"
                    baseUrl={baseUrl}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                </div>
              </ApiSection>

              {/* Services & Orders */}
              <ApiSection
                id="services"
                icon={<ShoppingCart className="h-4 w-4" />}
                title="Услуги и Заказы"
                expanded={expandedSections.has('services')}
                onToggle={() => toggleSection('services')}
              >
                <div className="space-y-4">
                  <EndpointBlock
                    method="GET"
                    path="/api/services?hotelId={hotelId}"
                    description="Получить список услуг отеля"
                    baseUrl={baseUrl}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="POST"
                    path="/api/orders"
                    description="Создать заказ услуги"
                    baseUrl={baseUrl}
                    body={{
                      hotelId: "clx123abc",
                      bookingId: "clx789ghi",
                      serviceId: "clx999xyz",
                      items: [
                        { name: "Завтрак в номер", quantity: 2, price: 500 }
                      ],
                      notes: "Без лука, пожалуйста"
                    }}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                </div>
              </ApiSection>

              {/* Employees & Timesheet */}
              <ApiSection
                id="employees"
                icon={<Users className="h-4 w-4" />}
                title="Персонал и Табель"
                expanded={expandedSections.has('employees')}
                onToggle={() => toggleSection('employees')}
              >
                <div className="space-y-4">
                  <EndpointBlock
                    method="GET"
                    path="/api/employees?hotelId={hotelId}"
                    description="Получить список сотрудников"
                    baseUrl={baseUrl}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="POST"
                    path="/api/timesheet/check"
                    description="Отметка времени (вход/выход)"
                    baseUrl={baseUrl}
                    body={{
                      employeeId: "clx123abc",
                      type: "check_in",
                      photo: "base64_encoded_photo",
                      location: "55.7558,37.6173"
                    }}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                  <EndpointBlock
                    method="GET"
                    path="/api/timesheet?employeeId={employeeId}&month=2026-04"
                    description="Получить табель за период"
                    baseUrl={baseUrl}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                </div>
              </ApiSection>

              {/* Upload */}
              <ApiSection
                id="upload"
                icon={<Cpu className="h-4 w-4" />}
                title="Загрузка файлов"
                expanded={expandedSections.has('upload')}
                onToggle={() => toggleSection('upload')}
              >
                <div className="space-y-4">
                  <EndpointBlock
                    method="POST"
                    path="/api/upload"
                    description="Загрузить изображение"
                    baseUrl={baseUrl}
                    contentType="multipart/form-data"
                    body={{
                      image: "[File] - изображение (jpg, png, webp)"
                    }}
                    responseExample={{
                      success: true,
                      data: {
                        url: "/uploads/rooms/1234567890-abc123.jpg",
                        filename: "1234567890-abc123.jpg",
                        size: 102400,
                        type: "image/jpeg"
                      }
                    }}
                    notes={[
                      "Максимальный размер файла: 5MB",
                      "Поддерживаемые форматы: JPG, PNG, WebP",
                      "Файлы сохраняются в /public/uploads/rooms/"
                    ]}
                    onCopy={copyToClipboard}
                    copied={copiedId}
                  />
                </div>
              </ApiSection>
            </TabsContent>

            {/* Public API Tab */}
            <TabsContent value="public" className="mt-0 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-emerald-800 mb-2">Публичный API</h4>
                <p className="text-sm text-emerald-700">
                  Эти эндпоинты доступны без авторизации. Используйте их для интеграции с сайтом отеля.
                </p>
              </div>

              <ApiSection
                id="public-hotel"
                icon={<Globe className="h-4 w-4" />}
                title="Информация об отеле"
                expanded={true}
                onToggle={() => {}}
              >
                <EndpointBlock
                  method="GET"
                  path="/api/public/hotel/{slug}"
                  description="Получить публичную информацию об отеле по slug"
                  baseUrl={baseUrl}
                  responseExample={{
                    success: true,
                    data: {
                      id: "clx123abc",
                      name: "Grand Hotel",
                      address: "ул. Примерная, 123",
                      phone: "+7 (999) 123-45-67",
                      email: "info@grand-hotel.ru"
                    }
                  }}
                  onCopy={copyToClipboard}
                  copied={copiedId}
                />
              </ApiSection>

              <ApiSection
                id="public-rooms"
                icon={<Bed className="h-4 w-4" />}
                title="Номера с доступностью"
                expanded={true}
                onToggle={() => {}}
              >
                <EndpointBlock
                  method="GET"
                  path="/api/public/rooms/{hotelId}"
                  description="Получить номера отеля с информацией о доступности"
                  baseUrl={baseUrl}
                  params={[
                    { name: "dateFrom", type: "string", required: false, desc: "Дата заезда (YYYY-MM-DD)" },
                    { name: "dateTo", type: "string", required: false, desc: "Дата выезда (YYYY-MM-DD)" }
                  ]}
                  responseExample={{
                    success: true,
                    data: [
                      {
                        id: "clx456def",
                        roomNumber: "101",
                        roomType: "standard",
                        price: 5000,
                        capacity: 2,
                        amenities: ["wifi", "tv"],
                        images: ["/uploads/rooms/room1.jpg"],
                        available: true
                      }
                    ]
                  }}
                  onCopy={copyToClipboard}
                  copied={copiedId}
                />
              </ApiSection>

              <ApiSection
                id="public-services"
                icon={<ShoppingCart className="h-4 w-4" />}
                title="Услуги отеля"
                expanded={true}
                onToggle={() => {}}
              >
                <EndpointBlock
                  method="GET"
                  path="/api/public/services/{hotelId}"
                  description="Получить список услуг отеля, сгруппированных по категориям"
                  baseUrl={baseUrl}
                  responseExample={{
                    success: true,
                    data: {
                      breakfast: [
                        { id: "clx111", name: "Завтрак шведский стол", price: 500 }
                      ],
                      spa: [
                        { id: "clx222", name: "Массаж", price: 2000 }
                      ]
                    }
                  }}
                  onCopy={copyToClipboard}
                  copied={copiedId}
                />
              </ApiSection>
            </TabsContent>

            {/* Integration Tab */}
            <TabsContent value="integration" className="mt-0 space-y-4">
              {/* 1C Integration */}
              <ApiSection
                id="1c"
                icon={<Building className="h-4 w-4" />}
                title="Интеграция с 1С"
                expanded={true}
                onToggle={() => {}}
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Примеры HTTP запросов для интеграции с 1С:Предприятие.
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Выгрузка бронирований в 1С</h4>
                    <CodeBlock
                      id="1c-bookings"
                      code={`GET ${baseUrl}/api/bookings?hotelId={hotelId}&status=confirmed
Authorization: Bearer <API_KEY>

Response:
{
  "success": true,
  "data": [
    {
      "id": "clx789ghi",
      "confirmationCode": "HT-12345",
      "guestName": "Иван Петров",
      "guestPhone": "+7 (999) 123-45-67",
      "checkIn": "2026-04-01T14:00:00.000Z",
      "checkOut": "2026-04-05T12:00:00.000Z",
      "totalPrice": 20000,
      "room": { "roomNumber": "101", "roomType": "standard" }
    }
  ]
}`}
                      language="http"
                      onCopy={copyToClipboard}
                      copied={copiedId === '1c-bookings'}
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Синхронизация номеров и цен</h4>
                    <CodeBlock
                      id="1c-rooms"
                      code={`GET ${baseUrl}/api/rooms?hotelId={hotelId}
Authorization: Bearer <API_KEY>

Response:
{
  "success": true,
  "data": [
    {
      "id": "clx456def",
      "roomNumber": "101",
      "roomType": "standard",
      "price": 5000,
      "capacity": 2,
      "status": "available"
    }
  ]
}`}
                      language="http"
                      onCopy={copyToClipboard}
                      copied={copiedId === '1c-rooms'}
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Экспорт заказов услуг</h4>
                    <CodeBlock
                      id="1c-orders"
                      code={`GET ${baseUrl}/api/orders?hotelId={hotelId}&status=completed
Authorization: Bearer <API_KEY>

Response:
{
  "success": true,
  "data": [
    {
      "id": "clx999xyz",
      "items": "[{\\"name\\":\\"Завтрак\\",\\"quantity\\":2,\\"price\\":500}]",
      "total": 1000,
      "createdAt": "2026-04-02T08:30:00.000Z",
      "booking": { "confirmationCode": "HT-12345" }
    }
  ]
}`}
                      language="http"
                      onCopy={copyToClipboard}
                      copied={copiedId === '1c-orders'}
                    />
                  </div>
                </div>
              </ApiSection>

              {/* Mobile App Integration */}
              <ApiSection
                id="mobile"
                icon={<Cpu className="h-4 w-4" />}
                title="Мобильное приложение"
                expanded={true}
                onToggle={() => {}}
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    REST API endpoints для Flutter/React Native приложений.
                  </p>

                  <div className="space-y-2">
                    <h4 className="font-medium">Авторизация гостя по коду бронирования</h4>
                    <CodeBlock
                      id="mobile-auth"
                      code={`POST ${baseUrl}/api/public/booking/auth
Content-Type: application/json

{
  "confirmationCode": "HT-12345",
  "guestPhone": "+7 (999) 123-45-67"
}

Response:
{
  "success": true,
  "data": {
    "booking": {
      "id": "clx789ghi",
      "room": { "roomNumber": "101", "images": [...] },
      "checkIn": "2026-04-01",
      "checkOut": "2026-04-05",
      "hotel": { "name": "Grand Hotel", "address": "..." }
    },
    "token": "guest_token_xyz"
  }
}`}
                      language="http"
                      onCopy={copyToClipboard}
                      copied={copiedId === 'mobile-auth'}
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Просмотр информации о бронировании</h4>
                    <CodeBlock
                      id="mobile-booking"
                      code={`GET ${baseUrl}/api/public/booking/{id}
Authorization: Bearer guest_token_xyz

Response:
{
  "success": true,
  "data": {
    "confirmationCode": "HT-12345",
    "guestName": "Иван Петров",
    "room": {
      "roomNumber": "101",
      "roomType": "standard",
      "images": ["/uploads/rooms/room1.jpg"]
    },
    "checkIn": "2026-04-01T14:00:00.000Z",
    "checkOut": "2026-04-05T12:00:00.000Z",
    "totalPrice": 20000,
    "paymentStatus": "paid",
    "orders": [...]
  }
}`}
                      language="http"
                      onCopy={copyToClipboard}
                      copied={copiedId === 'mobile-booking'}
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Заказ услуг из приложения</h4>
                    <CodeBlock
                      id="mobile-order"
                      code={`POST ${baseUrl}/api/orders
Authorization: Bearer guest_token_xyz
Content-Type: application/json

{
  "hotelId": "clx123abc",
  "bookingId": "clx789ghi",
  "serviceId": "clx111",
  "items": [
    { "name": "Завтрак в номер", "quantity": 2, "price": 500 }
  ]
}`}
                      language="http"
                      onCopy={copyToClipboard}
                      copied={copiedId === 'mobile-order'}
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Push-уведомления (структура)</h4>
                    <CodeBlock
                      id="mobile-push"
                      code={`{
  "to": "device_fcm_token",
  "notification": {
    "title": "Ваш номер готов",
    "body": "Номер 101 готов к заселению"
  },
  "data": {
    "type": "room_ready",
    "bookingId": "clx789ghi",
    "roomNumber": "101"
  }
}`}
                      language="json"
                      onCopy={copyToClipboard}
                      copied={copiedId === 'mobile-push'}
                    />
                  </div>
                </div>
              </ApiSection>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="mt-0 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Webhook события
                </h4>
                <p className="text-sm text-blue-700">
                  Настройте URL для получения уведомлений о событиях в вашей системе.
                </p>
              </div>

              <div className="space-y-4">
                <WebhookEvent
                  event="booking.created"
                  description="Новое бронирование создано"
                  payload={{
                    event: "booking.created",
                    timestamp: "2026-04-01T10:00:00Z",
                    data: {
                      id: "clx789ghi",
                      confirmationCode: "HT-12345",
                      guestName: "Иван Петров",
                      guestPhone: "+7 (999) 123-45-67",
                      roomId: "clx456def",
                      checkIn: "2026-04-01",
                      checkOut: "2026-04-05",
                      totalPrice: 20000
                    }
                  }}
                  onCopy={copyToClipboard}
                  copied={copiedId}
                />

                <WebhookEvent
                  event="booking.confirmed"
                  description="Бронирование подтверждено"
                  payload={{
                    event: "booking.confirmed",
                    timestamp: "2026-04-01T10:05:00Z",
                    data: {
                      id: "clx789ghi",
                      confirmationCode: "HT-12345",
                      status: "confirmed"
                    }
                  }}
                  onCopy={copyToClipboard}
                  copied={copiedId}
                />

                <WebhookEvent
                  event="booking.cancelled"
                  description="Бронирование отменено"
                  payload={{
                    event: "booking.cancelled",
                    timestamp: "2026-04-01T11:00:00Z",
                    data: {
                      id: "clx789ghi",
                      confirmationCode: "HT-12345",
                      reason: "По просьбе гостя"
                    }
                  }}
                  onCopy={copyToClipboard}
                  copied={copiedId}
                />

                <WebhookEvent
                  event="order.created"
                  description="Новый заказ услуги"
                  payload={{
                    event: "order.created",
                    timestamp: "2026-04-02T08:30:00Z",
                    data: {
                      id: "clx999xyz",
                      bookingId: "clx789ghi",
                      service: "Завтрак в номер",
                      items: [{ name: "Завтрак", quantity: 2 }],
                      total: 1000
                    }
                  }}
                  onCopy={copyToClipboard}
                  copied={copiedId}
                />

                <WebhookEvent
                  event="order.completed"
                  description="Заказ выполнен"
                  payload={{
                    event: "order.completed",
                    timestamp: "2026-04-02T09:00:00Z",
                    data: {
                      id: "clx999xyz",
                      status: "completed"
                    }
                  }}
                  onCopy={copyToClipboard}
                  copied={copiedId}
                />
              </div>
            </TabsContent>

            {/* Errors Tab */}
            <TabsContent value="errors" className="mt-0">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Коды ошибок
                </h4>
                <p className="text-sm text-red-700">
                  Все ошибки возвращаются в едином формате с кодом и описанием.
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Код</th>
                      <th className="text-left p-3 font-medium">HTTP</th>
                      <th className="text-left p-3 font-medium">Описание</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <ErrorRow code="UNAUTHORIZED" http="401" desc="Требуется авторизация" />
                    <ErrorRow code="FORBIDDEN" http="403" desc="Недостаточно прав" />
                    <ErrorRow code="NOT_FOUND" http="404" desc="Ресурс не найден" />
                    <ErrorRow code="VALIDATION_ERROR" http="400" desc="Ошибка валидации данных" />
                    <ErrorRow code="DUPLICATE_ENTRY" http="409" desc="Дублирование данных" />
                    <ErrorRow code="ROOM_NOT_AVAILABLE" http="409" desc="Номер недоступен на выбранные даты" />
                    <ErrorRow code="BOOKING_NOT_FOUND" http="404" desc="Бронирование не найдено" />
                    <ErrorRow code="INVALID_DATE_RANGE" http="400" desc="Некорректный диапазон дат" />
                    <ErrorRow code="FILE_TOO_LARGE" http="413" desc="Размер файла превышает лимит" />
                    <ErrorRow code="INVALID_FILE_TYPE" http="400" desc="Неподдерживаемый тип файла" />
                    <ErrorRow code="INTERNAL_ERROR" http="500" desc="Внутренняя ошибка сервера" />
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Формат ответа с ошибкой:</h4>
                <CodeBlock
                  id="error-format"
                  code={`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные",
    "details": {
      "field": "guestPhone",
      "reason": "Неверный формат телефона"
    }
  }
}`}
                  language="json"
                  onCopy={copyToClipboard}
                  copied={copiedId === 'error-format'}
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// API Section Component
interface ApiSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ApiSection({ icon, title, expanded, onToggle, children }: ApiSectionProps) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 hover:text-primary transition-colors">
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        {icon}
        <span className="font-medium">{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Code Block Component
interface CodeBlockProps {
  id: string;
  code: string;
  language: string;
  onCopy: (text: string, id: string) => void;
  copied: boolean;
}

function CodeBlock({ id, code, language, onCopy, copied }: CodeBlockProps) {
  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20"
        onClick={() => onCopy(code, id)}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

// Endpoint Block Component
interface EndpointBlockProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  baseUrl: string;
  params?: Array<{ name: string; type: string; required: boolean; desc: string }>;
  body?: Record<string, unknown>;
  responseExample?: Record<string, unknown>;
  contentType?: string;
  notes?: string[];
  onCopy: (text: string, id: string) => void;
  copied: string | null;
}

function EndpointBlock({
  method,
  path,
  description,
  baseUrl,
  params,
  body,
  responseExample,
  contentType,
  notes,
  onCopy,
  copied,
}: EndpointBlockProps) {
  const methodColors = {
    GET: 'bg-emerald-500',
    POST: 'bg-blue-500',
    PUT: 'bg-amber-500',
    DELETE: 'bg-red-500',
  };

  const curlCommand = `curl -X ${method} "${baseUrl}${path}" \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: ${contentType || 'application/json'}"${
    body ? ` \\
  -d '${JSON.stringify(body, null, 2)}'` : ''
  }`;

  const id = `${method}-${path}`;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`${methodColors[method]} text-white font-mono`}>
              {method}
            </Badge>
            <code className="text-sm bg-muted px-2 py-0.5 rounded">{path}</code>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(curlCommand, id)}
        >
          {copied === id ? (
            <Check className="h-3.5 w-3.5 mr-1" />
          ) : (
            <Copy className="h-3.5 w-3.5 mr-1" />
          )}
          Copy cURL
        </Button>
      </div>

      {params && params.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3">
          <h5 className="text-xs font-medium mb-2 text-muted-foreground">Параметры:</h5>
          <div className="space-y-1">
            {params.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-sm">
                <code className="bg-background px-1.5 py-0.5 rounded text-xs">{p.name}</code>
                <span className="text-xs text-muted-foreground">({p.type})</span>
                {p.required && <Badge variant="outline" className="text-xs h-4">required</Badge>}
                <span className="text-muted-foreground">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {body && (
        <div>
          <h5 className="text-xs font-medium mb-2 text-muted-foreground">Тело запроса:</h5>
          <CodeBlock
            id={`${id}-body`}
            code={JSON.stringify(body, null, 2)}
            language="json"
            onCopy={onCopy}
            copied={copied === `${id}-body`}
          />
        </div>
      )}

      {responseExample && (
        <div>
          <h5 className="text-xs font-medium mb-2 text-muted-foreground">Пример ответа:</h5>
          <CodeBlock
            id={`${id}-response`}
            code={JSON.stringify(responseExample, null, 2)}
            language="json"
            onCopy={onCopy}
            copied={copied === `${id}-response`}
          />
        </div>
      )}

      {notes && notes.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {notes.map((note, i) => (
            <div key={i}>• {note}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// Webhook Event Component
interface WebhookEventProps {
  event: string;
  description: string;
  payload: Record<string, unknown>;
  onCopy: (text: string, id: string) => void;
  copied: string | null;
}

function WebhookEvent({ event, description, payload, onCopy, copied }: WebhookEventProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <code className="bg-violet-100 text-violet-800 px-2 py-1 rounded text-sm font-medium">
            {event}
          </code>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <CodeBlock
        id={`webhook-${event}`}
        code={JSON.stringify(payload, null, 2)}
        language="json"
        onCopy={onCopy}
        copied={copied === `webhook-${event}`}
      />
    </div>
  );
}

// Error Row Component
interface ErrorRowProps {
  code: string;
  http: string;
  desc: string;
}

function ErrorRow({ code, http, desc }: ErrorRowProps) {
  return (
    <tr className="hover:bg-muted/50">
      <td className="p-3">
        <code className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">{code}</code>
      </td>
      <td className="p-3">
        <Badge variant="outline">{http}</Badge>
      </td>
      <td className="p-3 text-muted-foreground">{desc}</td>
    </tr>
  );
}

// Generate Markdown Documentation
function generateMarkdownDocs(): string {
  return `# HotelTech API Документация

## Аутентификация

Все защищённые эндпоинты требуют API ключ в заголовке запроса:

\`\`\`
Authorization: Bearer <API_KEY>
\`\`\`

## API Эндпоинты

### Отели

- \`GET /api/hotels\` - Список отелей
- \`POST /api/hotels\` - Создать отель
- \`PUT /api/hotels/{id}\` - Обновить отель

### Номера

- \`GET /api/rooms?hotelId={hotelId}\` - Список номеров
- \`GET /api/rooms/available?hotelId={hotelId}&dateFrom=2026-04-01&dateTo=2026-04-05\` - Доступность
- \`POST /api/rooms\` - Создать номер
- \`PUT /api/rooms/{id}\` - Обновить номер
- \`DELETE /api/rooms/{id}\` - Удалить номер

### Бронирования

- \`GET /api/bookings?hotelId={hotelId}\` - Список бронирований
- \`POST /api/bookings\` - Создать бронирование
- \`POST /api/bookings/{id}/confirm\` - Подтвердить
- \`POST /api/bookings/{id}/cancel\` - Отменить

### Услуги и Заказы

- \`GET /api/services?hotelId={hotelId}\` - Список услуг
- \`POST /api/orders\` - Создать заказ

### Персонал и Табель

- \`GET /api/employees?hotelId={hotelId}\` - Список сотрудников
- \`POST /api/timesheet/check\` - Отметка времени

### Загрузка файлов

- \`POST /api/upload\` - Загрузить изображение (multipart/form-data)

## Публичный API

- \`GET /api/public/hotel/{slug}\` - Информация об отеле
- \`GET /api/public/rooms/{hotelId}\` - Номера с доступностью
- \`GET /api/public/services/{hotelId}\` - Услуги отеля

## Webhook события

- \`booking.created\` - Новое бронирование
- \`booking.confirmed\` - Бронирование подтверждено
- \`booking.cancelled\` - Бронирование отменено
- \`order.created\` - Новый заказ услуги
- \`order.completed\` - Заказ выполнен

## Коды ошибок

| Код | HTTP | Описание |
|-----|------|----------|
| UNAUTHORIZED | 401 | Требуется авторизация |
| FORBIDDEN | 403 | Недостаточно прав |
| NOT_FOUND | 404 | Ресурс не найден |
| VALIDATION_ERROR | 400 | Ошибка валидации |
| ROOM_NOT_AVAILABLE | 409 | Номер недоступен |
| FILE_TOO_LARGE | 413 | Размер файла превышает лимит |

---
Документация сгенерирована HotelTech Platform
`;
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bed, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  LogIn,
  LogOut,
  Clock,
  ShoppingCart,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { DashboardStats, Booking, Order, BOOKING_STATUS } from '@/lib/hotel-types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
}

export function Dashboard({ stats, loading }: DashboardProps) {
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Не удалось загрузить данные</p>
      </div>
    );
  }

  const { stats: s, todayCheckIns, todayCheckOuts, upcomingCheckIns, upcomingCheckOuts, recentOrders } = stats;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Бронирований"
          value={s.totalBookings}
          description={`${s.pendingBookings} ожидают подтверждения`}
          icon={<Calendar className="h-5 w-5" />}
          color="text-slate-600"
        />
        <StatCard
          title="Занятость"
          value={`${s.occupancyRate}%`}
          description={`${s.occupiedRooms} из ${s.totalRooms} номеров`}
          icon={<Bed className="h-5 w-5" />}
          color="text-emerald-600"
        />
        <StatCard
          title="Выручка"
          value={formatCurrency(s.totalRevenue)}
          description="Оплаченные бронирования"
          icon={<DollarSign className="h-5 w-5" />}
          color="text-green-600"
        />
        <StatCard
          title="Заказов услуг"
          value={s.pendingOrders}
          description="Ожидают выполнения"
          icon={<ShoppingCart className="h-5 w-5" />}
          color="text-amber-600"
        />
      </div>

      {/* Today's Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Check-ins Today */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LogIn className="h-4 w-4 text-emerald-600" />
              Заезды сегодня
            </CardTitle>
            <CardDescription>
              {todayCheckIns.length} гостей ожидают заселения
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет заездов на сегодня
              </p>
            ) : (
              <div className="space-y-2">
                {todayCheckIns.map((booking) => (
                  <BookingItem key={booking.id} booking={booking} type="checkin" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-outs Today */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LogOut className="h-4 w-4 text-orange-600" />
              Выезды сегодня
            </CardTitle>
            <CardDescription>
              {todayCheckOuts.length} гостей ожидают выезда
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayCheckOuts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет выездов на сегодня
              </p>
            ) : (
              <div className="space-y-2">
                {todayCheckOuts.map((booking) => (
                  <BookingItem key={booking.id} booking={booking} type="checkout" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Check-ins */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-600" />
              Ближайшие заезды
            </CardTitle>
            <CardDescription>Следующие 3 дня</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет предстоящих заездов
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {upcomingCheckIns.map((booking) => (
                  <UpcomingBookingItem key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Check-outs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-600" />
              Ближайшие выезды
            </CardTitle>
            <CardDescription>Следующие 3 дня</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingCheckOuts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет предстоящих выездов
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {upcomingCheckOuts.map((booking) => (
                  <UpcomingBookingItem key={booking.id} booking={booking} isCheckout />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-slate-600" />
            Последние заказы услуг
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Нет заказов
            </p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <OrderItem key={order.id} order={order} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function BookingItem({ booking, type }: { booking: Booking; type: 'checkin' | 'checkout' }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background">
          <Users className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="font-medium text-sm">{booking.guestName}</p>
          <p className="text-xs text-muted-foreground">
            Номер {booking.room?.roomNumber} • {booking.guestCount} гостей
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.color}>
          {BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.label || booking.status}
        </Badge>
      </div>
    </div>
  );
}

function UpcomingBookingItem({ booking, isCheckout }: { booking: Booking; isCheckout?: boolean }) {
  const date = isCheckout ? new Date(booking.checkOut) : new Date(booking.checkIn);
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[50px]">
          <p className="text-sm font-semibold">{format(date, 'd MMM', { locale: ru })}</p>
          <p className="text-xs text-muted-foreground">{format(date, 'HH:mm')}</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="font-medium text-sm">{booking.guestName}</p>
          <p className="text-xs text-muted-foreground">
            Номер {booking.room?.roomNumber}
          </p>
        </div>
      </div>
      <Badge variant="outline" className={BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.color}>
        {BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.label}
      </Badge>
    </div>
  );
}

function OrderItem({ order }: { order: Order }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-sky-100 text-sky-800',
    in_progress: 'bg-violet-100 text-violet-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    confirmed: 'Принят',
    in_progress: 'В работе',
    completed: 'Выполнен',
    cancelled: 'Отменён',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background">
          {order.status === 'completed' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : order.status === 'cancelled' ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : (
            <Clock className="h-5 w-5 text-amber-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">{order.service?.name}</p>
          <p className="text-xs text-muted-foreground">
            {order.roomNumber ? `Номер ${order.roomNumber}` : order.guestName || 'Без номера'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
        <Badge variant="outline" className={statusColors[order.status]}>
          {statusLabels[order.status]}
        </Badge>
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(value);
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

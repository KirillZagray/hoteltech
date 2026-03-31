'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Order, Service, Booking, ORDER_STATUS } from '@/lib/hotel-types';
import { api } from '@/lib/use-hotel-data';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface OrdersTabProps {
  orders: Order[];
  services: Service[];
  bookings: Booking[];
  hotelId: string;
  loading: boolean;
  onRefresh: () => void;
}

export function OrdersTab({ orders, services, bookings, hotelId, loading, onRefresh }: OrdersTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: '',
    bookingId: '',
    roomNumber: '',
    guestName: '',
    items: '',
    total: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      serviceId: '',
      bookingId: '',
      roomNumber: '',
      guestName: '',
      items: '',
      total: '',
      notes: '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.serviceId) {
      toast.error('Выберите услугу');
      return;
    }

    setSaving(true);
    try {
      const selectedService = services.find(s => s.id === formData.serviceId);
      const data = {
        hotelId,
        serviceId: formData.serviceId,
        bookingId: formData.bookingId || null,
        roomNumber: formData.roomNumber || null,
        guestName: formData.guestName || null,
        items: formData.items ? JSON.stringify([{ name: selectedService?.name, quantity: 1, price: parseFloat(formData.total) || selectedService?.price }]) : JSON.stringify([{ name: selectedService?.name, quantity: 1, price: selectedService?.price }]),
        total: parseFloat(formData.total) || selectedService?.price || 0,
        notes: formData.notes || null,
        status: 'pending',
      };

      await api.post('/api/orders', data);
      toast.success('Заказ создан');
      
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await api.put(`/api/orders/${orderId}`, { status });
      toast.success('Статус обновлён');
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return;
    
    try {
      await api.delete(`/api/orders/${orderId}`);
      toast.success('Заказ удалён');
      onRefresh();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.service?.name.toLowerCase().includes(search.toLowerCase()) ||
      order.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
      order.guestName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-violet-600" />;
      case 'confirmed': return <CheckCircle2 className="h-4 w-4 text-sky-600" />;
      default: return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по услуге или гостю..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {Object.entries(ORDER_STATUS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreateDialog} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Новый заказ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Услуга</TableHead>
                  <TableHead>Гость / Номер</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Заказы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <div>
                            <p className="font-medium">{order.service?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.service?.category}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.booking ? (
                          <div>
                            <p className="font-medium">{order.booking.guestName}</p>
                            <p className="text-xs text-muted-foreground">
                              Номер {order.booking.room?.roomNumber}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{order.guestName || '—'}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.roomNumber ? `Номер ${order.roomNumber}` : 'Без номера'}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.createdAt), 'd MMM, HH:mm', { locale: ru })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.color}>
                          {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {order.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'confirmed')}>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-sky-600" />
                                Принять
                              </DropdownMenuItem>
                            )}
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'in_progress')}>
                                <Play className="h-4 w-4 mr-2 text-violet-600" />
                                В работу
                              </DropdownMenuItem>
                            )}
                            {order.status === 'in_progress' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'completed')}>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                                Выполнено
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'cancelled')}>
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Отменить
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-red-600 focus:text-red-600">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый заказ услуги</DialogTitle>
            <DialogDescription>
              Создайте заказ на услугу для гостя
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="serviceId">Услуга *</Label>
              <Select 
                value={formData.serviceId} 
                onValueChange={(value) => {
                  const service = services.find(s => s.id === value);
                  setFormData({ 
                    ...formData, 
                    serviceId: value,
                    total: service?.price.toString() || ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите услугу" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} — {formatCurrency(service.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bookingId">Бронирование (опционально)</Label>
              <Select 
                value={formData.bookingId} 
                onValueChange={(value) => {
                  const booking = bookings.find(b => b.id === value);
                  setFormData({ 
                    ...formData, 
                    bookingId: value,
                    roomNumber: booking?.room?.roomNumber || formData.roomNumber,
                    guestName: booking?.guestName || formData.guestName
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите бронирование" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.filter(b => b.status === 'checked_in').map(booking => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.guestName} — Номер {booking.room?.roomNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="roomNumber">Номер</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="guestName">Имя гостя</Label>
                <Input
                  id="guestName"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  placeholder="Иванов И.И."
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="total">Сумма (₽)</Label>
              <Input
                id="total"
                type="number"
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Особые пожелания гостя"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

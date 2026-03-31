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
  Calendar,
  Users,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  Check,
  X,
  LogIn,
  LogOut
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Booking, Room, BOOKING_STATUS, ROOM_TYPES } from '@/lib/hotel-types';
import { api } from '@/lib/use-hotel-data';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface BookingsTabProps {
  bookings: Booking[];
  rooms: Room[];
  hotelId: string;
  loading: boolean;
  onRefresh: () => void;
}

export function BookingsTab({ bookings, rooms, hotelId, loading, onRefresh }: BookingsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    roomId: '',
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestCount: '1',
    checkIn: '',
    checkOut: '',
    totalPrice: '',
    specialRequests: '',
    status: 'pending',
    paymentStatus: 'pending',
  });

  const availableRooms = rooms.filter(r => r.status === 'available');

  const resetForm = () => {
    setFormData({
      roomId: '',
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      guestCount: '1',
      checkIn: '',
      checkOut: '',
      totalPrice: '',
      specialRequests: '',
      status: 'pending',
      paymentStatus: 'pending',
    });
    setEditingBooking(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openDetailsDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const calculateTotal = () => {
    const room = rooms.find(r => r.id === formData.roomId);
    if (room && formData.checkIn && formData.checkOut) {
      const nights = Math.ceil(
        (new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      if (nights > 0) {
        setFormData(prev => ({ ...prev, totalPrice: (room.price * nights).toString() }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.roomId || !formData.guestName || !formData.checkIn || !formData.checkOut) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setSaving(true);
    try {
      const data = {
        hotelId,
        roomId: formData.roomId,
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        guestEmail: formData.guestEmail || null,
        guestCount: parseInt(formData.guestCount),
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        totalPrice: parseFloat(formData.totalPrice) || 0,
        specialRequests: formData.specialRequests || null,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
      };

      if (editingBooking) {
        await api.put(`/api/bookings/${editingBooking.id}`, data);
        toast.success('Бронирование обновлено');
      } else {
        await api.post('/api/bookings', data);
        toast.success('Бронирование создано');
      }
      
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving booking:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (bookingId: string, status: string) => {
    try {
      await api.put(`/api/bookings/${bookingId}`, { status });
      toast.success('Статус обновлён');
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Вы уверены, что хотите отменить бронирование?')) return;
    
    try {
      await api.delete(`/api/bookings/${bookingId}`);
      toast.success('Бронирование отменено');
      onRefresh();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.guestName.toLowerCase().includes(search.toLowerCase()) ||
      booking.confirmationCode?.toLowerCase().includes(search.toLowerCase()) ||
      booking.room?.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                placeholder="Поиск по гостю, коду или номеру..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {Object.entries(BOOKING_STATUS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreateDialog} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Новое бронирование
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Гость</TableHead>
                  <TableHead>Номер</TableHead>
                  <TableHead>Даты</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Бронирования не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {booking.confirmationCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.guestName}</p>
                          <p className="text-xs text-muted-foreground">{booking.guestPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">{booking.room?.roomNumber}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ROOM_TYPES[booking.room?.roomType as keyof typeof ROOM_TYPES]?.label}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <p>{format(new Date(booking.checkIn), 'd MMM', { locale: ru })}</p>
                            <p className="text-xs text-muted-foreground">
                              — {format(new Date(booking.checkOut), 'd MMM', { locale: ru })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(booking.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.color}>
                          {BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS]?.label}
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
                            <DropdownMenuItem onClick={() => openDetailsDialog(booking)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Детали
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {booking.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'confirmed')}>
                                <Check className="h-4 w-4 mr-2 text-emerald-600" />
                                Подтвердить
                              </DropdownMenuItem>
                            )}
                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                              <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'checked_in')}>
                                <LogIn className="h-4 w-4 mr-2 text-green-600" />
                                Заселить
                              </DropdownMenuItem>
                            )}
                            {booking.status === 'checked_in' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(booking.id, 'checked_out')}>
                                <LogOut className="h-4 w-4 mr-2 text-orange-600" />
                                Выселить
                              </DropdownMenuItem>
                            )}
                            {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleCancel(booking.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Отменить
                                </DropdownMenuItem>
                              </>
                            )}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Новое бронирование</DialogTitle>
            <DialogDescription>
              Заполните данные для создания бронирования
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="roomId">Номер *</Label>
              <Select 
                value={formData.roomId} 
                onValueChange={(value) => {
                  setFormData({ ...formData, roomId: value });
                  setTimeout(calculateTotal, 100);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите номер" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.roomNumber} - {ROOM_TYPES[room.roomType as keyof typeof ROOM_TYPES]?.label} 
                      ({formatCurrency(room.price)}/сутки)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="checkIn">Заезд *</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={formData.checkIn}
                  onChange={(e) => {
                    setFormData({ ...formData, checkIn: e.target.value });
                    setTimeout(calculateTotal, 100);
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkOut">Выезд *</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={formData.checkOut}
                  onChange={(e) => {
                    setFormData({ ...formData, checkOut: e.target.value });
                    setTimeout(calculateTotal, 100);
                  }}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="guestName">Имя гостя *</Label>
              <Input
                id="guestName"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="guestPhone">Телефон *</Label>
                <Input
                  id="guestPhone"
                  value={formData.guestPhone}
                  onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                  placeholder="+7 (900) 123-45-67"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="guestCount">Гостей</Label>
                <Select 
                  value={formData.guestCount} 
                  onValueChange={(value) => setFormData({ ...formData, guestCount: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} гостей</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                type="email"
                value={formData.guestEmail}
                onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                placeholder="guest@email.ru"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="totalPrice">Итого (₽)</Label>
              <Input
                id="totalPrice"
                type="number"
                value={formData.totalPrice}
                onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="specialRequests">Особые пожелания</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="Ранний заезд, детский стульчик и т.д."
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

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Детали бронирования</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono bg-muted px-3 py-1 rounded">
                  {selectedBooking.confirmationCode}
                </code>
                <Badge variant="outline" className={BOOKING_STATUS[selectedBooking.status as keyof typeof BOOKING_STATUS]?.color}>
                  {BOOKING_STATUS[selectedBooking.status as keyof typeof BOOKING_STATUS]?.label}
                </Badge>
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedBooking.guestName}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.guestCount} гостей</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{selectedBooking.guestPhone}</p>
                </div>
                
                {selectedBooking.guestEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p>{selectedBooking.guestEmail}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p>{format(new Date(selectedBooking.checkIn), 'd MMMM yyyy', { locale: ru })} — {format(new Date(selectedBooking.checkOut), 'd MMMM yyyy', { locale: ru })}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.ceil((new Date(selectedBooking.checkOut).getTime() - new Date(selectedBooking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} ночей
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Номер:</span>
                  <div className="text-right">
                    <Badge variant="outline">{selectedBooking.room?.roomNumber}</Badge>
                    <p className="text-sm text-muted-foreground">
                      {ROOM_TYPES[selectedBooking.room?.roomType as keyof typeof ROOM_TYPES]?.label}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Итого:</span>
                <span>{formatCurrency(selectedBooking.totalPrice)}</span>
              </div>
              
              {selectedBooking.specialRequests && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Особые пожелания:</p>
                  <p className="text-sm">{selectedBooking.specialRequests}</p>
                </div>
              )}
              
              {selectedBooking.orders && selectedBooking.orders.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Заказанные услуги:</p>
                  <div className="space-y-2">
                    {selectedBooking.orders.map(order => (
                      <div key={order.id} className="flex justify-between text-sm">
                        <span>{order.service?.name}</span>
                        <span>{formatCurrency(order.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

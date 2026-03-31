'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Pencil, 
  Trash2, 
  Search, 
  Filter,
  Bed,
  Users,
  Star,
  MoreVertical,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Room, ROOM_STATUS, ROOM_TYPES } from '@/lib/hotel-types';
import { api } from '@/lib/use-hotel-data';
import { toast } from 'sonner';

interface RoomsTabProps {
  rooms: Room[];
  loading: boolean;
  onRefresh: () => void;
}

export function RoomsTab({ rooms, loading, onRefresh }: RoomsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: 'standard',
    price: '',
    capacity: '2',
    amenities: '',
    status: 'available',
  });

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      roomType: 'standard',
      price: '',
      capacity: '2',
      amenities: '',
      status: 'available',
    });
    setEditingRoom(null);
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price.toString(),
      capacity: room.capacity.toString(),
      amenities: room.amenities ? JSON.parse(room.amenities).join(', ') : '',
      status: room.status,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.roomNumber || !formData.price) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setSaving(true);
    try {
      const data = {
        roomNumber: formData.roomNumber,
        roomType: formData.roomType,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
        status: formData.status,
      };

      if (editingRoom) {
        await api.put(`/api/rooms/${editingRoom.id}`, data);
        toast.success('Номер обновлён');
      } else {
        await api.post('/api/rooms', data);
        toast.success('Номер создан');
      }
      
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving room:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот номер?')) return;
    
    try {
      await api.delete(`/api/rooms/${roomId}`);
      toast.success('Номер удалён');
      onRefresh();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const handleStatusChange = async (roomId: string, status: string) => {
    try {
      await api.put(`/api/rooms/${roomId}`, { status });
      toast.success('Статус обновлён');
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      room.roomType.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesType = typeFilter === 'all' || room.roomType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
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
                placeholder="Поиск по номеру..."
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
                {Object.entries(ROOM_STATUS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Star className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {Object.entries(ROOM_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreateDialog} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Добавить номер
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Вместимость</TableHead>
                  <TableHead>Цена/сутки</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Номера не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                            <Bed className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{room.roomNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ROOM_TYPES[room.roomType as keyof typeof ROOM_TYPES]?.label || room.roomType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {room.capacity} гостей
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(room.price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ROOM_STATUS[room.status as keyof typeof ROOM_STATUS]?.color}>
                          {ROOM_STATUS[room.status as keyof typeof ROOM_STATUS]?.label || room.status}
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
                            <DropdownMenuItem onClick={() => openEditDialog(room)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(room.id, 'available')}>
                              <Check className="h-4 w-4 mr-2 text-emerald-600" />
                              Свободен
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(room.id, 'cleaning')}>
                              Свободен после уборки
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(room.id, 'maintenance')}>
                              На ремонте
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(room.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? 'Редактировать номер' : 'Добавить номер'}
            </DialogTitle>
            <DialogDescription>
              {editingRoom ? 'Измените данные номера' : 'Заполните данные нового номера'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomNumber">Номер комнаты *</Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="101"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="roomType">Тип номера</Label>
                <Select 
                  value={formData.roomType} 
                  onValueChange={(value) => setFormData({ ...formData, roomType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROOM_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="capacity">Вместимость</Label>
                <Select 
                  value={formData.capacity} 
                  onValueChange={(value) => setFormData({ ...formData, capacity: value })}
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
              <Label htmlFor="price">Цена за сутки (₽) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="5000"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="amenities">Удобства (через запятую)</Label>
              <Textarea
                id="amenities"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="wifi, tv, кондиционер, мини-бар"
                rows={2}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">Статус</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROOM_STATUS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Сохранение...' : (editingRoom ? 'Сохранить' : 'Создать')}
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

'use client';

import { useState, useEffect, useRef } from 'react';
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
  Check,
  Upload,
  X,
  Image as ImageIcon,
  Camera
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: 'standard',
    price: '',
    capacity: '2',
    amenities: '',
    status: 'available',
  });
  const [roomImages, setRoomImages] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      roomType: 'standard',
      price: '',
      capacity: '2',
      amenities: '',
      status: 'available',
    });
    setRoomImages([]);
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
    // Parse images from room
    try {
      const images = room.images ? JSON.parse(room.images) : [];
      setRoomImages(Array.isArray(images) ? images : []);
    } catch {
      setRoomImages([]);
    }
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formDataObj = new FormData();
        formDataObj.append('image', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataObj,
        });

        const result = await response.json();
        if (result.success && result.data.url) {
          setRoomImages(prev => [...prev, result.data.url]);
          toast.success('Изображение загружено');
        } else {
          toast.error(result.error || 'Ошибка загрузки');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки изображения');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setRoomImages(prev => prev.filter((_, i) => i !== index));
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
        images: roomImages,
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

  // Get room images for display
  const getRoomImages = (room: Room): string[] => {
    try {
      const images = room.images ? JSON.parse(room.images) : [];
      return Array.isArray(images) ? images : [];
    } catch {
      return [];
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
                  <TableHead>Фото</TableHead>
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
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Номера не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRooms.map((room) => {
                    const images = getRoomImages(room);
                    return (
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
                          {images.length > 0 ? (
                            <div className="flex -space-x-2">
                              {images.slice(0, 3).map((img, idx) => (
                                <div
                                  key={idx}
                                  className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white cursor-pointer hover:z-10 transition-transform hover:scale-110"
                                  onClick={() => {
                                    setPreviewImage(img);
                                    setPreviewOpen(true);
                                  }}
                                >
                                  <img 
                                    src={img} 
                                    alt={`Фото ${idx + 1}`} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {images.length > 3 && (
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border-2 border-white text-xs font-medium">
                                  +{images.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

            {/* Image Upload Section */}
            <div className="grid gap-2">
              <Label>Фотографии номера</Label>
              
              {/* Upload Button */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить фото
                    </>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG, WebP до 5MB
                </span>
              </div>

              {/* Image Gallery */}
              {roomImages.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-2">
                  {roomImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="relative aspect-square rounded-lg overflow-hidden border group"
                    >
                      <img 
                        src={img} 
                        alt={`Фото ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7"
                          onClick={() => {
                            setPreviewImage(img);
                            setPreviewOpen(true);
                          }}
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7"
                          onClick={() => handleRemoveImage(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                          Главное
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {roomImages.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Нет загруженных изображений</p>
                  <p className="text-xs mt-1">Первое загруженное фото станет главным</p>
                </div>
              )}
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

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Предпросмотр" 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={() => setPreviewOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
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

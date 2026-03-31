'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Hotel, 
  LayoutDashboard, 
  Bed, 
  Calendar, 
  ShoppingCart, 
  Users,
  Menu,
  X,
  RefreshCw,
  Building2,
  Code
} from 'lucide-react';
import { Dashboard } from '@/components/hotel/Dashboard';
import { RoomsTab } from '@/components/hotel/RoomsTab';
import { BookingsTab } from '@/components/hotel/BookingsTab';
import { OrdersTab } from '@/components/hotel/OrdersTab';
import { EmployeesTab } from '@/components/hotel/EmployeesTab';
import { ApiDocsModal } from '@/components/hotel/ApiDocsModal';
import { api } from '@/lib/use-hotel-data';
import { 
  DashboardStats, 
  Room, 
  Booking, 
  Order, 
  Service, 
  Employee 
} from '@/lib/hotel-types';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function HotelTechDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiDocsOpen, setApiDocsOpen] = useState(false);
  
  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Fetch all data
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      // Сначала получаем статистику с hotelId
      const statsData = await api.get<DashboardStats>('/api/stats');
      setStats(statsData);
      
      const hotelId = statsData.hotel.id;
      
      // Затем получаем остальные данные с hotelId
      const [roomsData, bookingsData, ordersData, servicesData, employeesData] = await Promise.all([
        api.get<{success: boolean; data: Room[]}>(`/api/rooms?hotelId=${hotelId}`),
        api.get<{success: boolean; data: Booking[]}>(`/api/bookings?hotelId=${hotelId}`),
        api.get<{success: boolean; data: Order[]}>(`/api/orders?hotelId=${hotelId}`),
        api.get<{success: boolean; data: Service[]}>(`/api/services?hotelId=${hotelId}`),
        api.get<{success: boolean; data: Employee[]}>(`/api/employees?hotelId=${hotelId}`),
      ]);

      setRooms(roomsData.data || []);
      setBookings(bookingsData.data || []);
      setOrders(ordersData.data || []);
      setServices(servicesData.data || []);
      setEmployees(employeesData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const navItems = [
    { id: 'dashboard', label: 'Дэшборд', icon: LayoutDashboard },
    { id: 'rooms', label: 'Номера', icon: Bed },
    { id: 'bookings', label: 'Бронирования', icon: Calendar },
    { id: 'orders', label: 'Услуги', icon: ShoppingCart },
    { id: 'employees', label: 'Персонал', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                <Hotel className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">HotelTech</h1>
                {stats?.hotel && (
                  <p className="text-xs text-muted-foreground">{stats.hotel.name}</p>
                )}
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(item.id)}
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApiDocsOpen(true)}
                className="hidden sm:flex gap-2"
              >
                <Code className="h-4 w-4" />
                API Документация
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col gap-4 mt-4">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                        <Hotel className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-bold">HotelTech</h2>
                        {stats?.hotel && (
                          <p className="text-xs text-muted-foreground">{stats.hotel.name}</p>
                        )}
                      </div>
                    </div>
                    <nav className="flex flex-col gap-1">
                      {navItems.map((item) => (
                        <Button
                          key={item.id}
                          variant={activeTab === item.id ? 'secondary' : 'ghost'}
                          onClick={() => setActiveTab(item.id)}
                          className="justify-start gap-3"
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Button>
                      ))}
                      <div className="border-t my-2 pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => setApiDocsOpen(true)}
                          className="justify-start gap-3 w-full"
                        >
                          <Code className="h-5 w-5" />
                          API Документация
                        </Button>
                      </div>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsContent value="dashboard" className="mt-0">
              <Dashboard stats={stats} loading={loading} onRefresh={handleRefresh} />
            </TabsContent>
            
            <TabsContent value="rooms" className="mt-0">
              <RoomsTab rooms={rooms} loading={loading} onRefresh={handleRefresh} />
            </TabsContent>
            
            <TabsContent value="bookings" className="mt-0">
              <BookingsTab 
                bookings={bookings} 
                rooms={rooms} 
                hotelId={stats?.hotel?.id || ''}
                loading={loading} 
                onRefresh={handleRefresh} 
              />
            </TabsContent>
            
            <TabsContent value="orders" className="mt-0">
              <OrdersTab 
                orders={orders}
                services={services}
                bookings={bookings}
                hotelId={stats?.hotel?.id || ''}
                loading={loading}
                onRefresh={handleRefresh}
              />
            </TabsContent>
            
            <TabsContent value="employees" className="mt-0">
              <EmployeesTab employees={employees} loading={loading} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {stats?.hotel?.address || 'Адрес не указан'}
            </div>
            <div className="flex items-center gap-4">
              {stats?.hotel?.phone && (
                <span>{stats.hotel.phone}</span>
              )}
              {stats?.hotel?.email && (
                <span className="hidden sm:inline">{stats.hotel.email}</span>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* API Documentation Modal */}
      <ApiDocsModal open={apiDocsOpen} onOpenChange={setApiDocsOpen} />
    </div>
  );
}

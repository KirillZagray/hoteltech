// Типы для HotelTech

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string;
  roomType: string;
  price: number;
  capacity: number;
  amenities: string | null;
  status: string;
  images: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  guestCount: number;
  totalPrice: number;
  status: string;
  specialRequests: string | null;
  paymentStatus: string;
  confirmationCode: string | null;
  createdAt: string;
  room?: Room;
  orders?: Order[];
}

export interface Service {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  hotelId: string;
  bookingId: string | null;
  serviceId: string;
  items: string;
  total: number;
  status: string;
  notes: string | null;
  roomNumber: string | null;
  guestName: string | null;
  createdAt: string;
  service?: Service;
  booking?: Booking;
}

export interface Employee {
  id: string;
  hotelId: string;
  name: string;
  position: string;
  phone: string | null;
  email: string | null;
  hireDate: string | null;
  salary: number | null;
  status: string;
  avatar: string | null;
  timeEntries?: TimeEntry[];
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  checkIn: string;
  checkOut: string | null;
  hoursWorked: number | null;
  status: string;
  notes: string | null;
}

export interface DashboardStats {
  hotel: Hotel;
  stats: {
    totalBookings: number;
    totalRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    totalRevenue: number;
    pendingBookings: number;
    confirmedBookings: number;
    pendingOrders: number;
  };
  todayCheckIns: Booking[];
  todayCheckOuts: Booking[];
  upcomingCheckIns: Booking[];
  upcomingCheckOuts: Booking[];
  recentOrders: Order[];
}

// Статусы бронирований
export const BOOKING_STATUS = {
  pending: { label: 'Ожидает', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: { label: 'Подтверждено', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  checked_in: { label: 'Заселён', color: 'bg-green-100 text-green-800 border-green-200' },
  checked_out: { label: 'Выехал', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  cancelled: { label: 'Отменено', color: 'bg-red-100 text-red-800 border-red-200' },
} as const;

// Статусы номеров
export const ROOM_STATUS = {
  available: { label: 'Свободен', color: 'bg-emerald-100 text-emerald-800' },
  occupied: { label: 'Занят', color: 'bg-red-100 text-red-800' },
  cleaning: { label: 'Уборка', color: 'bg-amber-100 text-amber-800' },
  maintenance: { label: 'Ремонт', color: 'bg-slate-100 text-slate-800' },
} as const;

// Типы номеров
export const ROOM_TYPES = {
  standard: { label: 'Стандарт', capacity: '2 гостя' },
  deluxe: { label: 'Делюкс', capacity: '3 гостя' },
  suite: { label: 'Люкс', capacity: '4 гостя' },
  presidential: { label: 'Президентский', capacity: '6 гостей' },
} as const;

// Статусы заказов
export const ORDER_STATUS = {
  pending: { label: 'Ожидает', color: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Принят', color: 'bg-sky-100 text-sky-800' },
  in_progress: { label: 'В работе', color: 'bg-violet-100 text-violet-800' },
  completed: { label: 'Выполнен', color: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Отменён', color: 'bg-red-100 text-red-800' },
} as const;

// Статусы сотрудников
export const EMPLOYEE_STATUS = {
  active: { label: 'Работает', color: 'bg-emerald-100 text-emerald-800' },
  on_vacation: { label: 'В отпуске', color: 'bg-amber-100 text-amber-800' },
  on_sick_leave: { label: 'На больничном', color: 'bg-red-100 text-red-800' },
  fired: { label: 'Уволен', color: 'bg-slate-100 text-slate-800' },
} as const;

// Должности
export const POSITIONS = {
  admin: 'Администратор',
  manager: 'Менеджер',
  receptionist: 'Администратор на ресепшн',
  cleaner: 'Горничная',
  chef: 'Шеф-повар',
  spa_therapist: 'СПА-специалист',
} as const;

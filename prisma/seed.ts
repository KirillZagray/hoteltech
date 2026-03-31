import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Создаём отель
  const hotel = await prisma.hotel.upsert({
    where: { slug: 'grand-hotel' },
    update: {},
    create: {
      name: 'Grand Hotel',
      slug: 'grand-hotel',
      address: 'ул. Центральная, 1, Москва',
      phone: '+7 (495) 123-45-67',
      email: 'info@grandhotel.ru',
      isActive: true,
    },
  });

  console.log('Created hotel:', hotel);

  // Создаём номера
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { id: 'room-101' },
      update: {},
      create: {
        id: 'room-101',
        hotelId: hotel.id,
        roomNumber: '101',
        roomType: 'standard',
        price: 5000,
        capacity: 2,
        amenities: JSON.stringify(['wifi', 'tv', 'кондиционер', 'душ']),
        status: 'available',
      },
    }),
    prisma.room.upsert({
      where: { id: 'room-102' },
      update: {},
      create: {
        id: 'room-102',
        hotelId: hotel.id,
        roomNumber: '102',
        roomType: 'standard',
        price: 5500,
        capacity: 2,
        amenities: JSON.stringify(['wifi', 'tv', 'кондиционер', 'ванна']),
        status: 'occupied',
      },
    }),
    prisma.room.upsert({
      where: { id: 'room-201' },
      update: {},
      create: {
        id: 'room-201',
        hotelId: hotel.id,
        roomNumber: '201',
        roomType: 'deluxe',
        price: 8000,
        capacity: 3,
        amenities: JSON.stringify(['wifi', 'tv', 'кондиционер', 'ванна', 'мини-бар', 'балкон']),
        status: 'available',
      },
    }),
    prisma.room.upsert({
      where: { id: 'room-202' },
      update: {},
      create: {
        id: 'room-202',
        hotelId: hotel.id,
        roomNumber: '202',
        roomType: 'deluxe',
        price: 8500,
        capacity: 3,
        amenities: JSON.stringify(['wifi', 'tv', 'кондиционер', 'ванна', 'мини-бар', 'балкон']),
        status: 'cleaning',
      },
    }),
    prisma.room.upsert({
      where: { id: 'room-301' },
      update: {},
      create: {
        id: 'room-301',
        hotelId: hotel.id,
        roomNumber: '301',
        roomType: 'suite',
        price: 15000,
        capacity: 4,
        amenities: JSON.stringify(['wifi', 'tv', 'кондиционер', 'джакузи', 'мини-бар', 'гостиная', 'балкон']),
        status: 'available',
      },
    }),
    prisma.room.upsert({
      where: { id: 'room-302' },
      update: {},
      create: {
        id: 'room-302',
        hotelId: hotel.id,
        roomNumber: '302',
        roomType: 'presidential',
        price: 30000,
        capacity: 6,
        amenities: JSON.stringify(['wifi', 'tv', 'кондиционер', 'джакузи', 'мини-бар', 'гостиная', 'балкон', 'бар', 'камин']),
        status: 'maintenance',
      },
    }),
  ]);

  console.log('Created rooms:', rooms.length);

  // Создаём услуги
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'service-1' },
      update: {},
      create: {
        id: 'service-1',
        hotelId: hotel.id,
        name: 'Завтрак "Шведский стол"',
        description: 'Завтрак в ресторане отеля',
        category: 'breakfast',
        price: 1500,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-2' },
      update: {},
      create: {
        id: 'service-2',
        hotelId: hotel.id,
        name: 'Room Service',
        description: 'Доставка еды в номер',
        category: 'room_service',
        price: 500,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-3' },
      update: {},
      create: {
        id: 'service-3',
        hotelId: hotel.id,
        name: 'СПА-процедуры',
        description: 'Массаж, сауна, бассейн',
        category: 'spa',
        price: 3000,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-4' },
      update: {},
      create: {
        id: 'service-4',
        hotelId: hotel.id,
        name: 'Трансфер',
        description: 'Трансфер из/в аэропорт',
        category: 'transfer',
        price: 2500,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-5' },
      update: {},
      create: {
        id: 'service-5',
        hotelId: hotel.id,
        name: 'Уборка номера',
        description: 'Ежедневная уборка',
        category: 'cleaning',
        price: 0,
        isActive: true,
      },
    }),
  ]);

  console.log('Created services:', services.length);

  // Создаём бронирования
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const in3Days = new Date(today);
  in3Days.setDate(in3Days.getDate() + 3);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const in14Days = new Date(today);
  in14Days.setDate(in14Days.getDate() + 14);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const in2Days = new Date(today);
  in2Days.setDate(in2Days.getDate() + 2);

  const bookings = await Promise.all([
    prisma.booking.upsert({
      where: { id: 'booking-1' },
      update: {},
      create: {
        id: 'booking-1',
        hotelId: hotel.id,
        roomId: 'room-102',
        checkIn: yesterday,
        checkOut: in2Days,
        guestName: 'Иванов Иван Иванович',
        guestPhone: '+7 (900) 111-22-33',
        guestEmail: 'ivanov@email.ru',
        guestCount: 2,
        totalPrice: 16500,
        status: 'checked_in',
        paymentStatus: 'paid',
        confirmationCode: 'GH-001',
      },
    }),
    prisma.booking.upsert({
      where: { id: 'booking-2' },
      update: {},
      create: {
        id: 'booking-2',
        hotelId: hotel.id,
        roomId: 'room-201',
        checkIn: tomorrow,
        checkOut: in7Days,
        guestName: 'Петрова Анна Сергеевна',
        guestPhone: '+7 (900) 222-33-44',
        guestEmail: 'petrova@email.ru',
        guestCount: 3,
        totalPrice: 48000,
        status: 'confirmed',
        paymentStatus: 'paid',
        confirmationCode: 'GH-002',
      },
    }),
    prisma.booking.upsert({
      where: { id: 'booking-3' },
      update: {},
      create: {
        id: 'booking-3',
        hotelId: hotel.id,
        roomId: 'room-101',
        checkIn: in3Days,
        checkOut: in7Days,
        guestName: 'Сидоров Алексей Михайлович',
        guestPhone: '+7 (900) 333-44-55',
        guestEmail: 'sidorov@email.ru',
        guestCount: 2,
        totalPrice: 20000,
        status: 'pending',
        paymentStatus: 'pending',
        confirmationCode: 'GH-003',
      },
    }),
    prisma.booking.upsert({
      where: { id: 'booking-4' },
      update: {},
      create: {
        id: 'booking-4',
        hotelId: hotel.id,
        roomId: 'room-301',
        checkIn: in7Days,
        checkOut: in14Days,
        guestName: 'Козлова Мария Владимировна',
        guestPhone: '+7 (900) 444-55-66',
        guestEmail: 'kozlova@email.ru',
        guestCount: 4,
        totalPrice: 105000,
        status: 'pending',
        paymentStatus: 'pending',
        specialRequests: 'Нужен детский манеж и высокий стульчик',
        confirmationCode: 'GH-004',
      },
    }),
  ]);

  console.log('Created bookings:', bookings.length);

  // Создаём заказы услуг
  const orders = await Promise.all([
    prisma.order.upsert({
      where: { id: 'order-1' },
      update: {},
      create: {
        id: 'order-1',
        hotelId: hotel.id,
        bookingId: 'booking-1',
        serviceId: 'service-1',
        items: JSON.stringify([{ name: 'Завтрак "Шведский стол"', quantity: 2, price: 1500 }]),
        total: 3000,
        status: 'completed',
        roomNumber: '102',
        guestName: 'Иванов Иван Иванович',
      },
    }),
    prisma.order.upsert({
      where: { id: 'order-2' },
      update: {},
      create: {
        id: 'order-2',
        hotelId: hotel.id,
        bookingId: 'booking-1',
        serviceId: 'service-3',
        items: JSON.stringify([{ name: 'СПА-процедуры', quantity: 1, price: 3000 }]),
        total: 3000,
        status: 'in_progress',
        roomNumber: '102',
        guestName: 'Иванов Иван Иванович',
      },
    }),
    prisma.order.upsert({
      where: { id: 'order-3' },
      update: {},
      create: {
        id: 'order-3',
        hotelId: hotel.id,
        bookingId: 'booking-1',
        serviceId: 'service-2',
        items: JSON.stringify([
          { name: 'Стейк', quantity: 1, price: 2500 },
          { name: 'Салат Цезарь', quantity: 1, price: 800 },
          { name: 'Вино', quantity: 1, price: 2000 },
        ]),
        total: 5800,
        status: 'pending',
        notes: 'Без лука в салате',
        roomNumber: '102',
        guestName: 'Иванов Иван Иванович',
      },
    }),
    prisma.order.upsert({
      where: { id: 'order-4' },
      update: {},
      create: {
        id: 'order-4',
        hotelId: hotel.id,
        bookingId: 'booking-2',
        serviceId: 'service-4',
        items: JSON.stringify([{ name: 'Трансфер', quantity: 1, price: 2500 }]),
        total: 2500,
        status: 'confirmed',
        notes: 'Встреча в аэропорту Шереметьево, рейс SU-1234',
      },
    }),
  ]);

  console.log('Created orders:', orders.length);

  // Создаём сотрудников
  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { id: 'employee-1' },
      update: {},
      create: {
        id: 'employee-1',
        hotelId: hotel.id,
        name: 'Смирнов Дмитрий Александрович',
        position: 'manager',
        phone: '+7 (900) 555-66-77',
        email: 'smirnov@grandhotel.ru',
        hireDate: new Date('2022-03-15'),
        salary: 80000,
        status: 'active',
      },
    }),
    prisma.employee.upsert({
      where: { id: 'employee-2' },
      update: {},
      create: {
        id: 'employee-2',
        hotelId: hotel.id,
        name: 'Кузнецова Елена Викторовна',
        position: 'receptionist',
        phone: '+7 (900) 666-77-88',
        email: 'kuznetsova@grandhotel.ru',
        hireDate: new Date('2023-01-10'),
        salary: 50000,
        status: 'active',
      },
    }),
    prisma.employee.upsert({
      where: { id: 'employee-3' },
      update: {},
      create: {
        id: 'employee-3',
        hotelId: hotel.id,
        name: 'Попов Сергей Иванович',
        position: 'cleaner',
        phone: '+7 (900) 777-88-99',
        hireDate: new Date('2023-06-20'),
        salary: 35000,
        status: 'active',
      },
    }),
    prisma.employee.upsert({
      where: { id: 'employee-4' },
      update: {},
      create: {
        id: 'employee-4',
        hotelId: hotel.id,
        name: 'Волкова Наталья Павловна',
        position: 'spa_therapist',
        phone: '+7 (900) 888-99-00',
        email: 'volkova@grandhotel.ru',
        hireDate: new Date('2022-08-01'),
        salary: 60000,
        status: 'on_vacation',
      },
    }),
    prisma.employee.upsert({
      where: { id: 'employee-5' },
      update: {},
      create: {
        id: 'employee-5',
        hotelId: hotel.id,
        name: 'Николаев Андрей Петрович',
        position: 'chef',
        phone: '+7 (900) 999-00-11',
        email: 'nikolaev@grandhotel.ru',
        hireDate: new Date('2021-04-01'),
        salary: 90000,
        status: 'active',
      },
    }),
  ]);

  console.log('Created employees:', employees.length);

  // Создаём записи табеля
  const timeEntries = await Promise.all([
    prisma.timeEntry.upsert({
      where: { id: 'time-1' },
      update: {},
      create: {
        id: 'time-1',
        employeeId: 'employee-1',
        checkIn: new Date(today.setHours(9, 0, 0, 0)),
        checkOut: new Date(today.setHours(18, 0, 0, 0)),
        hoursWorked: 9,
        status: 'worked',
      },
    }),
    prisma.timeEntry.upsert({
      where: { id: 'time-2' },
      update: {},
      create: {
        id: 'time-2',
        employeeId: 'employee-2',
        checkIn: new Date(today.setHours(8, 0, 0, 0)),
        checkOut: new Date(today.setHours(16, 0, 0, 0)),
        hoursWorked: 8,
        status: 'worked',
      },
    }),
    prisma.timeEntry.upsert({
      where: { id: 'time-3' },
      update: {},
      create: {
        id: 'time-3',
        employeeId: 'employee-3',
        checkIn: new Date(today.setHours(10, 0, 0, 0)),
        checkOut: new Date(today.setHours(19, 0, 0, 0)),
        hoursWorked: 9,
        status: 'worked',
      },
    }),
    prisma.timeEntry.upsert({
      where: { id: 'time-4' },
      update: {},
      create: {
        id: 'time-4',
        employeeId: 'employee-5',
        checkIn: new Date(today.setHours(6, 0, 0, 0)),
        checkOut: new Date(today.setHours(15, 0, 0, 0)),
        hoursWorked: 9,
        status: 'worked',
      },
    }),
    prisma.timeEntry.upsert({
      where: { id: 'time-5' },
      update: {},
      create: {
        id: 'time-5',
        employeeId: 'employee-1',
        checkIn: new Date(yesterday.setHours(9, 0, 0, 0)),
        checkOut: new Date(yesterday.setHours(19, 0, 0, 0)),
        hoursWorked: 10,
        status: 'overtime',
      },
    }),
  ]);

  console.log('Created time entries:', timeEntries.length);

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

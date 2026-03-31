import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Получаем первый отель (для демо)
    const hotel = await db.hotel.findFirst({
      where: { isActive: true },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Получаем статистику
    const [
      totalBookings,
      totalRooms,
      occupiedRooms,
      totalRevenue,
      pendingBookings,
      confirmedBookings,
      todayCheckIns,
      todayCheckOuts,
      pendingOrders,
      recentOrders,
    ] = await Promise.all([
      // Общее количество бронирований
      db.booking.count({
        where: { hotelId: hotel.id },
      }),
      // Общее количество номеров
      db.room.count({
        where: { hotelId: hotel.id },
      }),
      // Занятые номера
      db.room.count({
        where: { hotelId: hotel.id, status: 'occupied' },
      }),
      // Общая выручка (только оплаченные)
      db.booking.aggregate({
        where: { 
          hotelId: hotel.id, 
          paymentStatus: 'paid' 
        },
        _sum: { totalPrice: true },
      }),
      // Ожидающие подтверждения
      db.booking.count({
        where: { hotelId: hotel.id, status: 'pending' },
      }),
      // Подтверждённые
      db.booking.count({
        where: { hotelId: hotel.id, status: 'confirmed' },
      }),
      // Заезды сегодня
      db.booking.findMany({
        where: {
          hotelId: hotel.id,
          checkIn: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: { in: ['confirmed', 'pending'] },
        },
        include: { room: true },
      }),
      // Выезды сегодня
      db.booking.findMany({
        where: {
          hotelId: hotel.id,
          checkOut: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: 'checked_in',
        },
        include: { room: true },
      }),
      // Заказы в ожидании
      db.order.count({
        where: { hotelId: hotel.id, status: 'pending' },
      }),
      // Последние заказы
      db.order.findMany({
        where: { hotelId: hotel.id },
        include: { service: true, booking: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Ближайшие заезды (следующие 3 дня)
    const upcomingCheckIns = await db.booking.findMany({
      where: {
        hotelId: hotel.id,
        checkIn: {
          gte: new Date(),
          lt: new Date(new Date().setDate(new Date().getDate() + 3)),
        },
        status: { in: ['confirmed', 'pending'] },
      },
      include: { room: true },
      orderBy: { checkIn: 'asc' },
      take: 5,
    });

    // Ближайшие выезды (следующие 3 дня)
    const upcomingCheckOuts = await db.booking.findMany({
      where: {
        hotelId: hotel.id,
        checkOut: {
          gte: new Date(),
          lt: new Date(new Date().setDate(new Date().getDate() + 3)),
        },
        status: 'checked_in',
      },
      include: { room: true },
      orderBy: { checkOut: 'asc' },
      take: 5,
    });

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return NextResponse.json({
      hotel,
      stats: {
        totalBookings,
        totalRooms,
        occupiedRooms,
        occupancyRate,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        pendingBookings,
        confirmedBookings,
        pendingOrders,
      },
      todayCheckIns,
      todayCheckOuts,
      upcomingCheckIns,
      upcomingCheckOuts,
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Генерация кода подтверждения
function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'HT-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/bookings - список бронирований
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const status = searchParams.get('status');
    const roomId = searchParams.get('roomId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const confirmationCode = searchParams.get('confirmationCode');

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { hotelId };

    if (status) {
      where.status = status;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (confirmationCode) {
      where.confirmationCode = confirmationCode;
    }

    if (dateFrom && dateTo) {
      where.checkIn = {
        gte: new Date(dateFrom),
        lt: new Date(dateTo)
      };
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        room: {
          select: { 
            id: true, 
            roomNumber: true, 
            roomType: true, 
            price: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - создать бронирование
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      hotelId, 
      roomId, 
      checkIn, 
      checkOut, 
      guestName, 
      guestPhone, 
      guestEmail, 
      guestCount, 
      totalPrice,
      specialRequests 
    } = body;

    // Валидация
    if (!hotelId || !roomId || !checkIn || !checkOut || !guestName || !guestPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'checkIn must be before checkOut' },
        { status: 400 }
      );
    }

    // Проверяем существование номера
    const room = await db.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    if (room.hotelId !== hotelId) {
      return NextResponse.json(
        { success: false, error: 'Room does not belong to this hotel' },
        { status: 400 }
      );
    }

    // Проверяем доступность номера на указанные даты
    const conflictingBooking = await db.booking.findFirst({
      where: {
        roomId,
        status: { in: ['confirmed', 'checked_in'] },
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOutDate } },
              { checkOut: { gt: checkInDate } }
            ]
          }
        ]
      }
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { success: false, error: 'Room is not available for selected dates' },
        { status: 400 }
      );
    }

    // Генерируем уникальный код подтверждения
    let confirmationCode = generateConfirmationCode();
    let codeExists = await db.booking.findUnique({
      where: { confirmationCode }
    });

    while (codeExists) {
      confirmationCode = generateConfirmationCode();
      codeExists = await db.booking.findUnique({
        where: { confirmationCode }
      });
    }

    const booking = await db.booking.create({
      data: {
        hotelId,
        roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guestName,
        guestPhone,
        guestEmail,
        guestCount: guestCount || 1,
        totalPrice: totalPrice || room.price,
        specialRequests,
        confirmationCode,
        status: 'pending'
      },
      include: {
        room: {
          select: { 
            id: true, 
            roomNumber: true, 
            roomType: true 
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/rooms/available - доступные номера
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const capacity = searchParams.get('capacity');
    const roomType = searchParams.get('roomType');

    if (!hotelId || !dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: 'hotelId, dateFrom and dateTo are required' },
        { status: 400 }
      );
    }

    const checkIn = new Date(dateFrom);
    const checkOut = new Date(dateTo);

    if (checkIn >= checkOut) {
      return NextResponse.json(
        { success: false, error: 'dateFrom must be before dateTo' },
        { status: 400 }
      );
    }

    // Находим все номера, которые имеют пересекающиеся бронирования в указанный период
    const bookedRoomIds = await db.booking.findMany({
      where: {
        hotelId,
        status: { in: ['confirmed', 'checked_in'] },
        OR: [
          {
            AND: [
              { checkIn: { lt: checkOut } },
              { checkOut: { gt: checkIn } }
            ]
          }
        ]
      },
      select: { roomId: true }
    });

    const bookedIds = [...new Set(bookedRoomIds.map(b => b.roomId))];

    // Фильтр для доступных номеров
    const where: Record<string, unknown> = {
      hotelId,
      id: { notIn: bookedIds },
      status: 'available'
    };

    if (capacity) {
      where.capacity = { gte: parseInt(capacity) };
    }

    if (roomType) {
      where.roomType = roomType;
    }

    const availableRooms = await db.room.findMany({
      where,
      include: {
        hotel: {
          select: { id: true, name: true }
        }
      },
      orderBy: [{ price: 'asc' }]
    });

    // Парсим JSON поля
    const result = availableRooms.map(room => ({
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : null,
      images: room.images ? JSON.parse(room.images) : null
    }));

    return NextResponse.json({ 
      success: true, 
      data: result,
      meta: {
        checkIn: dateFrom,
        checkOut: dateTo,
        totalAvailable: result.length
      }
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available rooms' },
      { status: 500 }
    );
  }
}

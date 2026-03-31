import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/rooms/[hotelId] - номера отеля
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const roomType = searchParams.get('roomType');
    const capacity = searchParams.get('capacity');

    // Проверяем существование и активность отеля
    const hotel = await db.hotel.findFirst({
      where: { 
        id: hotelId,
        isActive: true 
      },
      select: { id: true, name: true }
    });

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Базовый фильтр
    const where: Record<string, unknown> = { 
      hotelId,
      status: 'available'
    };

    if (roomType) {
      where.roomType = roomType;
    }

    if (capacity) {
      where.capacity = { gte: parseInt(capacity) };
    }

    // Если указаны даты, проверяем доступность
    let bookedRoomIds: string[] = [];
    if (dateFrom && dateTo) {
      const checkIn = new Date(dateFrom);
      const checkOut = new Date(dateTo);

      if (checkIn < checkOut) {
        const bookings = await db.booking.findMany({
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
        bookedRoomIds = [...new Set(bookings.map(b => b.roomId))];
      }
    }

    if (bookedRoomIds.length > 0) {
      where.id = { notIn: bookedRoomIds };
    }

    const rooms = await db.room.findMany({
      where,
      select: {
        id: true,
        roomNumber: true,
        roomType: true,
        price: true,
        capacity: true,
        amenities: true,
        images: true
      },
      orderBy: [{ price: 'asc' }]
    });

    // Парсим JSON поля
    const result = rooms.map(room => ({
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : null,
      images: room.images ? JSON.parse(room.images) : null
    }));

    return NextResponse.json({ 
      success: true, 
      data: {
        hotel,
        rooms: result,
        total: result.length,
        filters: {
          dateFrom,
          dateTo,
          roomType,
          capacity
        }
      }
    });
  } catch (error) {
    console.error('Error fetching public rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

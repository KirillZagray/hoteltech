import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - получение списка номеров
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const roomType = searchParams.get('roomType');

    const hotel = await db.hotel.findFirst({
      where: { isActive: true },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    const where: Record<string, unknown> = { hotelId: hotel.id };
    if (status) where.status = status;
    if (roomType) where.roomType = roomType;

    const rooms = await db.room.findMany({
      where,
      orderBy: { roomNumber: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - создание нового номера
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const hotel = await db.hotel.findFirst({
      where: { isActive: true },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    const room = await db.room.create({
      data: {
        hotelId: hotel.id,
        roomNumber: body.roomNumber,
        roomType: body.roomType,
        price: parseFloat(body.price),
        capacity: parseInt(body.capacity) || 2,
        amenities: JSON.stringify(body.amenities || []),
        images: JSON.stringify(body.images || []),
        status: body.status || 'available',
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

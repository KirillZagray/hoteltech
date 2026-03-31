import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/hotel/[slug] - информация об отеле
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const hotel = await db.hotel.findUnique({
      where: { 
        slug,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        phone: true,
        email: true,
        config: true,
        createdAt: true
      }
    });

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Получаем статистику отеля
    const roomsCount = await db.room.count({
      where: { 
        hotelId: hotel.id,
        status: 'available'
      }
    });

    const servicesCount = await db.service.count({
      where: { 
        hotelId: hotel.id,
        isActive: true
      }
    });

    const result = {
      ...hotel,
      config: hotel.config ? JSON.parse(hotel.config) : null,
      stats: {
        availableRooms: roomsCount,
        activeServices: servicesCount
      }
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching public hotel info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hotel information' },
      { status: 500 }
    );
  }
}

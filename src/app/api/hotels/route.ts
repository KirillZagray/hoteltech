import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/hotels - список отелей
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const hotels = await db.hotel.findMany({
      where,
      include: {
        _count: {
          select: { rooms: true, bookings: true, employees: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: hotels });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hotels' },
      { status: 500 }
    );
  }
}

// POST /api/hotels - создать отель
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, address, phone, email, config } = body;

    // Валидация
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Проверка уникальности slug
    const existingHotel = await db.hotel.findUnique({
      where: { slug }
    });

    if (existingHotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel with this slug already exists' },
        { status: 400 }
      );
    }

    const hotel = await db.hotel.create({
      data: {
        name,
        slug,
        address,
        phone,
        email,
        config: config ? JSON.stringify(config) : null
      }
    });

    return NextResponse.json({ success: true, data: hotel }, { status: 201 });
  } catch (error) {
    console.error('Error creating hotel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create hotel' },
      { status: 500 }
    );
  }
}

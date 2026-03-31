import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/services - список услуг (фильтр по hotelId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { hotelId };

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const services = await db.service.findMany({
      where,
      include: {
        _count: {
          select: { orders: true }
        }
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    // Парсим JSON поля
    const result = services.map(service => ({
      ...service,
      metadata: service.metadata ? JSON.parse(service.metadata) : null
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST /api/services - создать услугу
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, name, description, category, price, metadata, isActive } = body;

    // Валидация
    if (!hotelId || !name || !category) {
      return NextResponse.json(
        { success: false, error: 'hotelId, name and category are required' },
        { status: 400 }
      );
    }

    // Проверяем существование отеля
    const hotel = await db.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found' },
        { status: 404 }
      );
    }

    const service = await db.service.create({
      data: {
        hotelId,
        name,
        description,
        category,
        price: price ? parseFloat(price) : 0,
        metadata: metadata ? JSON.stringify(metadata) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({ success: true, data: service }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 500 }
    );
  }
}

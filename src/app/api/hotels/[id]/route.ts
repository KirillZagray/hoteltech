import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/hotels/[id] - получить отель
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hotel = await db.hotel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { rooms: true, bookings: true, employees: true, services: true }
        }
      }
    });

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Парсим config если есть
    const result = {
      ...hotel,
      config: hotel.config ? JSON.parse(hotel.config) : null
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hotel' },
      { status: 500 }
    );
  }
}

// PUT /api/hotels/[id] - обновить отель
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, address, phone, email, config, isActive } = body;

    // Проверяем существование отеля
    const existingHotel = await db.hotel.findUnique({
      where: { id }
    });

    if (!existingHotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found' },
        { status: 404 }
      );
    }

    // Если меняем slug, проверяем уникальность
    if (slug && slug !== existingHotel.slug) {
      const slugExists = await db.hotel.findUnique({
        where: { slug }
      });
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Hotel with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const hotel = await db.hotel.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(config !== undefined && { config: config ? JSON.stringify(config) : null }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ success: true, data: hotel });
  } catch (error) {
    console.error('Error updating hotel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update hotel' },
      { status: 500 }
    );
  }
}

// DELETE /api/hotels/[id] - удалить отель
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Проверяем существование отеля
    const existingHotel = await db.hotel.findUnique({
      where: { id }
    });

    if (!existingHotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found' },
        { status: 404 }
      );
    }

    await db.hotel.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete hotel' },
      { status: 500 }
    );
  }
}

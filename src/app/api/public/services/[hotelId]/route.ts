import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/services/[hotelId] - услуги отеля
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

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

    const where: Record<string, unknown> = { 
      hotelId,
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    const services = await db.service.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        metadata: true
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    // Парсим JSON поля и группируем по категориям
    const parsedServices = services.map(service => ({
      ...service,
      metadata: service.metadata ? JSON.parse(service.metadata) : null
    }));

    // Группировка по категориям
    const groupedServices = parsedServices.reduce((acc, service) => {
      const cat = service.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(service);
      return acc;
    }, {} as Record<string, typeof parsedServices>);

    return NextResponse.json({ 
      success: true, 
      data: {
        hotel,
        services: parsedServices,
        groupedServices,
        categories: Object.keys(groupedServices),
        total: parsedServices.length
      }
    });
  } catch (error) {
    console.error('Error fetching public services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

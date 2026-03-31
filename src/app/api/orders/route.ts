import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/orders - список заказов (фильтр по hotelId, bookingId, status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const bookingId = searchParams.get('bookingId');
    const status = searchParams.get('status');

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { hotelId };

    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (status) {
      where.status = status;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        service: {
          select: { id: true, name: true, category: true, price: true }
        },
        booking: {
          select: { 
            id: true, 
            guestName: true, 
            room: {
              select: { roomNumber: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Парсим JSON поля
    const result = orders.map(order => ({
      ...order,
      items: order.items ? JSON.parse(order.items) : []
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - создать заказ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, bookingId, serviceId, items, notes, roomNumber, guestName } = body;

    // Валидация
    if (!hotelId || !serviceId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'hotelId, serviceId and items array are required' },
        { status: 400 }
      );
    }

    // Проверяем существование услуги
    const service = await db.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Если указано бронирование, проверяем его
    if (bookingId) {
      const booking = await db.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, error: 'Booking not found' },
          { status: 404 }
        );
      }
    }

    // Вычисляем общую сумму
    const total = items.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const order = await db.order.create({
      data: {
        hotelId,
        bookingId: bookingId || null,
        serviceId,
        items: JSON.stringify(items),
        total,
        notes,
        roomNumber,
        guestName
      },
      include: {
        service: {
          select: { id: true, name: true, category: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

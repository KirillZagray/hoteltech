import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/services/[id] - обновить услугу
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, category, price, metadata, isActive } = body;

    const existingService = await db.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    const service = await db.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(metadata !== undefined && { metadata: metadata ? JSON.stringify(metadata) : null }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - удалить услугу
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingService = await db.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Проверяем наличие активных заказов
    const activeOrders = await db.order.count({
      where: {
        serviceId: id,
        status: { in: ['pending', 'confirmed', 'in_progress'] }
      }
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete service with active orders' },
        { status: 400 }
      );
    }

    await db.service.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}

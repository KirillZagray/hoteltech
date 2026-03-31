import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/orders/[id] - обновить статус заказа
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, items } = body;

    const existingOrder = await db.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Если обновляем items, пересчитываем total
    let total = existingOrder.total;
    if (items && Array.isArray(items)) {
      total = items.reduce((sum: number, item: { price: number; quantity: number }) => {
        return sum + (item.price * item.quantity);
      }, 0);
    }

    const order = await db.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(items && { items: JSON.stringify(items), total })
      },
      include: {
        service: {
          select: { id: true, name: true, category: true }
        },
        booking: {
          select: { 
            id: true, 
            guestName: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...order,
        items: JSON.parse(order.items)
      }
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - удалить заказ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingOrder = await db.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Удаляем только если заказ не выполняется
    if (existingOrder.status === 'in_progress') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete order in progress' },
        { status: 400 }
      );
    }

    await db.order.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

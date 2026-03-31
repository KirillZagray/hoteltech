import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/bookings/[id]/cancel - отменить бронирование
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    const existingBooking = await db.booking.findUnique({
      where: { id },
      include: { room: true }
    });

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (existingBooking.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    if (existingBooking.status === 'checked_out') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel a checked-out booking' },
        { status: 400 }
      );
    }

    // Обновляем статус бронирования и освобождаем номер
    const [booking] = await db.$transaction([
      db.booking.update({
        where: { id },
        data: { 
          status: 'cancelled',
          specialRequests: reason 
            ? `${existingBooking.specialRequests || ''}\nCancellation reason: ${reason}`.trim()
            : existingBooking.specialRequests
        }
      }),
      db.room.update({
        where: { id: existingBooking.roomId },
        data: { status: 'available' }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      data: booking,
      message: 'Booking cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}

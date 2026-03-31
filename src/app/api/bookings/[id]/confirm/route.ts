import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/bookings/[id]/confirm - подтвердить бронирование
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (existingBooking.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Only pending bookings can be confirmed' },
        { status: 400 }
      );
    }

    // Обновляем статус бронирования и номера
    const [booking] = await db.$transaction([
      db.booking.update({
        where: { id },
        data: { status: 'confirmed' }
      }),
      db.room.update({
        where: { id: existingBooking.roomId },
        data: { status: 'occupied' }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      data: booking,
      message: 'Booking confirmed successfully' 
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm booking' },
      { status: 500 }
    );
  }
}

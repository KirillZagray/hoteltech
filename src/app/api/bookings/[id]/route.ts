import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/bookings/[id] - получить бронирование
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        room: {
          select: { 
            id: true, 
            roomNumber: true, 
            roomType: true, 
            price: true,
            capacity: true
          }
        },
        hotel: {
          select: { 
            id: true, 
            name: true, 
            address: true, 
            phone: true,
            email: true
          }
        },
        orders: {
          include: {
            service: {
              select: { id: true, name: true, category: true }
            }
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/[id] - обновить бронирование
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      checkIn, 
      checkOut, 
      guestName, 
      guestPhone, 
      guestEmail, 
      guestCount, 
      totalPrice,
      specialRequests,
      paymentStatus,
      paymentId
    } = body;

    const existingBooking = await db.booking.findUnique({
      where: { id }
    });

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Если меняем даты, проверяем доступность
    if (checkIn || checkOut) {
      const newCheckIn = checkIn ? new Date(checkIn) : existingBooking.checkIn;
      const newCheckOut = checkOut ? new Date(checkOut) : existingBooking.checkOut;

      if (newCheckIn >= newCheckOut) {
        return NextResponse.json(
          { success: false, error: 'checkIn must be before checkOut' },
          { status: 400 }
        );
      }

      const conflictingBooking = await db.booking.findFirst({
        where: {
          roomId: existingBooking.roomId,
          id: { not: id },
          status: { in: ['confirmed', 'checked_in'] },
          OR: [
            {
              AND: [
                { checkIn: { lt: newCheckOut } },
                { checkOut: { gt: newCheckIn } }
              ]
            }
          ]
        }
      });

      if (conflictingBooking) {
        return NextResponse.json(
          { success: false, error: 'Room is not available for selected dates' },
          { status: 400 }
        );
      }
    }

    const booking = await db.booking.update({
      where: { id },
      data: {
        ...(checkIn && { checkIn: new Date(checkIn) }),
        ...(checkOut && { checkOut: new Date(checkOut) }),
        ...(guestName && { guestName }),
        ...(guestPhone && { guestPhone }),
        ...(guestEmail !== undefined && { guestEmail }),
        ...(guestCount !== undefined && { guestCount }),
        ...(totalPrice !== undefined && { totalPrice: parseFloat(totalPrice) }),
        ...(specialRequests !== undefined && { specialRequests }),
        ...(paymentStatus && { paymentStatus }),
        ...(paymentId !== undefined && { paymentId })
      }
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

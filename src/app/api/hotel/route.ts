import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - получение информации об отеле
export async function GET() {
  try {
    const hotel = await db.hotel.findFirst({
      where: { isActive: true },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    return NextResponse.json(hotel);
  } catch (error) {
    console.error('Error fetching hotel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

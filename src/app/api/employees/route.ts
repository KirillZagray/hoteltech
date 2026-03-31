import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/employees - список сотрудников (фильтр по hotelId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const position = searchParams.get('position');
    const status = searchParams.get('status');

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { hotelId };

    if (position) {
      where.position = position;
    }

    if (status) {
      where.status = status;
    }

    const employees = await db.employee.findMany({
      where,
      include: {
        _count: {
          select: { timeEntries: true }
        }
      },
      orderBy: [{ name: 'asc' }]
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/employees - добавить сотрудника
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, name, position, phone, email, hireDate, salary, avatar, status } = body;

    // Валидация
    if (!hotelId || !name || !position) {
      return NextResponse.json(
        { success: false, error: 'hotelId, name and position are required' },
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

    const employee = await db.employee.create({
      data: {
        hotelId,
        name,
        position,
        phone,
        email,
        hireDate: hireDate ? new Date(hireDate) : null,
        salary: salary ? parseFloat(salary) : null,
        avatar,
        status: status || 'active'
      }
    });

    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}

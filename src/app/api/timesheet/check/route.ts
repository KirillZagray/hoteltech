import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/timesheet/check - отметка (check_in/check_out)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, type, photoUrl, location, notes } = body;

    // Валидация
    if (!employeeId || !type) {
      return NextResponse.json(
        { success: false, error: 'employeeId and type (check_in/check_out) are required' },
        { status: 400 }
      );
    }

    if (!['check_in', 'check_out'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type must be check_in or check_out' },
        { status: 400 }
      );
    }

    // Проверяем существование сотрудника
    const employee = await db.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (employee.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Employee is not active' },
        { status: 400 }
      );
    }

    const now = new Date();

    if (type === 'check_in') {
      // Проверяем, есть ли открытая запись
      const openEntry = await db.timeEntry.findFirst({
        where: {
          employeeId,
          checkOut: null
        }
      });

      if (openEntry) {
        return NextResponse.json(
          { success: false, error: 'Employee already checked in. Please check out first.' },
          { status: 400 }
        );
      }

      // Создаем новую запись
      const timeEntry = await db.timeEntry.create({
        data: {
          employeeId,
          checkIn: now,
          photoUrl,
          location,
          notes,
          status: 'worked'
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: timeEntry,
        message: 'Checked in successfully' 
      }, { status: 201 });
    } else {
      // check_out
      // Находим открытую запись
      const openEntry = await db.timeEntry.findFirst({
        where: {
          employeeId,
          checkOut: null
        },
        orderBy: { checkIn: 'desc' }
      });

      if (!openEntry) {
        return NextResponse.json(
          { success: false, error: 'No open check-in found. Please check in first.' },
          { status: 400 }
        );
      }

      // Вычисляем отработанные часы
      const hoursWorked = (now.getTime() - openEntry.checkIn.getTime()) / (1000 * 60 * 60);

      const timeEntry = await db.timeEntry.update({
        where: { id: openEntry.id },
        data: {
          checkOut: now,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          status: hoursWorked > 8 ? 'overtime' : 'worked'
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: timeEntry,
        message: 'Checked out successfully',
        hoursWorked: Math.round(hoursWorked * 100) / 100
      });
    }
  } catch (error) {
    console.error('Error in timesheet check:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process check in/out' },
      { status: 500 }
    );
  }
}

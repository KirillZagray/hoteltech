import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/timesheet/[employeeId] - записи сотрудника
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    // Проверяем существование сотрудника
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        hotel: {
          select: { id: true, name: true }
        }
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = { employeeId };

    // Фильтр по месяцу
    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      where.checkIn = {
        gte: startDate,
        lt: endDate
      };
    }

    if (status) {
      where.status = status;
    }

    const timeEntries = await db.timeEntry.findMany({
      where,
      orderBy: { checkIn: 'desc' }
    });

    // Статистика сотрудника
    const stats = {
      totalEntries: timeEntries.length,
      totalHours: timeEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0),
      overtimeHours: timeEntries
        .filter(e => e.status === 'overtime')
        .reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0),
      byStatus: timeEntries.reduce((acc, entry) => {
        acc[entry.status] = (acc[entry.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      currentStatus: timeEntries.length > 0 && !timeEntries[0].checkOut ? 'checked_in' : 'checked_out'
    };

    return NextResponse.json({ 
      success: true, 
      data: {
        employee,
        timeEntries,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching employee timesheet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee timesheet' },
      { status: 500 }
    );
  }
}

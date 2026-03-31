import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/timesheet - табель за период (query: employeeId, month)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month'); // Format: YYYY-MM
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Record<string, unknown> = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    // Фильтр по месяцу или периоду
    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      where.checkIn = {
        gte: startDate,
        lt: endDate
      };
    } else if (dateFrom && dateTo) {
      where.checkIn = {
        gte: new Date(dateFrom),
        lt: new Date(dateTo)
      };
    }

    const timeEntries = await db.timeEntry.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true,
            hotel: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { checkIn: 'desc' }
    });

    // Вычисляем статистику
    const stats = {
      totalEntries: timeEntries.length,
      totalHours: timeEntries.reduce((sum, entry) => sum + (entry.hoursWorked || 0), 0),
      byStatus: timeEntries.reduce((acc, entry) => {
        acc[entry.status] = (acc[entry.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({ 
      success: true, 
      data: timeEntries,
      stats
    });
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timesheet' },
      { status: 500 }
    );
  }
}

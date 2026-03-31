import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/employees/[id] - обновить данные сотрудника
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, position, phone, email, hireDate, salary, avatar, status } = body;

    const existingEmployee = await db.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const employee = await db.employee.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(position && { position }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(hireDate !== undefined && { hireDate: hireDate ? new Date(hireDate) : null }),
        ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null }),
        ...(avatar !== undefined && { avatar }),
        ...(status && { status })
      }
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - удалить сотрудника
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingEmployee = await db.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Удаляем все записи табеля сотрудника
    await db.timeEntry.deleteMany({
      where: { employeeId: id }
    });

    // Удаляем сотрудника
    await db.employee.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Filter,
  Users,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { Employee, EMPLOYEE_STATUS, POSITIONS } from '@/lib/hotel-types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EmployeesTabProps {
  employees: Employee[];
  loading: boolean;
}

export function EmployeesTab({ employees, loading }: EmployeesTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || emp.position === positionFilter;
    return matchesSearch && matchesStatus && matchesPosition;
  });

  // Calculate stats
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const totalHoursThisMonth = employees.reduce((sum, e) => {
    return sum + (e.timeEntries?.reduce((hours, t) => hours + (t.hoursWorked || 0), 0) || 0);
  }, 0);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPositionLabel = (position: string) => {
    return POSITIONS[position as keyof typeof POSITIONS] || position;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего сотрудников</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">{activeEmployees} активно работают</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Часов за месяц</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursThisMonth}ч</div>
            <p className="text-xs text-muted-foreground">Суммарно отработано</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">В отпуске</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.status === 'on_vacation').length}</div>
            <p className="text-xs text-muted-foreground">Сотрудников</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {Object.entries(EMPLOYEE_STATUS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Должность" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все должности</SelectItem>
                {Object.entries(POSITIONS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Сотрудники не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredEmployees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))
        )}
      </div>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Табель учёта времени (последние 30 дней)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сотрудник</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead>Часов отработано</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Последняя смена</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const hours = employee.timeEntries?.reduce((sum, t) => sum + (t.hoursWorked || 0), 0) || 0;
                  const lastEntry = employee.timeEntries?.[0];
                  const expectedHours = 160; // ~40h/week * 4 weeks
                  const progress = Math.min((hours / expectedHours) * 100, 100);
                  
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-muted">
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            {employee.email && (
                              <p className="text-xs text-muted-foreground">{employee.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getPositionLabel(employee.position)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[120px]">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{hours}ч</span>
                            <span className="text-muted-foreground">/ {expectedHours}ч</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={EMPLOYEE_STATUS[employee.status as keyof typeof EMPLOYEE_STATUS]?.color}>
                          {EMPLOYEE_STATUS[employee.status as keyof typeof EMPLOYEE_STATUS]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lastEntry ? (
                          <div>
                            <p>{format(new Date(lastEntry.checkIn), 'd MMM', { locale: ru })}</p>
                            <p className="text-xs">
                              {format(new Date(lastEntry.checkIn), 'HH:mm')} - {lastEntry.checkOut ? format(new Date(lastEntry.checkOut), 'HH:mm') : '...'}
                            </p>
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPositionLabel = (position: string) => {
    return POSITIONS[position as keyof typeof POSITIONS] || position;
  };

  const hoursThisMonth = employee.timeEntries?.reduce((sum, t) => sum + (t.hoursWorked || 0), 0) || 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium truncate">{employee.name}</p>
              <Badge variant="outline" className={EMPLOYEE_STATUS[employee.status as keyof typeof EMPLOYEE_STATUS]?.color}>
                {EMPLOYEE_STATUS[employee.status as keyof typeof EMPLOYEE_STATUS]?.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{getPositionLabel(employee.position)}</p>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {employee.phone}
            </div>
          )}
          {employee.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{employee.email}</span>
            </div>
          )}
          {employee.hireDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              С {format(new Date(employee.hireDate), 'd MMM yyyy', { locale: ru })}
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Часов в этом месяце:</span>
            <span className="font-medium">{hoursThisMonth}ч</span>
          </div>
          {employee.salary && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Зарплата:</span>
              <span className="font-medium">{formatCurrency(employee.salary)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Yearly Planning Table Component
 * Inline editable table for transition years (2025-2027)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LivePreviewCalculator } from './LivePreviewCalculator';
import { Calendar, Edit2 } from 'lucide-react';

interface YearData {
  id: string;
  year: number;
  targetEnrollment: number;
  staffCostBase: string; // Decimal as string

  // NEW FIELDS
  averageTuitionPerStudent?: string | null;
  otherRevenue?: string | null;
  opex?: string | null; // Operating expenses
  staffCostGrowthPercent?: string | null;
  rentGrowthPercent?: string | null;

  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface YearlyPlanningTableProps {
  yearData: YearData[];
  capacityCap: number;
  staffCostBase2024: number; // NEW: Base year 2024 staff costs
  rentBase2024: number; // NEW: Base year 2024 rent
  onChange: (yearData: YearData[]) => void;
  disabled?: boolean;
}

interface EditableCell {
  year: number;
  field:
    | 'enrollment'
    | 'staffCost'
    | 'tuition'
    | 'otherRevenue'
    | 'opex'
    | 'staffGrowth'
    | 'rentGrowth';
}

export function YearlyPlanningTable({
  yearData,
  capacityCap,
  staffCostBase2024,
  rentBase2024,
  onChange,
  disabled = false,
}: YearlyPlanningTableProps): JSX.Element {
  const [localData, setLocalData] = useState<YearData[]>(yearData);
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update local data when props change
  useEffect(() => {
    setLocalData(yearData);
  }, [yearData]);

  const handleEnrollmentChange = (year: number, value: string): void => {
    const numValue = parseInt(value, 10);

    // Validate
    if (isNaN(numValue) || numValue < 1) {
      setErrors({ ...errors, [`${year}-enrollment`]: 'Must be at least 1' });
      return;
    }

    if (numValue > capacityCap) {
      setErrors({
        ...errors,
        [`${year}-enrollment`]: `Cannot exceed capacity cap (${capacityCap})`,
      });
      return;
    }

    // Clear error
    const newErrors = { ...errors };
    delete newErrors[`${year}-enrollment`];
    setErrors(newErrors);

    // Update data
    const updatedData = localData.map((item) =>
      item.year === year ? { ...item, targetEnrollment: numValue } : item
    );
    setLocalData(updatedData);
    onChange(updatedData);
  };

  const handleTuitionChange = (year: number, value: string): void => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setErrors({ ...errors, [`${year}-tuition`]: 'Must be non-negative' });
      return;
    }

    const newErrors = { ...errors };
    delete newErrors[`${year}-tuition`];
    setErrors(newErrors);

    const updatedData = localData.map((item) =>
      item.year === year ? { ...item, averageTuitionPerStudent: value } : item
    );
    setLocalData(updatedData);
    onChange(updatedData);
  };

  const handleOtherRevenueChange = (year: number, value: string): void => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setErrors({ ...errors, [`${year}-otherRevenue`]: 'Must be non-negative' });
      return;
    }

    const newErrors = { ...errors };
    delete newErrors[`${year}-otherRevenue`];
    setErrors(newErrors);

    const updatedData = localData.map((item) =>
      item.year === year ? { ...item, otherRevenue: value } : item
    );
    setLocalData(updatedData);
    onChange(updatedData);
  };

  const handleOpexChange = (year: number, value: string): void => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setErrors({ ...errors, [`${year}-opex`]: 'Must be non-negative' });
      return;
    }

    const newErrors = { ...errors };
    delete newErrors[`${year}-opex`];
    setErrors(newErrors);

    const updatedData = localData.map((item) =>
      item.year === year ? { ...item, opex: value } : item
    );
    setLocalData(updatedData);
    onChange(updatedData);
  };

  const handleStaffGrowthChange = (year: number, value: string): void => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < -50 || numValue > 200) {
      setErrors({ ...errors, [`${year}-staffGrowth`]: 'Must be between -50% and 200%' });
      return;
    }

    const newErrors = { ...errors };
    delete newErrors[`${year}-staffGrowth`];
    setErrors(newErrors);

    const updatedData = localData.map((item) =>
      item.year === year ? { ...item, staffCostGrowthPercent: value } : item
    );
    setLocalData(updatedData);
    onChange(updatedData);
  };

  const handleRentGrowthChange = (year: number, value: string): void => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < -50 || numValue > 200) {
      setErrors({ ...errors, [`${year}-rentGrowth`]: 'Must be between -50% and 200%' });
      return;
    }

    const newErrors = { ...errors };
    delete newErrors[`${year}-rentGrowth`];
    setErrors(newErrors);

    const updatedData = localData.map((item) =>
      item.year === year ? { ...item, rentGrowthPercent: value } : item
    );
    setLocalData(updatedData);
    onChange(updatedData);
  };

  const formatNumber = (num: string | number): string => {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return '0';
    return new Intl.NumberFormat('en-US').format(numValue);
  };

  const getCellBorderClass = (year: number, field: string): string => {
    const errorKey = `${year}-${field}`;
    if (errors[errorKey]) return 'border-red-500';

    const originalItem = yearData.find((item) => item.year === year);
    const currentItem = localData.find((item) => item.year === year);

    if (!originalItem || !currentItem) return 'border-input';

    let isModified = false;
    switch (field) {
      case 'enrollment':
        isModified = originalItem.targetEnrollment !== currentItem.targetEnrollment;
        break;
      case 'staffCost':
        isModified = originalItem.staffCostBase !== currentItem.staffCostBase;
        break;
      case 'tuition':
        isModified = originalItem.averageTuitionPerStudent !== currentItem.averageTuitionPerStudent;
        break;
      case 'otherRevenue':
        isModified = originalItem.otherRevenue !== currentItem.otherRevenue;
        break;
      case 'opex':
        isModified = originalItem.opex !== currentItem.opex;
        break;
      case 'staffGrowth':
        isModified = originalItem.staffCostGrowthPercent !== currentItem.staffCostGrowthPercent;
        break;
      case 'rentGrowth':
        isModified = originalItem.rentGrowthPercent !== currentItem.rentGrowthPercent;
        break;
    }

    return isModified ? 'border-yellow-500' : 'border-input';
  };

  const isEditing = (year: number, field: string): boolean => {
    return editingCell?.year === year && editingCell?.field === field;
  };

  const calculateStaffCost = (growthPercent: string | null | undefined): number => {
    const growth = parseFloat(growthPercent || '0');
    return staffCostBase2024 * (1 + growth / 100);
  };

  const calculateRent = (growthPercent: string | null | undefined): number => {
    const growth = parseFloat(growthPercent || '0');
    return rentBase2024 * (1 + growth / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Year-by-Year Planning
        </CardTitle>
        <CardDescription>
          Configure enrollment and staff costs for each transition year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Year</TableHead>
                <TableHead className="w-40">Enrollment</TableHead>
                <TableHead className="w-48">Avg Tuition</TableHead>
                <TableHead className="w-48">Other Revenue</TableHead>
                <TableHead className="w-48">OpEx</TableHead>
                <TableHead className="w-56">Staff Costs</TableHead>
                <TableHead className="w-56">Rent</TableHead>
                <TableHead className="w-64">Live Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localData.map((item) => (
                <TableRow key={item.year}>
                  {/* Year */}
                  <TableCell className="font-medium">
                    <Badge variant="secondary">{item.year}</Badge>
                  </TableCell>

                  {/* Enrollment */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max={capacityCap}
                          value={item.targetEnrollment}
                          onChange={(e) => handleEnrollmentChange(item.year, e.target.value)}
                          onFocus={() => setEditingCell({ year: item.year, field: 'enrollment' })}
                          onBlur={() => setEditingCell(null)}
                          className={`w-28 ${getCellBorderClass(item.year, 'enrollment')}`}
                          disabled={disabled}
                        />
                        {!isEditing(item.year, 'enrollment') && (
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      {errors[`${item.year}-enrollment`] && (
                        <p className="text-xs text-red-500">{errors[`${item.year}-enrollment`]}</p>
                      )}
                    </div>
                  </TableCell>

                  {/* Average Tuition */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={item.averageTuitionPerStudent || ''}
                          onChange={(e) => handleTuitionChange(item.year, e.target.value)}
                          onFocus={() => setEditingCell({ year: item.year, field: 'tuition' })}
                          onBlur={() => setEditingCell(null)}
                          className={`w-32 font-mono ${getCellBorderClass(item.year, 'tuition')}`}
                          placeholder="25000"
                          disabled={disabled}
                        />
                        {!isEditing(item.year, 'tuition') && (
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      {errors[`${item.year}-tuition`] ? (
                        <p className="text-xs text-red-500">{errors[`${item.year}-tuition`]}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Per student (FR only)</p>
                      )}
                    </div>
                  </TableCell>

                  {/* Other Revenue */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.otherRevenue || '0'}
                          onChange={(e) => handleOtherRevenueChange(item.year, e.target.value)}
                          onFocus={() => setEditingCell({ year: item.year, field: 'otherRevenue' })}
                          onBlur={() => setEditingCell(null)}
                          className={`w-36 font-mono ${getCellBorderClass(item.year, 'otherRevenue')}`}
                          disabled={disabled}
                        />
                        {!isEditing(item.year, 'otherRevenue') && (
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      {errors[`${item.year}-otherRevenue`] ? (
                        <p className="text-xs text-red-500">
                          {errors[`${item.year}-otherRevenue`]}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Non-tuition revenue</p>
                      )}
                    </div>
                  </TableCell>

                  {/* OpEx (Operating Expenses) */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.opex || '0'}
                          onChange={(e) => handleOpexChange(item.year, e.target.value)}
                          onFocus={() => setEditingCell({ year: item.year, field: 'opex' })}
                          onBlur={() => setEditingCell(null)}
                          className={`w-40 font-mono ${getCellBorderClass(item.year, 'opex')}`}
                          placeholder="0"
                          disabled={disabled}
                        />
                        {!isEditing(item.year, 'opex') && (
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      {errors[`${item.year}-opex`] ? (
                        <p className="text-xs text-red-500">{errors[`${item.year}-opex`]}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(item.opex || '0')} SAR
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Staff Costs */}
                  <TableCell>
                    <div className="space-y-2">
                      {/* Base Year (read-only) */}
                      <div className="text-xs text-muted-foreground">
                        Base 2024: {formatNumber(staffCostBase2024)} SAR
                      </div>

                      {/* Growth % Input */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={item.staffCostGrowthPercent || '0'}
                          onChange={(e) => handleStaffGrowthChange(item.year, e.target.value)}
                          onFocus={() => setEditingCell({ year: item.year, field: 'staffGrowth' })}
                          onBlur={() => setEditingCell(null)}
                          className={`w-20 ${getCellBorderClass(item.year, 'staffGrowth')}`}
                          disabled={disabled}
                        />
                        <span className="text-sm">%</span>
                        {!isEditing(item.year, 'staffGrowth') && (
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>

                      {/* Calculated Value */}
                      {errors[`${item.year}-staffGrowth`] ? (
                        <p className="text-xs text-red-500">{errors[`${item.year}-staffGrowth`]}</p>
                      ) : (
                        <div className="text-sm font-mono">
                          = {formatNumber(calculateStaffCost(item.staffCostGrowthPercent))} SAR
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Rent */}
                  <TableCell>
                    <div className="space-y-2">
                      {/* Base Year (read-only) */}
                      <div className="text-xs text-muted-foreground">
                        Base 2024: {formatNumber(rentBase2024)} SAR
                      </div>

                      {/* Growth % Input */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={item.rentGrowthPercent || '0'}
                          onChange={(e) => handleRentGrowthChange(item.year, e.target.value)}
                          onFocus={() => setEditingCell({ year: item.year, field: 'rentGrowth' })}
                          onBlur={() => setEditingCell(null)}
                          className={`w-20 ${getCellBorderClass(item.year, 'rentGrowth')}`}
                          disabled={disabled}
                        />
                        <span className="text-sm">%</span>
                        {!isEditing(item.year, 'rentGrowth') && (
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>

                      {/* Calculated Value */}
                      {errors[`${item.year}-rentGrowth`] ? (
                        <p className="text-xs text-red-500">{errors[`${item.year}-rentGrowth`]}</p>
                      ) : (
                        <div className="text-sm font-mono">
                          = {formatNumber(calculateRent(item.rentGrowthPercent))} SAR
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Live Preview */}
                  <TableCell>
                    <LivePreviewCalculator
                      enrollment={item.targetEnrollment}
                      averageTuition={parseFloat(item.averageTuitionPerStudent || '25000')}
                      otherRevenue={parseFloat(item.otherRevenue || '0')}
                      opex={parseFloat(item.opex || '0')}
                      staffCosts={calculateStaffCost(item.staffCostGrowthPercent)}
                      rent={calculateRent(item.rentGrowthPercent)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-yellow-500 rounded" />
            <span>Modified (unsaved)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-red-500 rounded" />
            <span>Invalid value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-input rounded" />
            <span>Saved</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

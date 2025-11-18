/**
 * Serialization Utilities
 * Convert Prisma types (Decimal, Date) to plain JavaScript types for Client Components
 */

import type { Prisma } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';
import type { VersionWithRelations } from '@/services/version';

/**
 * Convert Prisma Decimal to number
 */
function decimalToNumber(value: Decimal | Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  // Prisma Decimal has a toNumber() method
  if (typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber();
  }
  // Fallback: convert to string then parse
  return parseFloat(value.toString());
}

/**
 * Serialize version data for Client Components
 * Converts Decimal fields to numbers and ensures dates are strings
 */
export function serializeVersionForClient(data: VersionWithRelations): VersionWithRelations {
  const serialized: any = { ...data };

  // Handle curriculum plans
  if (Array.isArray(serialized.curriculumPlans)) {
    serialized.curriculumPlans = serialized.curriculumPlans.map((plan: any) => ({
      ...plan,
      tuitionBase: decimalToNumber(plan.tuitionBase),
      tuitionGrowthRate: decimalToNumber(plan.tuitionGrowthRate),
      teacherRatio: decimalToNumber(plan.teacherRatio),
      nonTeacherRatio: decimalToNumber(plan.nonTeacherRatio),
      teacherMonthlySalary: decimalToNumber(plan.teacherMonthlySalary),
      nonTeacherMonthlySalary: decimalToNumber(plan.nonTeacherMonthlySalary),
    }));
  }

  // Handle capex rules
  if (Array.isArray(serialized.capexRules)) {
    serialized.capexRules = serialized.capexRules.map((rule: any) => ({
      ...rule,
      baseCost: decimalToNumber(rule.baseCost),
    }));
  }

  // Handle capex items
  if (Array.isArray(serialized.capexItems)) {
    serialized.capexItems = serialized.capexItems.map((item: any) => ({
      ...item,
      amount: decimalToNumber(item.amount),
      // CRITICAL: Preserve ruleId to distinguish auto-generated (ruleId !== null) from manual (ruleId === null)
      ruleId: item.ruleId ?? null, // Explicitly preserve ruleId (null for manual, string for auto)
    }));
  }

  // Handle opex sub accounts
  if (Array.isArray(serialized.opexSubAccounts)) {
    serialized.opexSubAccounts = serialized.opexSubAccounts.map((account: any) => ({
      ...account,
      percentOfRevenue: decimalToNumber(account.percentOfRevenue),
      fixedAmount: decimalToNumber(account.fixedAmount),
    }));
  }

  // Handle rent plan parameters (JSON field that might contain Decimal objects)
  if (serialized.rentPlan && serialized.rentPlan.parameters) {
    serialized.rentPlan = {
      ...serialized.rentPlan,
      parameters: serializeRentPlanParameters(serialized.rentPlan.parameters),
    };
  }

  // Ensure dates are strings (they should already be, but just in case)
  if (serialized.createdAt instanceof Date) {
    serialized.createdAt = serialized.createdAt.toISOString();
  }
  if (serialized.updatedAt instanceof Date) {
    serialized.updatedAt = serialized.updatedAt.toISOString();
  }
  if (serialized.lockedAt instanceof Date) {
    serialized.lockedAt = serialized.lockedAt.toISOString();
  }

  return serialized as VersionWithRelations;
}

/**
 * Recursively serialize rent plan parameters, converting Decimal objects to numbers
 */
function serializeRentPlanParameters(params: any): any {
  if (params === null || params === undefined) {
    return params;
  }

  // If it's a Decimal object, convert to number
  if (typeof (params as any).toNumber === 'function') {
    return (params as any).toNumber();
  }

  // If it's an array, serialize each element
  if (Array.isArray(params)) {
    return params.map(item => serializeRentPlanParameters(item));
  }

  // If it's an object, serialize each property
  if (typeof params === 'object' && params !== null) {
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      serialized[key] = serializeRentPlanParameters(value);
    }
    return serialized;
  }

  // Primitive value, return as-is
  return params;
}


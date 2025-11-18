/**
 * Version Detail Client Component
 * Client component for displaying version detail with tabs
 * Fetches data client-side for instant page load
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CapexTimelineChart } from '@/components/charts/CapexTimelineChart';
import { CapexCategory } from '@prisma/client';
import { VersionStatusBadge } from './VersionStatusBadge';
import { VersionActionMenu } from './VersionActionMenu';
import { CostsAnalysisDashboard } from './costs-analysis/CostsAnalysisDashboard';
import { cachedFetch } from '@/lib/utils/fetch-cache';
import { serializeVersionForClient } from '@/lib/utils/serialize';
import type { VersionWithRelations } from '@/services/version';
import { RentModel } from '@prisma/client';
import { ArrowLeft, Save, Edit2, X, Plus, Trash2 } from 'lucide-react';
import {
  CurriculumPlansHeader,
  CurriculumCard,
  type EditFormData,
} from './curriculum';

interface VersionDetailProps {
  versionId: string;
  version?: VersionWithRelations; // Optional initial version from server
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Use consistent format to avoid hydration mismatches
  // Format: DD/MM/YYYY (consistent across server and client)
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function VersionDetail({ versionId, version: initialVersion }: VersionDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [version, setVersion] = useState<VersionWithRelations | null>(initialVersion || null);
  const [loading, setLoading] = useState(!initialVersion);
  const [error, setError] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    capacity: number;
    tuitionBase: number;
    cpiFrequency: number;
    tuitionGrowthRate?: number; // Tuition growth rate (0-1, e.g., 0.05 = 5%), separate from CPI
    studentsPerTeacher?: number; // Number of students per teacher (e.g., 6.67)
    studentsPerNonTeacher?: number; // Number of students per non-teacher (e.g., 12.5)
    teacherMonthlySalary?: number; // Teacher monthly salary in SAR
    nonTeacherMonthlySalary?: number; // Non-teacher monthly salary in SAR
    rampUp?: {
      // Ramp-up period: 2028-2032 (first 5 years after relocation)
      [year: number]: number; // year -> percentage of capacity (0-100)
    };
  } | null>(null);
  const [editingRentPlan, setEditingRentPlan] = useState(false);
  const [rentPlanFormData, setRentPlanFormData] = useState<{
    rentModel: RentModel;
    parameters: Record<string, number>;
  } | null>(null);
  const [editingOpexId, setEditingOpexId] = useState<string | null>(null);
  const [opexFormData, setOpexFormData] = useState<{
    id: string;
    subAccountName: string;
    percentOfRevenue: number;
    isFixed: boolean;
    fixedAmount: number;
  } | null>(null);
  const [editingCapexRuleId, setEditingCapexRuleId] = useState<string | 'new' | null>(null);
  const [capexRuleFormData, setCapexRuleFormData] = useState<{
    id?: string;
    category: CapexCategory;
    cycleYears: number;
    baseCost: number;
    startingYear: number;
    inflationIndex?: string | null;
  } | null>(null);
  const [editingCapexId, setEditingCapexId] = useState<string | null>(null);
  const [capexFormData, setCapexFormData] = useState<{
    id: string;
    year: number;
    category: CapexCategory;
    amount: number;
    description: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const fetchedRef = useRef(false);
  const [adminSettings, setAdminSettings] = useState<{
    cpiRate: number;
    discountRate: number;
    taxRate: number;
  } | null>(null);
  const [adminSettingsLoading, setAdminSettingsLoading] = useState(true);

  // Fetch version data client-side
  useEffect(() => {
    if (initialVersion) {
      setVersion(initialVersion);
      setLoading(false);
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    console.log('📡 Fetching version details...');
    const fetchStart = performance.now();

    cachedFetch(`/api/versions/${versionId}`)
      .then(async response => {
        const fetchTime = performance.now() - fetchStart;
        
        // Clone response for error handling (response can only be read once)
        const responseClone = response.clone();
        
        if (!response.ok) {
          // Try to get error details from response
          let errorMessage = `Failed to fetch version: ${response.status}`;
          try {
            const errorData = await responseClone.json();
            errorMessage = errorData.error || errorMessage;
            console.error(`❌ API error (${response.status}):`, errorData);
          } catch {
            // Response might not be JSON, try text
            try {
              const text = await responseClone.text();
              console.error(`❌ API error (${response.status}):`, text);
            } catch {
              // If both fail, just use status
              console.error(`❌ API error (${response.status}): Unable to read response body`);
            }
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log(`✅ Version loaded in ${fetchTime.toFixed(0)}ms`);
        
        if (data.success && data.data) {
          const serializedVersion = serializeVersionForClient(data.data);
          setVersion(serializedVersion);
          setLoading(false);
        } else {
          setError(data.error || 'Failed to load version');
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('❌ Error fetching version:', err);
        setError(err.message || 'Failed to fetch version');
        setLoading(false);
      });
  }, [versionId, initialVersion]);

  // Fetch admin settings (required for Costs Analysis calculations)
  useEffect(() => {
    async function fetchAdminSettings() {
      try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        if (data.success && data.data) {
          // Map to the format expected by calculation functions
          setAdminSettings({
            cpiRate: data.data.cpiRate ?? 0.03,
            discountRate: data.data.discountRate ?? 0.08,
            taxRate: data.data.taxRate ?? 0.15,
          });
        } else {
          console.error('Failed to fetch admin settings:', data.error);
          // Set defaults if fetch fails (user might not have ADMIN role)
          setAdminSettings({
            cpiRate: 0.03,
            discountRate: 0.08,
            taxRate: 0.15,
          });
        }
      } catch (error) {
        console.error('Failed to fetch admin settings:', error);
        // Set defaults on error
        setAdminSettings({
          cpiRate: 0.03,
          discountRate: 0.08,
          taxRate: 0.15,
        });
      } finally {
        setAdminSettingsLoading(false);
      }
    }
    fetchAdminSettings();
  }, []);

  // Handle edit start
  const handleEditStart = (plan: { id: string; capacity: number; tuitionBase: number | string; cpiFrequency: number; teacherRatio?: number | string | null; nonTeacherRatio?: number | string | null; tuitionGrowthRate?: number | string | null; teacherMonthlySalary?: number | string | null; nonTeacherMonthlySalary?: number | string | null; studentsProjection?: unknown }) => {
    setEditingPlanId(plan.id);
    // Convert Decimal to number if needed, then convert ratio to students per teacher
    const teacherRatio = plan.teacherRatio 
      ? (typeof plan.teacherRatio === 'string' ? parseFloat(plan.teacherRatio) : plan.teacherRatio)
      : 0.15; // Default ratio
    const nonTeacherRatio = plan.nonTeacherRatio
      ? (typeof plan.nonTeacherRatio === 'string' ? parseFloat(plan.nonTeacherRatio) : plan.nonTeacherRatio)
      : 0.08; // Default ratio
    
    // Convert ratio to students per teacher/non-teacher for easier input
    const studentsPerTeacher = teacherRatio > 0 ? 1 / teacherRatio : 6.67; // Default: 6.67 students per teacher
    const studentsPerNonTeacher = nonTeacherRatio > 0 ? 1 / nonTeacherRatio : 12.5; // Default: 12.5 students per non-teacher
    
    // Parse tuition growth rate
    const tuitionGrowthRate = plan.tuitionGrowthRate
      ? (typeof plan.tuitionGrowthRate === 'string' ? parseFloat(plan.tuitionGrowthRate) : plan.tuitionGrowthRate)
      : 0.03; // Default: 3%
    
    // Parse monthly salaries - use 0 instead of undefined to keep inputs controlled
    const teacherMonthlySalary = plan.teacherMonthlySalary
      ? (typeof plan.teacherMonthlySalary === 'string' ? parseFloat(plan.teacherMonthlySalary) : plan.teacherMonthlySalary)
      : 0;
    const nonTeacherMonthlySalary = plan.nonTeacherMonthlySalary
      ? (typeof plan.nonTeacherMonthlySalary === 'string' ? parseFloat(plan.nonTeacherMonthlySalary) : plan.nonTeacherMonthlySalary)
      : 0;
    
    // Parse studentsProjection JSON to extract ramp-up period (2028-2032) as percentages
    const rampUp: { [year: number]: number } = {};
    if (plan.studentsProjection && typeof plan.studentsProjection === 'object') {
      try {
        const projection = Array.isArray(plan.studentsProjection) 
          ? plan.studentsProjection 
          : JSON.parse(String(plan.studentsProjection));
        
        if (Array.isArray(projection)) {
          projection.forEach((entry: { year?: number; students?: number }) => {
            if (entry.year && entry.students !== undefined && entry.year >= 2028 && entry.year <= 2032) {
              const students = typeof entry.students === 'number' ? entry.students : parseInt(String(entry.students)) || 0;
              // Convert to percentage of capacity
              rampUp[entry.year] = plan.capacity > 0 ? (students / plan.capacity) * 100 : 0;
            }
          });
        }
      } catch (e) {
        // If parsing fails, use defaults
        console.warn('Failed to parse studentsProjection:', e);
      }
    }
    
    // If no ramp-up data exists, set defaults based on curriculum type (as percentages)
    const isFR = (plan as any).curriculumType === 'FR';
    if (Object.keys(rampUp).length === 0) {
      // FR: Established school, starts at 75% capacity
      // IB: New program, starts at 15% capacity
      rampUp[2028] = isFR ? 75 : 15;
      rampUp[2029] = isFR ? 85 : 30;
      rampUp[2030] = isFR ? 90 : 50;
      rampUp[2031] = isFR ? 95 : 75;
      rampUp[2032] = 100; // 100% capacity by year 5
    }
    
    setEditFormData({
      capacity: plan.capacity,
      tuitionBase: typeof plan.tuitionBase === 'string' ? parseFloat(plan.tuitionBase) : plan.tuitionBase,
      cpiFrequency: plan.cpiFrequency,
      tuitionGrowthRate,
      studentsPerTeacher,
      studentsPerNonTeacher,
      teacherMonthlySalary,
      nonTeacherMonthlySalary,
      rampUp,
    });
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingPlanId(null);
    setEditFormData(null);
  };

  // Handle IB enable/disable toggle
  const handleIBToggle = async (enabled: boolean): Promise<void> => {
    if (!version) return;

    const ibPlan = version.curriculumPlans?.find((cp) => cp.curriculumType === 'IB');
    if (!ibPlan) return;

    const newCapacity = enabled ? 200 : 0; // Default to 200 if enabling, 0 if disabling

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/versions/${version.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculumPlans: [
            {
              id: ibPlan.id,
              capacity: newCapacity,
            },
          ],
        }),
      });

      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Server error (${response.status} ${response.statusText})`;
        }
        setError(errorMessage);
        return;
      }

      const result = await response.json();
      if (!result.success) {
        setError(result.error || result.message || 'Update failed');
        return;
      }

      if (result.data && Array.isArray(result.data.curriculumPlans)) {
        setVersion((prevVersion) => {
          if (!prevVersion) return prevVersion;

          const updatedPlanIds = new Set(result.data.curriculumPlans.map((p: any) => p.id));
          const existingPlansNotUpdated = (prevVersion.curriculumPlans || []).filter(
            (p) => !updatedPlanIds.has(p.id)
          );
          const mergedPlans = [...existingPlansNotUpdated, ...result.data.curriculumPlans];

          return {
            ...prevVersion,
            curriculumPlans: mergedPlans,
          };
        });
        setError(null);
      } else {
        setError('Update succeeded but response format unexpected. Please refresh the page to see changes.');
      }
    } catch (error) {
      console.error('Error updating IB status:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to update IB status. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle save (updated to work with EditFormData)
  const handleSave = async (planId: string, formData?: EditFormData) => {
    const dataToSave = formData || editFormData;
    if (!dataToSave || !version) return;

    setSaving(true);
    try {
      // Build the request payload
      const requestPayload = {
        curriculumPlans: version.curriculumPlans.map(plan =>
          plan.id === planId
            ? {
                id: plan.id,
                capacity: dataToSave.capacity,
                tuitionBase: dataToSave.tuitionBase,
                cpiFrequency: dataToSave.cpiFrequency,
                // Convert students per teacher/non-teacher back to ratio for storage (only if provided)
                ...(dataToSave.studentsPerTeacher && dataToSave.studentsPerTeacher > 0 && {
                  teacherRatio: 1 / dataToSave.studentsPerTeacher
                }),
                ...(dataToSave.studentsPerNonTeacher && dataToSave.studentsPerNonTeacher > 0 && {
                  nonTeacherRatio: 1 / dataToSave.studentsPerNonTeacher
                }),
                // Build studentsProjection: ramp-up period (2028-2032) + maintain 2032 enrollment % (2033-2052)
                studentsProjection: (() => {
                  const projection: Array<{ year: number; students: number }> = [];
                  // Get 2032 percentage (last year of ramp-up)
                  const year2032Percentage = dataToSave.rampUp?.[2032] ?? 100;
                  const year2032Students = Math.round((dataToSave.capacity * year2032Percentage) / 100);
                  
                  // Historical and transition years (2023-2027): 0 students
                  for (let year = 2023; year <= 2027; year++) {
                    projection.push({ year, students: 0 });
                  }
                  
                  // Ramp-up period (2028-2032): convert percentages to students
                  for (let year = 2028; year <= 2032; year++) {
                    const percentage = dataToSave.rampUp?.[year] ?? (year === 2032 ? 100 : 0);
                    const students = Math.round((dataToSave.capacity * percentage) / 100);
                    projection.push({ year, students });
                  }
                  
                  // Post-ramp-up period (2033-2052): maintain same enrollment as 2032 (same utilization %)
                  // This maintains the enrollment percentage from the last year of ramp-up
                  for (let year = 2033; year <= 2052; year++) {
                    projection.push({ year, students: year2032Students });
                  }
                  
                  return projection;
                })(),
                // Save tuition growth rate (only if provided)
                ...(dataToSave.tuitionGrowthRate !== undefined && { tuitionGrowthRate: dataToSave.tuitionGrowthRate }),
                // Save monthly salaries (only if > 0, convert 0 to undefined to indicate not set)
                ...(dataToSave.teacherMonthlySalary && dataToSave.teacherMonthlySalary > 0 && { teacherMonthlySalary: dataToSave.teacherMonthlySalary }),
                ...(dataToSave.nonTeacherMonthlySalary && dataToSave.nonTeacherMonthlySalary > 0 && { nonTeacherMonthlySalary: dataToSave.nonTeacherMonthlySalary }),
              }
            : { id: plan.id }
        ),
      };

      console.log('📤 Sending PATCH request:', JSON.stringify(requestPayload, null, 2));

      const response = await fetch(`/api/versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        let errorData: any = {};
        let responseText = '';
        try {
          responseText = await response.text();
          console.error('❌ Error response text:', responseText);
          errorData = responseText ? JSON.parse(responseText) : {};
          console.error('❌ Parsed error data:', errorData);
        } catch (e) {
          console.error('❌ Failed to parse error response:', e);
          console.error('❌ Raw response text:', responseText);
          errorData = { 
            error: `Server error (${response.status} ${response.statusText})`,
            rawResponse: responseText || '(empty response)',
          };
        }
        console.error('❌ Save failed:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorData,
          hasError: !!errorData.error,
          hasMessage: !!errorData.message,
        });
        const errorMessage = errorData.error || errorData.message || `Failed to save changes (${response.status} ${response.statusText})`;
        setError(errorMessage);
        setSaving(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Merge updated data with existing state to preserve optional fields
        const serializedVersion = serializeVersionForClient(data.data);
        setVersion(prevVersion => {
          if (!prevVersion) return serializedVersion;
          // Merge: use new data for updated fields, keep existing for fields that weren't returned
          return {
            ...serializedVersion,
            // Preserve curriculum plans if not in response (partial update)
            curriculumPlans: serializedVersion.curriculumPlans?.length > 0
              ? serializedVersion.curriculumPlans
              : (prevVersion.curriculumPlans || []),
            // Preserve rent plan if not in response
            rentPlan: serializedVersion.rentPlan || prevVersion.rentPlan,
            // Preserve optional fields if they weren't in the response (empty arrays/null)
            capexItems: serializedVersion.capexItems !== undefined
              ? serializedVersion.capexItems
              : (prevVersion.capexItems || []),
            opexSubAccounts: serializedVersion.opexSubAccounts?.length > 0
              ? serializedVersion.opexSubAccounts
              : (prevVersion.opexSubAccounts || []),
            creator: serializedVersion.creator || prevVersion.creator,
            basedOn: serializedVersion.basedOn || prevVersion.basedOn,
            derivatives: serializedVersion.derivatives?.length > 0
              ? serializedVersion.derivatives
              : (prevVersion.derivatives || []),
          };
        });
        setEditingPlanId(null);
        setEditFormData(null);
      } else {
        console.error('❌ Save failed:', data);
        setError(data.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('❌ Failed to save:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Handle rent plan edit start
  const handleRentPlanEditStart = () => {
    if (!version?.rentPlan) return;
    
    const params = version.rentPlan.parameters as Record<string, unknown>;
    // Properly initialize form data with existing parameters
    const initialParams: Record<string, number> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'number') {
        initialParams[key] = value;
      } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        initialParams[key] = parseFloat(value);
      }
    });
    
    setRentPlanFormData({
      rentModel: version.rentPlan.rentModel,
      parameters: initialParams,
    });
    setEditingRentPlan(true);
  };

  // Handle rent plan edit cancel
  const handleRentPlanEditCancel = () => {
    setEditingRentPlan(false);
    setRentPlanFormData(null);
  };

  // Handle rent plan save
  const handleRentPlanSave = async (rentModel: RentModel, parameters: Record<string, number>) => {
    if (!version?.rentPlan) return;
    
    // Update form data state for consistency
    setRentPlanFormData({
      rentModel,
      parameters,
    });

    setSaving(true);
    try {
      const response = await fetch(`/api/versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentPlan: {
            id: version.rentPlan.id,
            rentModel,
            parameters,
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        // Merge updated data with existing state to preserve optional fields
        const serializedVersion = serializeVersionForClient(data.data);
        setVersion(prevVersion => {
          if (!prevVersion) return serializedVersion;
          // Merge: use new data for updated fields, keep existing for fields that weren't returned
          return {
            ...serializedVersion,
            // Preserve curriculum plans if not in response (partial update)
            curriculumPlans: serializedVersion.curriculumPlans?.length > 0
              ? serializedVersion.curriculumPlans
              : (prevVersion.curriculumPlans || []),
            // Preserve rent plan if not in response
            rentPlan: serializedVersion.rentPlan || prevVersion.rentPlan,
            // Preserve optional fields if they weren't in the response (empty arrays/null)
            capexItems: serializedVersion.capexItems !== undefined
              ? serializedVersion.capexItems
              : (prevVersion.capexItems || []),
            opexSubAccounts: serializedVersion.opexSubAccounts?.length > 0
              ? serializedVersion.opexSubAccounts
              : (prevVersion.opexSubAccounts || []),
            creator: serializedVersion.creator || prevVersion.creator,
            basedOn: serializedVersion.basedOn || prevVersion.basedOn,
            derivatives: serializedVersion.derivatives?.length > 0
              ? serializedVersion.derivatives
              : (prevVersion.derivatives || []),
          };
        });
        setEditingRentPlan(false);
        setRentPlanFormData(null);
      } else {
        setError(data.error || 'Failed to save rent plan changes');
      }
    } catch (err) {
      console.error('Failed to save rent plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to save rent plan changes');
    } finally {
      setSaving(false);
    }
  };

  // Handle Opex sub-account save (create or update)
  const handleOpexSave = async (id: string) => {
    if (!opexFormData || !version) return;

    // Validation
    if (!opexFormData.subAccountName.trim()) {
      setError('Sub-account name is required');
      return;
    }

    if (!opexFormData.isFixed && opexFormData.percentOfRevenue < 0) {
      setError('Percentage cannot be negative');
      return;
    }

    if (opexFormData.isFixed && opexFormData.fixedAmount < 0) {
      setError('Fixed amount cannot be negative');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isNew = id === 'new';
      const endpoint = `/api/versions/${versionId}`;
      
      // Build the opex sub-accounts array
      const updatedOpexAccounts = isNew
        ? [
            ...(version.opexSubAccounts || []),
            {
              subAccountName: opexFormData.subAccountName,
              percentOfRevenue: opexFormData.isFixed ? null : opexFormData.percentOfRevenue,
              isFixed: opexFormData.isFixed,
              fixedAmount: opexFormData.isFixed ? opexFormData.fixedAmount : null,
            },
          ]
        : (version.opexSubAccounts || []).map((account) =>
            account.id === id
              ? {
                  id: account.id,
                  subAccountName: opexFormData.subAccountName,
                  percentOfRevenue: opexFormData.isFixed ? null : opexFormData.percentOfRevenue,
                  isFixed: opexFormData.isFixed,
                  fixedAmount: opexFormData.isFixed ? opexFormData.fixedAmount : null,
                }
              : account
          );

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opexSubAccounts: updatedOpexAccounts,
        }),
      });

      if (!response.ok) {
        const responseClone = response.clone();
        let errorMessage = `Failed to save opex sub-account (${response.status} ${response.statusText})`;
        try {
          const errorData = await responseClone.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response might not be JSON
        }
        setError(errorMessage);
        setSaving(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Merge updated data with existing state
        const serializedVersion = serializeVersionForClient(data.data);
        setVersion((prevVersion) => {
          if (!prevVersion) return serializedVersion;
          return {
            ...serializedVersion,
            curriculumPlans:
              serializedVersion.curriculumPlans?.length > 0
                ? serializedVersion.curriculumPlans
                : prevVersion.curriculumPlans || [],
            rentPlan: serializedVersion.rentPlan || prevVersion.rentPlan,
            capexItems:
              serializedVersion.capexItems?.length > 0
                ? serializedVersion.capexItems
                : prevVersion.capexItems || [],
            opexSubAccounts:
              serializedVersion.opexSubAccounts !== undefined
                ? serializedVersion.opexSubAccounts
                : prevVersion.opexSubAccounts || [],
            creator: serializedVersion.creator || prevVersion.creator,
            basedOn: serializedVersion.basedOn || prevVersion.basedOn,
            derivatives:
              serializedVersion.derivatives?.length > 0
                ? serializedVersion.derivatives
                : prevVersion.derivatives || [],
          };
        });
        setEditingOpexId(null);
        setOpexFormData(null);
      } else {
        setError(data.error || 'Failed to save opex sub-account');
      }
    } catch (err) {
      console.error('Failed to save opex sub-account:', err);
      setError(err instanceof Error ? err.message : 'Failed to save opex sub-account');
    } finally {
      setSaving(false);
    }
  };

  // Handle Opex sub-account delete
  const handleOpexDelete = async (id: string) => {
    if (!version) return;

    if (!confirm('Are you sure you want to delete this opex sub-account?')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedOpexAccounts = (version.opexSubAccounts || []).filter(
        (account) => account.id !== id
      );

      const response = await fetch(`/api/versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opexSubAccounts: updatedOpexAccounts,
        }),
      });

      if (!response.ok) {
        const responseClone = response.clone();
        let errorMessage = `Failed to delete opex sub-account (${response.status} ${response.statusText})`;
        try {
          const errorData = await responseClone.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response might not be JSON
        }
        setError(errorMessage);
        setSaving(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Merge updated data with existing state
        const serializedVersion = serializeVersionForClient(data.data);
        setVersion((prevVersion) => {
          if (!prevVersion) return serializedVersion;
          return {
            ...serializedVersion,
            curriculumPlans:
              serializedVersion.curriculumPlans?.length > 0
                ? serializedVersion.curriculumPlans
                : prevVersion.curriculumPlans || [],
            rentPlan: serializedVersion.rentPlan || prevVersion.rentPlan,
            capexItems:
              serializedVersion.capexItems?.length > 0
                ? serializedVersion.capexItems
                : prevVersion.capexItems || [],
            opexSubAccounts:
              serializedVersion.opexSubAccounts !== undefined
                ? serializedVersion.opexSubAccounts
                : prevVersion.opexSubAccounts || [],
            creator: serializedVersion.creator || prevVersion.creator,
            basedOn: serializedVersion.basedOn || prevVersion.basedOn,
            derivatives:
              serializedVersion.derivatives?.length > 0
                ? serializedVersion.derivatives
                : prevVersion.derivatives || [],
          };
        });
      } else {
        setError(data.error || 'Failed to delete opex sub-account');
      }
    } catch (err) {
      console.error('Failed to delete opex sub-account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete opex sub-account');
    } finally {
      setSaving(false);
    }
  };

  // Handle Capex item save (create or update)
  const handleCapexSave = async () => {
    if (!capexFormData || !version) return;

    // Validation
    if (capexFormData.year < 2023 || capexFormData.year > 2052) {
      setError('Year must be between 2023 and 2052');
      return;
    }

    if (capexFormData.amount < 0) {
      setError('Amount cannot be negative');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isNew = capexFormData.id === 'new';
      const endpoint = `/api/versions/${versionId}`;
      
      // Build the capex items array (MANUAL ITEMS ONLY)
      // CRITICAL: Only include manual items (ruleId === null/undefined)
      // Auto-generated items should NOT be sent - they're managed by rules
      const manualItemsOnly = (version.capexItems || []).filter(
        (item: any) => item.ruleId === null || item.ruleId === undefined
      );
      
      const updatedCapexItems = isNew
        ? [
            ...manualItemsOnly,
            {
              year: capexFormData.year,
              category: capexFormData.category,
              amount: capexFormData.amount,
              description: capexFormData.description || null,
            },
          ]
        : manualItemsOnly.map((item) =>
            item.id === capexFormData.id
              ? {
                  id: item.id,
                  year: capexFormData.year,
                  category: capexFormData.category,
                  amount: capexFormData.amount,
                  description: capexFormData.description || null,
                }
              : item
          );

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capexItems: updatedCapexItems,
        }),
      });

      if (!response.ok) {
        const responseClone = response.clone();
        let errorMessage = `Failed to save capex item (${response.status} ${response.statusText})`;
        try {
          const errorData = await responseClone.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response might not be JSON
        }
        setError(errorMessage);
        setSaving(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Merge updated data with existing state
        const serializedVersion = serializeVersionForClient(data.data);
        setVersion((prevVersion) => {
          if (!prevVersion) return serializedVersion;
          return {
            ...serializedVersion,
            curriculumPlans:
              serializedVersion.curriculumPlans?.length > 0
                ? serializedVersion.curriculumPlans
                : prevVersion.curriculumPlans || [],
            rentPlan: serializedVersion.rentPlan || prevVersion.rentPlan,
            capexItems:
              serializedVersion.capexItems !== undefined
                ? serializedVersion.capexItems
                : prevVersion.capexItems || [],
            opexSubAccounts:
              serializedVersion.opexSubAccounts !== undefined
                ? serializedVersion.opexSubAccounts
                : prevVersion.opexSubAccounts || [],
            creator: serializedVersion.creator || prevVersion.creator,
            basedOn: serializedVersion.basedOn || prevVersion.basedOn,
            derivatives:
              serializedVersion.derivatives?.length > 0
                ? serializedVersion.derivatives
                : prevVersion.derivatives || [],
          };
        });
        setEditingCapexId(null);
        setCapexFormData(null);
      } else {
        setError(data.error || 'Failed to save capex item');
      }
    } catch (err) {
      console.error('Failed to save capex item:', err);
      setError(err instanceof Error ? err.message : 'Failed to save capex item');
    } finally {
      setSaving(false);
    }
  };

  // Handle Capex rule save (create or update)
  const handleCapexRuleSave = async () => {
    if (!capexRuleFormData || !version) return;

    // Validation
    if (capexRuleFormData.cycleYears < 1 || capexRuleFormData.cycleYears > 50) {
      setError('Cycle years must be between 1 and 50');
      return;
    }

    if (capexRuleFormData.baseCost < 0) {
      setError('Base cost cannot be negative');
      return;
    }

    if (capexRuleFormData.startingYear < 2023 || capexRuleFormData.startingYear > 2052) {
      setError('Starting year must be between 2023 and 2052');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const endpoint = `/api/versions/${versionId}`;
      
      // Build the capex rules array
      const existingRules = version.capexRules || [];
      const updatedCapexRules = capexRuleFormData.id === 'new' || !capexRuleFormData.id
        ? [
            ...existingRules.filter((r: any) => r.category !== capexRuleFormData.category), // Remove existing rule for this category
            {
              category: capexRuleFormData.category,
              cycleYears: capexRuleFormData.cycleYears,
              baseCost: capexRuleFormData.baseCost,
              startingYear: capexRuleFormData.startingYear,
              inflationIndex: capexRuleFormData.inflationIndex || null,
            },
          ]
        : existingRules.map((rule: any) =>
            rule.id === capexRuleFormData.id
              ? {
                  id: rule.id,
                  category: capexRuleFormData.category,
                  cycleYears: capexRuleFormData.cycleYears,
                  baseCost: capexRuleFormData.baseCost,
                  startingYear: capexRuleFormData.startingYear,
                  inflationIndex: capexRuleFormData.inflationIndex || null,
                }
              : rule
          );

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capexRules: updatedCapexRules,
        }),
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If response is not JSON, try to get text
          const text = await response.text();
          throw new Error(`Server error (${response.status}): ${text || 'Unknown error'}`);
        }
        
        // Show detailed validation errors if available
        if (errorData.details && typeof errorData.details === 'object') {
          const errorMessages = Object.entries(errorData.details)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          throw new Error(errorMessages || errorData.error || 'Failed to save capex rule');
        }
        throw new Error(errorData.error || `Failed to save capex rule (${response.status})`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Merge API response with existing state
        const serializedVersion = serializeVersionForClient(result.data);
        setVersion((prev) => ({
          ...prev!,
          ...serializedVersion,
          capexRules: serializedVersion.capexRules !== undefined ? serializedVersion.capexRules : prev?.capexRules,
          capexItems: serializedVersion.capexItems !== undefined ? serializedVersion.capexItems : prev?.capexItems,
        }));
        setEditingCapexRuleId(null);
        setCapexRuleFormData(null);
      } else {
        throw new Error(result.error || 'Failed to save capex rule');
      }
    } catch (err) {
      console.error('Failed to save capex rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save capex rule');
    } finally {
      setSaving(false);
    }
  };

  // Handle Capex rule delete
  const handleCapexRuleDelete = async (id: string) => {
    if (!version) return;

    if (!confirm('Are you sure you want to delete this capex rule? This will also delete all auto-generated capex items for this category.')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const endpoint = `/api/versions/${versionId}`;
      const updatedCapexRules = (version.capexRules || []).filter((rule: any) => rule.id !== id);

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capexRules: updatedCapexRules,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete capex rule');
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Merge API response with existing state
        const serializedVersion = serializeVersionForClient(result.data);
        setVersion((prev) => ({
          ...prev!,
          ...serializedVersion,
          capexRules: serializedVersion.capexRules !== undefined ? serializedVersion.capexRules : prev?.capexRules,
          capexItems: serializedVersion.capexItems !== undefined ? serializedVersion.capexItems : prev?.capexItems,
        }));
      } else {
        throw new Error(result.error || 'Failed to delete capex rule');
      }
    } catch (err) {
      console.error('Failed to delete capex rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete capex rule');
    } finally {
      setSaving(false);
    }
  };

  // Handle Capex item delete
  const handleCapexDelete = async (id: string) => {
    if (!version) return;

    if (!confirm('Are you sure you want to delete this capex item?')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // CRITICAL: Only filter manual items - auto items can't be deleted this way
      // Auto items can only be deleted by deleting the rule
      const updatedCapexItems = (version.capexItems || [])
        .filter((item: any) => {
          // Only include manual items (ruleId === null/undefined)
          const isManual = item.ruleId === null || item.ruleId === undefined;
          // Exclude the item being deleted
          const isNotDeleted = item.id !== id;
          return isManual && isNotDeleted;
        });

      const response = await fetch(`/api/versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capexItems: updatedCapexItems,
        }),
      });

      if (!response.ok) {
        const responseClone = response.clone();
        let errorMessage = `Failed to delete capex item (${response.status} ${response.statusText})`;
        try {
          const errorData = await responseClone.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response might not be JSON
        }
        setError(errorMessage);
        setSaving(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Merge updated data with existing state
        const serializedVersion = serializeVersionForClient(data.data);
        setVersion((prevVersion) => {
          if (!prevVersion) return serializedVersion;
          return {
            ...serializedVersion,
            curriculumPlans:
              serializedVersion.curriculumPlans?.length > 0
                ? serializedVersion.curriculumPlans
                : prevVersion.curriculumPlans || [],
            rentPlan: serializedVersion.rentPlan || prevVersion.rentPlan,
            capexItems:
              serializedVersion.capexItems !== undefined
                ? serializedVersion.capexItems
                : prevVersion.capexItems || [],
            opexSubAccounts:
              serializedVersion.opexSubAccounts !== undefined
                ? serializedVersion.opexSubAccounts
                : prevVersion.opexSubAccounts || [],
            creator: serializedVersion.creator || prevVersion.creator,
            basedOn: serializedVersion.basedOn || prevVersion.basedOn,
            derivatives:
              serializedVersion.derivatives?.length > 0
                ? serializedVersion.derivatives
                : prevVersion.derivatives || [],
          };
        });
      } else {
        setError(data.error || 'Failed to delete capex item');
      }
    } catch (err) {
      console.error('Failed to delete capex item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete capex item');
    } finally {
      setSaving(false);
    }
  };

  // Show error state if there's an error and no version data
  if (error && !version) {
    return (
      <Card className="p-6">
        <div className="text-destructive">
          {error || 'Version not found'}
        </div>
      </Card>
    );
  }

  // If no version yet, show skeleton but keep structure
  // This allows the page to be interactive immediately
  if (!version) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>

        {/* Metadata Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs Skeleton */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="rent">Rent</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/versions')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Versions
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{version.name}</h1>
            <VersionStatusBadge status={version.status} />
          </div>
          {version.description && (
            <p className="text-muted-foreground">{version.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <VersionActionMenu version={version} />
        </div>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Version Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Mode:</span>{' '}
              <span>{version.mode === 'RELOCATION_2028' ? 'Relocation 2028' : 'Historical Baseline'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{' '}
              <span>{formatDate(version.createdAt)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created By:</span>{' '}
              <span>{version.creator?.name || version.creator?.email || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>{' '}
              <span>{formatDate(version.updatedAt)}</span>
            </div>
          </div>
          {version.basedOn && (
            <div>
              <span className="text-muted-foreground">Based On:</span>{' '}
              <span>{version.basedOn.name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="costs">Costs Analysis</TabsTrigger>
          <TabsTrigger value="capex">Capex</TabsTrigger>
          <TabsTrigger value="opex">Opex</TabsTrigger>
          <TabsTrigger value="tuition-sim">Tuition Sim</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Version summary and key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Curriculum Plans</div>
                  <div className="text-2xl font-bold">{version.curriculumPlans?.length ?? 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rent Plan</div>
                  <div className="text-2xl font-bold">{version.rentPlan ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Capex Items</div>
                  <div className="text-2xl font-bold">{version.capexItems?.length ?? 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Opex Accounts</div>
                  <div className="text-2xl font-bold">{version.opexSubAccounts?.length ?? 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-4">
          <Card>
            <CurriculumPlansHeader />
            <CardContent>
              {!version.curriculumPlans || version.curriculumPlans.length === 0 ? (
                <p className="text-muted-foreground">No curriculum plans configured</p>
              ) : (
                <div className="space-y-4">
                  {/* Error display for curriculum updates (including IB toggle) */}
                  {error && activeTab === 'curriculum' && (
                    <div className="p-3 border border-destructive rounded-lg bg-destructive/10">
                      <p className="text-sm text-destructive">{error}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs"
                        onClick={() => setError(null)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}

                  {/* Curriculum Cards - Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {version.curriculumPlans.map((plan) => {
                      const isEditing = editingPlanId === plan.id;
                      const canEdit = version.status === 'DRAFT' || version.status === 'READY';
                      const ibEnabled = plan.curriculumType === 'IB' ? (plan.capacity > 0) : true;
                      const canToggleIB = plan.curriculumType === 'IB' && canEdit && version.status !== 'LOCKED';

                      return (
                        <CurriculumCard
                          key={plan.id}
                          curriculumType={plan.curriculumType}
                          plan={plan}
                          isEditing={isEditing}
                          editFormData={editFormData}
                          onEditStart={() => handleEditStart(plan)}
                          onEditCancel={handleEditCancel}
                          onSave={async (formData: EditFormData) => {
                            await handleSave(plan.id, formData);
                          }}
                          onEnableToggle={canToggleIB ? handleIBToggle : undefined}
                          canEdit={canEdit}
                          canToggleIB={canToggleIB}
                          saving={saving}
                          ibEnabled={ibEnabled}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          {/* Costs Analysis Tab - Dashboard with KPI metrics, rent analysis, cost breakdown */}
          {adminSettingsLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Costs Analysis</CardTitle>
                <CardDescription>Loading admin settings...</CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : version ? (
            <CostsAnalysisDashboard
              version={version}
              adminSettings={adminSettings}
              onRentEditStart={handleRentPlanEditStart}
              onRentSave={handleRentPlanSave}
              onRentCancel={handleRentPlanEditCancel}
              editingRentPlan={editingRentPlan}
              saving={saving}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Costs Analysis</CardTitle>
                <CardDescription>Loading version data...</CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="capex" className="space-y-4">
          {/* Rules Configuration Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Auto-Reinvestment Rules</CardTitle>
                  <CardDescription>Configure reinvestment cycles for each category. Items are auto-generated based on these rules.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: CapexCategory.BUILDING, label: 'Building', defaultCycle: 20 },
                  { category: CapexCategory.TECHNOLOGY, label: 'Technology', defaultCycle: 4 },
                  { category: CapexCategory.EQUIPMENT, label: 'Equipment', defaultCycle: 7 },
                  { category: CapexCategory.FURNITURE, label: 'Furniture', defaultCycle: 7 },
                  { category: CapexCategory.VEHICLES, label: 'Vehicles', defaultCycle: 10 },
                ].map(({ category, label, defaultCycle }) => {
                  const existingRule = version.capexRules?.find((r: any) => r.category === category);
                  return (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{label}</h4>
                          {existingRule ? (
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <div>Cycle: Every {existingRule.cycleYears} years</div>
                              <div>Base Cost: {typeof existingRule.baseCost === 'number' ? existingRule.baseCost.toLocaleString('en-US') : String(existingRule.baseCost || 0)} SAR</div>
                              <div>Starting Year: {existingRule.startingYear}</div>
                              <div>Inflation: {existingRule.inflationIndex || 'Global CPI'}</div>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">No rule configured (default: {defaultCycle} years)</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCapexRuleId(existingRule ? existingRule.id : 'new');
                              setCapexRuleFormData({
                                id: existingRule?.id,
                                category,
                                cycleYears: existingRule?.cycleYears || defaultCycle,
                                baseCost: typeof existingRule?.baseCost === 'number' ? existingRule.baseCost : parseFloat(String(existingRule?.baseCost || 0)),
                                startingYear: existingRule?.startingYear || 2028,
                                inflationIndex: existingRule?.inflationIndex || null,
                              });
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            {existingRule ? 'Edit' : 'Configure'}
                          </Button>
                          {existingRule && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCapexRuleDelete(existingRule.id)}
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Chart */}
          {version.capexItems && version.capexItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Capex Timeline</CardTitle>
                <CardDescription>Visualization of capital expenditures over time</CardDescription>
              </CardHeader>
              <CardContent>
                <CapexTimelineChart
                  data={version.capexItems.map((item) => ({
                    year: item.year,
                    amount: typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)),
                    category: item.category === CapexCategory.BUILDING ? 'Building' :
                             item.category === CapexCategory.TECHNOLOGY ? 'Technology' :
                             item.category === CapexCategory.EQUIPMENT ? 'Equipment' :
                             item.category === CapexCategory.FURNITURE ? 'Furniture' :
                             item.category === CapexCategory.VEHICLES ? 'Vehicles' : 'Other',
                  }))}
                />
              </CardContent>
            </Card>
          )}

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Capex Items Summary</CardTitle>
                  <CardDescription>All capex items (auto-generated from rules + manual entries)</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCapexId('new');
                    setCapexFormData({
                      id: 'new',
                      year: 2028,
                      category: CapexCategory.BUILDING,
                      amount: 0,
                      description: '',
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manual Capex Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {version.capexItems && version.capexItems.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left">Year</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-right">Amount (SAR)</th>
                        <th className="px-4 py-2 text-left">Source</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {version.capexItems
                        .sort((a, b) => a.year - b.year || a.category.localeCompare(b.category))
                        .map((item) => {
                          const isAutoGenerated = item.ruleId !== null && item.ruleId !== undefined;
                          return (
                            <tr key={item.id} className="border-t hover:bg-muted/30">
                              <td className="px-4 py-2">{item.year}</td>
                              <td className="px-4 py-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {typeof item.amount === 'number'
                                  ? item.amount.toLocaleString('en-US')
                                  : String(item.amount || 0)}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                  isAutoGenerated
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }`}>
                                  {isAutoGenerated ? 'Auto' : 'Manual'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-muted-foreground">
                                {item.description || '—'}
                              </td>
                              <td className="px-4 py-2">
                                {!isAutoGenerated && (
                                  <div className="flex justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCapexId(item.id);
                                        setCapexFormData({
                                          id: item.id,
                                          year: item.year,
                                          category: item.category,
                                          amount: typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0)),
                                          description: item.description || '',
                                        });
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCapexDelete(item.id)}
                                      disabled={saving}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot className="bg-muted/50 font-semibold">
                      <tr>
                        <td colSpan={2} className="px-4 py-2">Total</td>
                        <td className="px-4 py-2 text-right font-mono">
                          {version.capexItems
                            .reduce((sum, item) => {
                              const amount = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0));
                              return sum + amount;
                            }, 0)
                            .toLocaleString('en-US')}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">No capex items yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Configure auto-reinvestment rules above to generate items automatically, or add manual items.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Rule Dialog */}
          <Dialog open={editingCapexRuleId !== null} onOpenChange={(open) => {
            if (!open) {
              setEditingCapexRuleId(null);
              setCapexRuleFormData(null);
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {capexRuleFormData?.id === 'new' || !capexRuleFormData?.id ? 'Configure Capex Rule' : 'Edit Capex Rule'}
                </DialogTitle>
                <DialogDescription>
                  Configure auto-reinvestment cycle for this category. Items will be auto-generated based on this rule.
                </DialogDescription>
              </DialogHeader>
              {capexRuleFormData && (
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="capex-rule-category">Category</Label>
                    <Select
                      value={capexRuleFormData.category}
                      onValueChange={(value) =>
                        setCapexRuleFormData({
                          ...capexRuleFormData,
                          category: value as CapexCategory,
                        })
                      }
                      disabled={capexRuleFormData.id !== 'new' && capexRuleFormData.id !== undefined}
                    >
                      <SelectTrigger id="capex-rule-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CapexCategory.BUILDING}>Building</SelectItem>
                        <SelectItem value={CapexCategory.TECHNOLOGY}>Technology</SelectItem>
                        <SelectItem value={CapexCategory.EQUIPMENT}>Equipment</SelectItem>
                        <SelectItem value={CapexCategory.FURNITURE}>Furniture</SelectItem>
                        <SelectItem value={CapexCategory.VEHICLES}>Vehicles</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Category cannot be changed after creation
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="capex-rule-cycle-years">Cycle Years</Label>
                    <Input
                      id="capex-rule-cycle-years"
                      type="number"
                      min="1"
                      max="50"
                      value={capexRuleFormData.cycleYears}
                      onChange={(e) =>
                        setCapexRuleFormData({
                          ...capexRuleFormData,
                          cycleYears: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Years between reinvestment cycles (1-50)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="capex-rule-base-cost">Base Cost (SAR)</Label>
                    <Input
                      id="capex-rule-base-cost"
                      type="number"
                      min="0"
                      step="1000"
                      value={capexRuleFormData.baseCost || 0}
                      onChange={(e) =>
                        setCapexRuleFormData({
                          ...capexRuleFormData,
                          baseCost: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Enter base cost"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Base cost will be adjusted for inflation over time
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="capex-rule-starting-year">Starting Year</Label>
                    <Input
                      id="capex-rule-starting-year"
                      type="number"
                      min="2023"
                      max="2052"
                      value={capexRuleFormData.startingYear}
                      onChange={(e) =>
                        setCapexRuleFormData({
                          ...capexRuleFormData,
                          startingYear: parseInt(e.target.value) || 2028,
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      First year of the reinvestment cycle (usually 2028 for relocation)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="capex-rule-inflation-index">Inflation Index (Optional)</Label>
                    <Input
                      id="capex-rule-inflation-index"
                      type="text"
                      value={capexRuleFormData.inflationIndex || ''}
                      onChange={(e) =>
                        setCapexRuleFormData({
                          ...capexRuleFormData,
                          inflationIndex: e.target.value || null,
                        })
                      }
                      placeholder="Leave empty to use Global CPI"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      CPI reference from admin settings. Leave empty to use global CPI.
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCapexRuleId(null);
                    setCapexRuleFormData(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCapexRuleSave}
                  disabled={saving || !capexRuleFormData}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Rule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Manual Capex Item Dialog */}
          <Dialog open={editingCapexId !== null} onOpenChange={(open) => {
            if (!open) {
              setEditingCapexId(null);
              setCapexFormData(null);
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {capexFormData?.id === 'new' ? 'Add Manual Capex Item' : 'Edit Manual Capex Item'}
                </DialogTitle>
                <DialogDescription>
                  Add a manual capital expenditure item for a specific year. This is independent of auto-reinvestment rules.
                </DialogDescription>
              </DialogHeader>
              {capexFormData && (
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="capex-year">Year</Label>
                    <Input
                      id="capex-year"
                      type="number"
                      min="2023"
                      max="2052"
                      value={capexFormData.year}
                      onChange={(e) =>
                        setCapexFormData({
                          ...capexFormData,
                          year: parseInt(e.target.value) || 2023,
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Year must be between 2023 and 2052
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="capex-category">Category</Label>
                    <Select
                      value={capexFormData.category}
                      onValueChange={(value) =>
                        setCapexFormData({
                          ...capexFormData,
                          category: value as CapexCategory,
                        })
                      }
                    >
                      <SelectTrigger id="capex-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CapexCategory.BUILDING}>Building</SelectItem>
                        <SelectItem value={CapexCategory.TECHNOLOGY}>Technology</SelectItem>
                        <SelectItem value={CapexCategory.EQUIPMENT}>Equipment</SelectItem>
                        <SelectItem value={CapexCategory.FURNITURE}>Furniture</SelectItem>
                        <SelectItem value={CapexCategory.VEHICLES}>Vehicles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="capex-amount">Amount (SAR)</Label>
                    <Input
                      id="capex-amount"
                      type="number"
                      min="0"
                      step="1000"
                      value={capexFormData.amount || 0}
                      onChange={(e) =>
                        setCapexFormData({
                          ...capexFormData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <Label htmlFor="capex-description">Description (Optional)</Label>
                    <Input
                      id="capex-description"
                      type="text"
                      value={capexFormData.description}
                      onChange={(e) =>
                        setCapexFormData({
                          ...capexFormData,
                          description: e.target.value,
                        })
                      }
                      placeholder="e.g., Building renovation, IT infrastructure upgrade"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCapexId(null);
                    setCapexFormData(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCapexSave}
                  disabled={saving || !capexFormData}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : capexFormData?.id === 'new' ? 'Create' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="opex" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Opex Planning</CardTitle>
                  <CardDescription>Operational expenditure as % of revenue or fixed amounts</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingOpexId('new');
                    setOpexFormData({
                      id: 'new',
                      subAccountName: '',
                      percentOfRevenue: 0,
                      isFixed: false,
                      fixedAmount: 0,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sub-Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(version.opexSubAccounts && version.opexSubAccounts.length > 0) || editingOpexId === 'new' ? (
                <div className="space-y-3">
                  {version.opexSubAccounts && version.opexSubAccounts.map((account) => (
                    <div key={account.id}>
                      {editingOpexId === account.id && opexFormData ? (
                        // Edit mode
                        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`opex-name-${account.id}`}>Sub-Account Name</Label>
                              <Input
                                id={`opex-name-${account.id}`}
                                type="text"
                                value={opexFormData.subAccountName}
                                onChange={(e) =>
                                  setOpexFormData({ ...opexFormData, subAccountName: e.target.value })
                                }
                                placeholder="e.g., Marketing, Admin, Utilities"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`opex-fixed-${account.id}`}
                                checked={opexFormData.isFixed}
                                onCheckedChange={(checked) =>
                                  setOpexFormData({ ...opexFormData, isFixed: !!checked })
                                }
                              />
                              <Label htmlFor={`opex-fixed-${account.id}`}>
                                Use fixed amount (instead of % of revenue)
                              </Label>
                            </div>

                            {opexFormData.isFixed ? (
                              <div>
                                <Label htmlFor={`opex-amount-${account.id}`}>Fixed Amount (SAR)</Label>
                                <Input
                                  id={`opex-amount-${account.id}`}
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={opexFormData.fixedAmount || 0}
                                  onChange={(e) =>
                                    setOpexFormData({
                                      ...opexFormData,
                                      fixedAmount: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="Enter fixed amount"
                                />
                              </div>
                            ) : (
                              <div>
                                <Label htmlFor={`opex-percent-${account.id}`}>
                                  Percentage of Revenue (%)
                                </Label>
                                <Input
                                  id={`opex-percent-${account.id}`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={opexFormData.percentOfRevenue || 0}
                                  onChange={(e) =>
                                    setOpexFormData({
                                      ...opexFormData,
                                      percentOfRevenue: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="Enter percentage"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                  This percentage will be applied to the annual revenue.
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpexSave(account.id)}
                              disabled={saving}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {saving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingOpexId(null);
                                setOpexFormData(null);
                              }}
                              disabled={saving}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex justify-between items-center border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="font-medium">{account.subAccountName}</div>
                            <div className="text-sm text-muted-foreground">
                              {account.isFixed ? (
                                <span>
                                  Fixed: {typeof account.fixedAmount === 'number'
                                    ? account.fixedAmount.toLocaleString('en-US')
                                    : String(account.fixedAmount || 0)}{' '}
                                  SAR/year
                                </span>
                              ) : (
                                <span>
                                  {typeof account.percentOfRevenue === 'number'
                                    ? account.percentOfRevenue.toFixed(2)
                                    : String(account.percentOfRevenue || 0)}
                                  % of revenue
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingOpexId(account.id);
                                setOpexFormData({
                                  id: account.id,
                                  subAccountName: account.subAccountName,
                                  percentOfRevenue:
                                    typeof account.percentOfRevenue === 'number'
                                      ? account.percentOfRevenue
                                      : parseFloat(String(account.percentOfRevenue || 0)),
                                  isFixed: account.isFixed,
                                  fixedAmount:
                                    typeof account.fixedAmount === 'number'
                                      ? account.fixedAmount
                                      : parseFloat(String(account.fixedAmount || 0)),
                                });
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpexDelete(account.id)}
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* New account form */}
                  {editingOpexId === 'new' && opexFormData && (
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="opex-name-new">Sub-Account Name</Label>
                          <Input
                            id="opex-name-new"
                            type="text"
                            value={opexFormData.subAccountName}
                            onChange={(e) =>
                              setOpexFormData({ ...opexFormData, subAccountName: e.target.value })
                            }
                            placeholder="e.g., Marketing, Admin, Utilities"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="opex-fixed-new"
                            checked={opexFormData.isFixed}
                            onCheckedChange={(checked) =>
                              setOpexFormData({ ...opexFormData, isFixed: !!checked })
                            }
                          />
                          <Label htmlFor="opex-fixed-new">
                            Use fixed amount (instead of % of revenue)
                          </Label>
                        </div>

                        {opexFormData.isFixed ? (
                          <div>
                            <Label htmlFor="opex-amount-new">Fixed Amount (SAR)</Label>
                            <Input
                              id="opex-amount-new"
                              type="number"
                              min="0"
                              step="1000"
                              value={opexFormData.fixedAmount || 0}
                              onChange={(e) =>
                                setOpexFormData({
                                  ...opexFormData,
                                  fixedAmount: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="Enter fixed amount"
                            />
                          </div>
                        ) : (
                          <div>
                            <Label htmlFor="opex-percent-new">Percentage of Revenue (%)</Label>
                            <Input
                              id="opex-percent-new"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={opexFormData.percentOfRevenue || 0}
                              onChange={(e) =>
                                setOpexFormData({
                                  ...opexFormData,
                                  percentOfRevenue: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="Enter percentage"
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              This percentage will be applied to the annual revenue.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpexSave('new')}
                          disabled={saving || !opexFormData.subAccountName.trim()}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Creating...' : 'Create'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingOpexId(null);
                            setOpexFormData(null);
                          }}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">No opex sub-accounts configured yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Add sub-accounts to track operational expenses as either a percentage of revenue or fixed amounts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tuition-sim" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tuition Simulation</CardTitle>
              <CardDescription>Adjust base tuition and see financial impact</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Tuition simulation tools will be available here. This allows you to adjust base tuition per curriculum 
                and see the real-time impact on revenue, EBITDA, and rent load %.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push(`/tuition-simulator?versionId=${versionId}`)}
              >
                Open Tuition Simulator
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Statements</CardTitle>
              <CardDescription>View PnL, Balance Sheet, and Cash Flow statements</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Financial statements feature is under development. This will display Profit & Loss, 
                Balance Sheet, and Cash Flow statements for this version.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generate and export reports for this version</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Report generation will be available here. You can generate Executive Summary, Detailed Financial, 
                or Board Presentation reports in PDF, Excel, or CSV format.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push(`/reports?versionId=${versionId}`)}
              >
                Go to Reports
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


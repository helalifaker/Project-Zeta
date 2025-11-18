/**
 * Version Form Component
 * Form for creating/editing versions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { CreateVersionInput } from '@/lib/validation/version';
import { VersionMode, CurriculumType, RentModel } from '@prisma/client';
import { ArrowLeft } from 'lucide-react';

interface VersionFormProps {
  initialData?: Partial<CreateVersionInput>;
  onSubmit?: (data: CreateVersionInput) => Promise<void>;
}

export function VersionForm({ initialData, onSubmit }: VersionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [mode, setMode] = useState<VersionMode>(initialData?.mode || VersionMode.RELOCATION_2028);
  const [enableIB, setEnableIB] = useState(true); // Default: enabled for new versions
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    // Basic validation
    if (!name || name.length < 3) {
      setErrors({ name: 'Name must be at least 3 characters' });
      return;
    }

    if (name.length > 100) {
      setErrors({ name: 'Name must be less than 100 characters' });
      return;
    }

    if (description && description.length > 500) {
      setErrors({ description: 'Description must be less than 500 characters' });
      return;
    }

    // Generate zero projection helper
    const generateZeroProjection = () => 
      Array.from({ length: 30 }, (_, i) => ({
        year: 2023 + i,
        students: 0,
      }));

    // Create default curriculum plans (FR always required, IB optional)
    // These will be configured in detail after creation
    const defaultCurriculumPlans = [
      {
        curriculumType: CurriculumType.FR,
        capacity: 400, // Default capacity
        tuitionBase: 50000, // Default base tuition (SAR)
        cpiFrequency: 2, // CPI every 2 years
        studentsProjection: generateZeroProjection(),
      },
      {
        curriculumType: CurriculumType.IB,
        capacity: enableIB ? 200 : 0, // Zero if disabled
        tuitionBase: 60000, // Default base tuition (SAR)
        cpiFrequency: 2, // CPI every 2 years
        studentsProjection: generateZeroProjection(), // Always zero initially
      },
    ];

    // Create default rent plan with valid parameters
    const formData: CreateVersionInput = {
      name,
      description: description || undefined,
      mode,
      curriculumPlans: defaultCurriculumPlans,
      rentPlan: {
        rentModel: RentModel.FIXED_ESCALATION,
        parameters: {
          baseRent: 1000000, // Default 1M SAR (must be positive)
          escalationRate: 0.03, // Default 3% escalation
          startYear: 2028, // Start year for rent model
        },
      },
    };

    try {
      setLoading(true);

      if (onSubmit) {
        await onSubmit(formData);
        return;
      }

      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/versions/${result.data.id}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to create version');
        if (result.details) {
          setErrors(result.details.fieldErrors || {});
        }
      }
    } catch (err) {
      console.error('Failed to create version:', err);
      setError('Failed to create version');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/versions')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Version Details</CardTitle>
          <CardDescription>Basic information about this version</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name *
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., V1 - Base Case"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="mode" className="text-sm font-medium">
              Mode *
            </label>
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as VersionMode)}
            >
              <SelectTrigger id="mode" className={errors.mode ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VersionMode.RELOCATION_2028}>
                  Relocation 2028
                </SelectItem>
                <SelectItem value={VersionMode.HISTORICAL_BASELINE}>
                  Historical Baseline
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.mode && (
              <p className="text-sm text-destructive">{errors.mode}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Curriculum Plans</CardTitle>
          <CardDescription>
            FR curriculum is required. IB curriculum is optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* IB Enable/Disable Checkbox */}
          <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
            <Checkbox
              id="enable-ib"
              checked={enableIB}
              onCheckedChange={(checked) => {
                setEnableIB(checked as boolean);
              }}
            />
            <Label htmlFor="enable-ib" className="text-sm font-medium cursor-pointer">
              Enable IB Program
            </Label>
            <p className="text-xs text-muted-foreground ml-2">
              {enableIB 
                ? 'IB program is enabled. Configure IB curriculum in the version detail page after creation.' 
                : 'IB program is disabled. Revenue will be calculated from FR only.'}
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Curriculum plans configuration will be available in the version detail page
            after creation. FR curriculum is always required.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rent Plan</CardTitle>
          <CardDescription>
            Rent plan configuration will be available in the version detail page
            after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Rent plan configuration will be available in the version detail page
            after creation.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/versions')}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Version'}
        </Button>
      </div>
    </form>
  );
}


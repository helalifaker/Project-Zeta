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
import type { CreateVersionInput } from '@/lib/validation/version';
import { VersionMode } from '@prisma/client';
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

    const formData: CreateVersionInput = {
      name,
      description: description || undefined,
      mode,
      curriculumPlans: [], // Will be configured later
      rentPlan: {
        rentModel: 'FIXED_ESCALATION',
        parameters: {
          baseRent: 0,
          escalationRate: 0,
          startYear: 2028,
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
            FR and IB curriculum plans will be configured separately
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Curriculum plans configuration will be available in the version detail page
            after creation.
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


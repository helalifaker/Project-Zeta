/**
 * Curriculum Plans Header Component
 * Displays page title and description for curriculum plans
 */

'use client';

import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * CurriculumPlansHeader component displays the page title and description
 * 
 * @returns JSX.Element - Header with title and description
 */
export function CurriculumPlansHeader(): JSX.Element {
  return (
    <CardHeader>
      <CardTitle className="text-2xl font-bold tracking-tight">
        Curriculum Plans
      </CardTitle>
      <CardDescription>
        FR curriculum is required. IB curriculum is optional.
      </CardDescription>
    </CardHeader>
  );
}


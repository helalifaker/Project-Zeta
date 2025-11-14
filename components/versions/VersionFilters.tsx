/**
 * Version Filters Component
 * Filter controls for version list (status, mode, search)
 */

'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useVersionStore, type VersionFilters } from '@/stores/version-store';

export function VersionFilters() {
  const { filters, setFilters, resetFilters } = useVersionStore();

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search versions..."
          value={filters.search || ''}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="pl-8"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => setFilters({ status: value })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="READY">Ready</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="LOCKED">Locked</SelectItem>
        </SelectContent>
      </Select>

      {/* Mode Filter */}
      <Select
        value={filters.mode || 'all'}
        onValueChange={(value) => setFilters({ mode: value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Modes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Modes</SelectItem>
          <SelectItem value="RELOCATION_2028">Relocation 2028</SelectItem>
          <SelectItem value="HISTORICAL_BASELINE">Historical Baseline</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {(filters.status !== 'all' || filters.mode !== 'all' || filters.search) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
        >
          Clear
        </Button>
      )}
    </div>
  );
}


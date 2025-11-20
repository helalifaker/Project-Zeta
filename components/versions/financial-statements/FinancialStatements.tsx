/**
 * Financial Statements Container Component
 * 
 * Displays P&L, Balance Sheet, and Cash Flow Statement in tabbed interface.
 * Uses production circular solver to generate 30-year projections.
 * 
 * Features:
 * - Tab navigation (P&L, Balance Sheet, Cash Flow)
 * - Real-time calculations via circular solver
 * - Performance monitoring (<100ms target)
 * - Convergence status display
 * - Export capabilities (Excel, PDF)
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (Phase 3)
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Download, 
  TrendingUp, 
  DollarSign, 
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { CircularSolver, type SolverParams, type SolverResult } from '@/lib/calculations/financial/circular-solver';
import type { YearlyProjection } from '@/lib/calculations/financial/projection';
import Decimal from 'decimal.js';

// Import statement components (we'll create these next)
import { PnLStatement } from './PnLStatement';
import { BalanceSheetStatement } from './BalanceSheetStatement';
import { CashFlowStatement } from './CashFlowStatement';
import { ConvergenceMonitor } from './ConvergenceMonitor';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Props for FinancialStatements component
 */
export interface FinancialStatementsProps {
  versionId: string;
  versionMode: 'RELOCATION_2028' | 'HISTORICAL_BASELINE';
  projection: YearlyProjection[]; // NEW: Full projection data
  metadata: {
    converged: boolean;
    iterations: number;
    maxError: number;
    duration: number;
    solverUsed: boolean;
  };
}

/**
 * Financial Statements Container Component
 */
export function FinancialStatements(props: FinancialStatementsProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<'pnl' | 'balance-sheet' | 'cash-flow'>('pnl');

  // ✅ CHALLENGE 1 FIX: Use projection data passed from parent (no duplicate calculation)
  const [projection] = useState(props.projection);
  const [metadata] = useState(props.metadata);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Keep only historical data fetch
  useEffect(() => {
    async function fetchHistoricalData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/historical-data?versionId=${props.versionId}`);
        const data = await response.json();
        if (data.success && data.data) {
          setHistoricalData(data.data);
        }
      } catch (err) {
        console.error('[FinancialStatements] Failed to fetch historical data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistoricalData();
  }, [props.versionId]);

  // Handle export
  const handleExport = (format: 'excel' | 'pdf') => {
    // TODO: Implement export logic
    console.log(`Exporting ${activeTab} as ${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">
            Financial Statements
          </h2>
          <p className="text-text-secondary">
            30-year projection (2023-2052) with automatic balance sheet balancing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            disabled={calculating || !projection}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={calculating || !projection}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Loading State - only for historical data fetch */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
              <p className="text-text-secondary">Loading historical data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Convergence Monitor */}
      <ConvergenceMonitor
        converged={metadata.converged}
        iterations={metadata.iterations}
        maxError={metadata.maxError}
        duration={metadata.duration}
      />

      {/* Tabbed Statements */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pnl" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            P&L Statement
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Cash Flow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="mt-6">
          <PnLStatement projection={projection} historicalData={historicalData} />
        </TabsContent>

        <TabsContent value="balance-sheet" className="mt-6">
          <BalanceSheetStatement projection={projection} historicalData={historicalData} />
        </TabsContent>

        <TabsContent value="cash-flow" className="mt-6">
          <CashFlowStatement projection={projection} historicalData={historicalData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


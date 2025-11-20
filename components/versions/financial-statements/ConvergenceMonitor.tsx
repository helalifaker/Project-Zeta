/**
 * Convergence Monitor Component
 * 
 * Displays convergence status of circular calculation solver.
 * Shows iterations, error, and performance metrics.
 * 
 * Purpose:
 * - Transparency: Show users when calculations are approximate
 * - Performance: Display calculation time
 * - Debug: Help developers diagnose convergence issues
 * 
 * Reference: FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md (lines 1782-1788)
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';

export interface ConvergenceMonitorProps {
  converged: boolean;
  iterations: number;
  maxError: number;
  duration: number; // milliseconds
}

/**
 * Convergence Monitor Component
 * 
 * @example
 * <ConvergenceMonitor
 *   converged={true}
 *   iterations={3}
 *   maxError={0.00005}
 *   duration={45}
 * />
 */
export function ConvergenceMonitor(props: ConvergenceMonitorProps): JSX.Element {
  const { converged, iterations, maxError, duration } = props;

  // Determine status
  const status = converged ? 'success' : 'warning';
  const statusIcon = converged ? (
    <CheckCircle2 className="h-4 w-4" />
  ) : (
    <AlertTriangle className="h-4 w-4" />
  );
  const statusColor = converged ? 'text-accent-green' : 'text-accent-yellow';
  const statusBg = converged ? 'bg-accent-green/10' : 'bg-accent-yellow/10';

  // Performance assessment
  const performanceLevel = 
    duration < 50 ? 'excellent' :
    duration < 100 ? 'good' :
    duration < 200 ? 'acceptable' : 'slow';

  const performanceColor =
    performanceLevel === 'excellent' ? 'text-accent-green' :
    performanceLevel === 'good' ? 'text-accent-blue' :
    performanceLevel === 'acceptable' ? 'text-accent-yellow' : 'text-accent-red';

  return (
    <Card className={`border-2 ${converged ? 'border-accent-green/20' : 'border-accent-yellow/20'} ${statusBg}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          {/* Left: Status */}
          <div className="flex items-center gap-3">
            <div className={`${statusColor}`}>
              {statusIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">
                  {converged ? 'Calculations Complete' : 'Approximate Calculations'}
                </span>
                <Badge variant={converged ? 'default' : 'secondary'} className="text-xs">
                  {converged ? 'Converged' : 'Max Iterations Reached'}
                </Badge>
              </div>
              <p className="text-xs text-text-tertiary mt-1">
                {converged 
                  ? 'All circular dependencies resolved with high precision'
                  : 'Results are approximate. Interest calculations may not be fully accurate.'
                }
              </p>
            </div>
          </div>

          {/* Right: Metrics */}
          <div className="flex items-center gap-6">
            {/* Iterations */}
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-text-tertiary" />
              <div>
                <p className="text-xs text-text-tertiary">Iterations</p>
                <p className="text-sm font-semibold text-text-primary">
                  {iterations}
                </p>
              </div>
            </div>

            {/* Max Error */}
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-text-tertiary" />
              <div>
                <p className="text-xs text-text-tertiary">Max Error</p>
                <p className="text-sm font-semibold text-text-primary">
                  {(maxError * 100).toFixed(4)}%
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${performanceColor}`} />
              <div>
                <p className="text-xs text-text-tertiary">Duration</p>
                <p className={`text-sm font-semibold ${performanceColor}`}>
                  {duration.toFixed(1)}ms
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


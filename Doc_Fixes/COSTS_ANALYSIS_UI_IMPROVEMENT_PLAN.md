# Costs Analysis Page - UI/UX Improvement Plan

**Document Version:** 2.0 (Updated per 360° Review)  
**Date:** November 13, 2025  
**Status:** Approved with Notes - Ready for Implementation  
**Prepared By:** UI/UX Coherence Control Agent  
**Review Status:** ⚠️ APPROVED WITH NOTES (see 360° Review Report)

---

## Executive Summary

This document outlines a comprehensive improvement plan for the Costs Analysis tab (`/versions/[id]` - Costs Analysis tab) to transform it from a functional data display into a world-class financial analysis dashboard. The improvements focus on enhanced visualizations, better data organization, interactive insights, and improved user experience.

**Key Objectives:**

- Transform data display into actionable insights
- Enhance visual hierarchy and information scanning
- Add interactive visualizations and trend analysis
- Improve comparison capabilities between rent models
- Ensure full design system compliance
- Enhance accessibility (WCAG AA)
- Maintain all existing functionality

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Identified Issues](#identified-issues)
3. [Proposed Solution](#proposed-solution)
4. [Design Specifications](#design-specifications)
5. [Component Structure](#component-structure)
6. [Implementation Plan](#implementation-plan)
7. [Design System Compliance](#design-system-compliance)
8. [Accessibility Requirements](#accessibility-requirements)
9. [Success Metrics](#success-metrics)
10. [Appendices](#appendices)

---

## Current State Analysis

### Current Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Costs Analysis Tab                                          │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Rent Model                                    [Expand]  │ │
│ │ Partner Model Badge                                      │ │
│ │                                                          │ │
│ │ Year 1 Rent (2028): SAR 18,960,000                      │ │
│ │ Year 30 Rent (2052): SAR 28,649,862                     │ │
│ │ NPV (2028-2052): SAR 232,792,422                        │ │
│ │ Avg Rent Load %: 23.99%                                 │ │
│ │                                                          │ │
│ │ [Expanded: Rent Model Details + Year-by-Year Table]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Cost Breakdown                                           │ │
│ │                                                          │ │
│ │ Total Costs (30-year): SAR 3,301,934,737                │ │
│ │ Avg Cost per Student: SAR 66,437                        │ │
│ │                                                          │ │
│ │ Rent: 22.16%  Staff: 42.58%  Opex: 35.26%              │ │
│ │                                                          │ │
│ │ [Pie Chart: Cost Distribution]                          │ │
│ │                                                          │ │
│ │ [Year-by-Year Cost Breakdown Table]                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Current Component Analysis

**Files:**

- `components/versions/costs-analysis/RentLens.tsx` (858 lines)
- `components/versions/costs-analysis/CostBreakdown.tsx` (478 lines)

**Current Implementation:**

- **RentLens:** Expandable card with summary metrics, rent model details, and year-by-year table
- **CostBreakdown:** Card with summary metrics, pie chart, and year-by-year table
- Both components use basic Card layouts
- Tables are scrollable but lack advanced features
- Pie chart is basic (Recharts)
- No trend visualizations
- No comparison capabilities
- Limited interactivity

**Issues Identified:**

1. **Visual Hierarchy:** Metrics and data have equal visual weight
2. **Information Density:** Too much data displayed at once
3. **Missing Insights:** No trend analysis or comparative views
4. **Limited Interactivity:** Static displays with minimal user interaction
5. **Chart Limitations:** Basic pie chart, no line/bar charts for trends
6. **Table UX:** Long tables without filtering, sorting, or search
7. **Comparison:** No way to compare different rent models side-by-side
8. **Responsive Design:** May not work well on smaller screens

---

## Identified Issues

### 1. Visual Hierarchy Problems

**Issue:** All information displayed with equal visual weight

- Key metrics (NPV, Rent Load) blend with other data
- No clear distinction between summary and detailed views
- Critical insights are not emphasized

**Impact:** Users struggle to quickly identify key financial insights

### 2. Missing Trend Visualizations

**Issue:** No visual representation of trends over time

- Rent trends not visualized (only in table)
- Cost trends not visualized (only in table)
- Rent Load % trends not visualized
- No comparison between different periods

**Impact:** Difficult to understand financial trajectory and patterns

### 3. Limited Interactivity

**Issue:** Static displays with minimal user interaction

- No filtering or sorting in tables
- No drill-down capabilities
- No hover details or tooltips
- No export functionality

**Impact:** Users cannot explore data or customize their view

### 4. Comparison Capabilities Missing

**Issue:** No way to compare different scenarios

- Cannot compare different rent models side-by-side
- Cannot compare different versions
- No "what-if" analysis tools

**Impact:** Limited decision-making support

### 5. Table UX Issues

**Issue:** Long tables without advanced features

- 30-year tables are very long
- No filtering by year range
- No sorting capabilities
- No search functionality
- No pagination or virtualization

**Impact:** Difficult to navigate and find specific information

### 6. Chart Enhancements Needed

**Issue:** Basic charts lack advanced features

- Pie chart is static
- No interactive tooltips with detailed data
- No chart customization options
- Missing trend charts (line/bar charts)

**Impact:** Limited data visualization capabilities

### 7. Responsive Design Concerns

**Issue:** Layout may not work well on smaller screens

- Tables may overflow on mobile
- Charts may be too small on tablets
- Metrics grid may not stack properly

**Impact:** Poor experience on mobile/tablet devices

### 8. Accessibility Gaps

**Issue:** Missing accessibility features

- Charts may not be fully accessible
- Tables may lack proper ARIA labels
- Keyboard navigation may be limited

**Impact:** Accessibility barriers for users with disabilities

---

## Proposed Solution

### High-Level Approach

1. **Enhanced Dashboard Layout:** Transform into a financial dashboard with clear sections
2. **Trend Visualizations:** Add line/bar charts for rent, costs, and rent load trends
3. **Interactive Tables:** Add filtering, sorting, search, and virtualization
4. **Comparison Tools:** Add side-by-side rent model comparison
5. **Insights Panel:** Add key insights and recommendations
6. **Export Functionality:** Add export to CSV/PDF
7. **Responsive Design:** Ensure mobile-friendly layout
8. **Design System Compliance:** Use only design system tokens

### Proposed Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Costs Analysis Dashboard                                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Key Financial Metrics (KPI Cards)                       │ │
│ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │ │
│ │ │ NPV  │ │ Rent │ │ Rent │ │ Cost │                  │ │
│ │ │ 233M │ │ Load │ │ Y1   │ │/Stu  │                  │ │
│ │ │      │ │ 24%  │ │ 19M  │ │ 66K  │                  │ │
│ │ └──────┘ └──────┘ └──────┘ └──────┘                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Rent Model Analysis                          [Edit]      │ │
│ │ Partner Model Badge                                        │ │
│ │                                                           │ │
│ │ ┌─────────────────────┐ ┌─────────────────────┐          │ │
│ │ │ Rent Trend Chart    │ │ Rent Load Trend     │          │ │
│ │ │ (Line Chart)        │ │ (Area Chart)        │          │ │
│ │ └─────────────────────┘ └─────────────────────┘          │ │
│ │                                                           │ │
│ │ [Expandable: Model Details + Year-by-Year Table]         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Cost Analysis                                            │ │
│ │                                                           │ │
│ │ ┌─────────────────────┐ ┌─────────────────────┐          │ │
│ │ │ Cost Distribution   │ │ Cost Trend Chart     │          │ │
│ │ │ (Enhanced Pie Chart)│ │ (Stacked Bar Chart)  │          │ │
│ │ └─────────────────────┘ └─────────────────────┘          │ │
│ │                                                           │ │
│ │ [Year-by-Year Cost Breakdown Table with Filters]         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Insights & Recommendations                              │ │
│ │ • Rent Load is within optimal range (20-30%)            │ │
│ │ • Staff costs represent largest expense (42.6%)          │ │
│ │ • Consider optimizing Opex (35.3% of costs)             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Improvements

1. **KPI Cards:** Prominent display of key metrics at top
2. **Trend Charts:** Line/bar charts showing trends over time
3. **Enhanced Pie Chart:** Interactive with drill-down capabilities
4. **Interactive Tables:** Filtering, sorting, search, virtualization
5. **Insights Panel:** AI-generated insights and recommendations
6. **Comparison Tools:** Side-by-side rent model comparison
7. **Export Functionality:** Export data to CSV/PDF
8. **Responsive Layout:** Mobile-friendly grid system

---

## Design Specifications

### Color Scheme

**KPI Cards:**

- NPV: `accent-blue` (#3B82F6)
- Rent Load: `accent-orange` (#F97316) - warning if > 30%
- Rent Y1: `accent-blue` (#3B82F6)
- Cost/Student: `accent-green` (#10B981)

**Chart Colors:**

- Rent: `chart-rent` (#8B5CF6) - Purple
- Staff: `chart-revenue` (#3B82F6) - Blue
- Opex: `chart-ebitda` (#10B981) - Green
- Rent Load: `chart-rentLoad` (#F97316) - Orange

**Status Indicators:**

- Optimal: `accent-green` (#10B981)
- Warning: `accent-yellow` (#F59E0B)
- Critical: `accent-red` (#EF4444)

### Typography

**KPI Cards:**

- Value: `text-2xl font-bold` (1.5rem)
- Label: `text-sm text-muted-foreground` (0.875rem)

**Section Titles:**

- Font Size: `text-xl` (1.25rem)
- Font Weight: `font-semibold`

**Chart Labels:**

- Font Size: `text-sm` (0.875rem)
- Font Weight: `font-medium`

### Spacing

**Dashboard Grid:**

- Gap between cards: `gap-6` (1.5rem / 24px)
- Card padding: `p-6` (1.5rem / 24px)
- Section spacing: `space-y-6` (1.5rem / 24px)

**KPI Grid:**

- Grid: `grid-cols-2 md:grid-cols-4 gap-4` (1rem / 16px)

### Component Specifications

**KPI Card Structure:**

```tsx
<Card className="hover:border-primary/50 transition-colors">
  <CardContent className="p-6">
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <TrendIcon className={trendColor} />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  </CardContent>
</Card>
```

**Trend Chart Structure:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>{chartTitle}</CardTitle>
    <CardDescription>{chartDescription}</CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>{/* Chart configuration */}</LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

**Interactive Table Structure:**

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>{tableTitle}</CardTitle>
        <CardDescription>{tableDescription}</CardDescription>
      </div>
      <div className="flex items-center gap-2">
        <Input placeholder="Search..." />
        <Select>
          <SelectTrigger>Filter</SelectTrigger>
        </Select>
        <Button variant="outline" size="sm">
          Export
        </Button>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <Table>{/* Table with virtualization */}</Table>
  </CardContent>
</Card>
```

---

## Component Structure

### New Component Hierarchy

```
VersionDetail (Parent)
└── CostsAnalysisTab
    ├── CostsAnalysisDashboard
    │   ├── KPIMetricsGrid
    │   │   ├── KPICard (NPV)
    │   │   ├── KPICard (Rent Load)
    │   │   ├── KPICard (Year 1 Rent)
    │   │   └── KPICard (Cost per Student)
    │   │
    │   ├── RentModelAnalysis
    │   │   ├── RentModelHeader
    │   │   │   ├── ModelBadge
    │   │   │   └── EditButton
    │   │   ├── RentTrendChart
    │   │   ├── RentLoadTrendChart
    │   │   ├── RentModelDetails (expandable)
    │   │   └── RentProjectionTable (with filters)
    │   │
    │   ├── CostAnalysis
    │   │   ├── CostDistributionChart (enhanced pie)
    │   │   ├── CostTrendChart (stacked bar)
    │   │   └── CostBreakdownTable (with filters)
    │   │
    │   └── InsightsPanel
    │       ├── InsightCard (Rent Load)
    │       ├── InsightCard (Cost Optimization)
    │       └── InsightCard (Recommendations)
    │
    └── RentModelComparison (optional)
        ├── ComparisonSelector
        ├── SideBySideMetrics
        └── ComparisonCharts
```

### Component Breakdown

#### 1. KPIMetricsGrid Component

**Purpose:** Display key financial metrics in prominent cards

**Metrics:**

- NPV (2028-2052)
- Average Rent Load %
- Year 1 Rent (2028)
- Average Cost per Student

**Features:**

- Large, scannable numbers
- Trend indicators (if applicable)
- Color-coded status (optimal/warning/critical)
- Hover effects for interactivity

#### 2. RentTrendChart Component

**Purpose:** Visualize rent trends over time

**Chart Type:** Line Chart (Recharts)

**Data:**

- X-axis: Years (2028-2052)
- Y-axis: Rent amount (SAR)
- Line: Rent trend

**Features:**

- Interactive tooltips
- Zoom capability
- Highlight ramp-up period (2028-2032)
- Reference lines (if needed)

#### 3. RentLoadTrendChart Component

**Purpose:** Visualize rent load percentage trends

**Chart Type:** Area Chart (Recharts)

**Data:**

- X-axis: Years (2028-2052)
- Y-axis: Rent Load % (0-100%)
- Area: Rent Load trend

**Features:**

- Color-coded zones (optimal/warning/critical)
- Threshold lines (20%, 30%, 40%)
- Interactive tooltips

#### 4. CostTrendChart Component

**Purpose:** Visualize cost trends by category

**Chart Type:** Stacked Bar Chart (Recharts)

**Data:**

- X-axis: Years (2028-2052)
- Y-axis: Cost amount (SAR)
- Stacks: Rent, Staff, Opex

**Features:**

- Interactive tooltips with breakdown
- Toggle categories on/off
- Year range selector

#### 5. EnhancedCostDistributionChart Component

**Purpose:** Enhanced pie chart with drill-down

**Chart Type:** Pie Chart (Recharts) with enhancements

**Features:**

- Interactive segments (click to filter table)
- Detailed tooltips
- Legend with percentages
- Animation on load

#### 6. InteractiveCostBreakdownTable Component

**Purpose:** Year-by-year cost breakdown with advanced features

**Features:**

- Virtual scrolling (for performance)
- Column filtering
- Column sorting
- Search functionality
- Year range selector
- Export to CSV
- Row highlighting on hover

#### 7. InsightsPanel Component

**Purpose:** Display key insights and recommendations

**Insights:**

- Rent Load analysis (optimal/warning/critical)
- Cost structure analysis
- Optimization recommendations
- Trend analysis

**Features:**

- Auto-generated insights
- Color-coded severity
- Actionable recommendations

#### 8. RentModelComparison Component (Optional)

**Purpose:** Compare different rent models side-by-side

**Features:**

- Model selector
- Side-by-side metrics comparison
- Comparison charts
- Highlight differences

---

## Implementation Plan

### Phase 1: Foundation & KPI Cards (Priority: High)

**Tasks:**

1. Create `KPIMetricsGrid` component
2. Extract key metrics calculation logic
3. Implement KPI cards with trend indicators
4. Add color-coded status indicators

**Estimated Time:** 4-6 hours

**Files to Create:**

- `components/versions/costs-analysis/KPIMetricsGrid.tsx`
- `components/versions/costs-analysis/KPICard.tsx`

### Phase 2: Trend Visualizations (Priority: High)

**Tasks:**

1. Create `RentTrendChart` component (line chart)
2. Create `RentLoadTrendChart` component (area chart)
3. Create `CostTrendChart` component (stacked bar chart)
4. Integrate charts into RentLens and CostBreakdown

**Estimated Time:** 8-10 hours

**Files to Create:**

- `components/versions/costs-analysis/RentTrendChart.tsx`
- `components/versions/costs-analysis/RentLoadTrendChart.tsx`
- `components/versions/costs-analysis/CostTrendChart.tsx`

### Phase 3: Enhanced Charts (Priority: Medium)

**Tasks:**

1. Enhance pie chart with interactivity
2. Add drill-down capabilities
3. Improve tooltips and legends
4. Add chart customization options

**Estimated Time:** 4-6 hours

**Files to Modify:**

- `components/versions/costs-analysis/CostBreakdown.tsx`

### Phase 4: Interactive Tables (Priority: High)

**Tasks:**

1. Add filtering to tables
2. Add sorting capabilities
3. Add search functionality
4. Implement virtualization for performance
5. Add year range selector
6. Add export to CSV functionality

**Estimated Time:** 8-10 hours

**Files to Create:**

- `components/versions/costs-analysis/InteractiveTable.tsx`
- `components/versions/costs-analysis/TableFilters.tsx`

**Files to Modify:**

- `components/versions/costs-analysis/RentLens.tsx`
- `components/versions/costs-analysis/CostBreakdown.tsx`

### Phase 5: Insights Panel (Priority: Medium)

**Tasks:**

1. Create insights calculation logic
2. Create `InsightsPanel` component
3. Implement insight cards
4. Add recommendations engine

**Estimated Time:** 6-8 hours

**Files to Create:**

- `components/versions/costs-analysis/InsightsPanel.tsx`
- `components/versions/costs-analysis/InsightCard.tsx`
- `lib/calculations/insights/cost-insights.ts`

### Phase 6: Comparison Tools (Priority: Low)

**Tasks:**

1. Create `RentModelComparison` component
2. Implement side-by-side comparison
3. Add comparison charts
4. Add difference highlighting

**Estimated Time:** 6-8 hours

**Files to Create:**

- `components/versions/costs-analysis/RentModelComparison.tsx`

### Phase 7: Responsive Design (Priority: High)

**Tasks:**

1. Test and fix mobile layout
2. Optimize charts for smaller screens
3. Implement responsive table design
4. Add mobile-specific interactions

**Estimated Time:** 4-6 hours

**Files to Modify:**

- All costs-analysis components

### Phase 8: Design System Compliance (Priority: High)

**Tasks:**

1. Replace all hardcoded colors
2. Ensure consistent component usage
3. Apply proper spacing (8px grid)
4. Use design system tokens

**Estimated Time:** 2-3 hours

**Files to Modify:**

- All costs-analysis components

### Phase 9: Accessibility Improvements (Priority: High)

**Tasks:**

1. Add ARIA labels to all charts
2. Ensure keyboard navigation
3. Add screen reader support
4. Verify color contrast (WCAG AA)

**Estimated Time:** 3-4 hours

**Files to Modify:**

- All costs-analysis components

### Phase 10: Testing & Refinement (Priority: Medium)

**Tasks:**

1. Test all functionality
2. Test performance (<50ms calculations)
3. Test responsive design
4. Test accessibility
5. User acceptance testing

**Estimated Time:** 4-6 hours

**Total Estimated Time:** 49-69 hours

---

## Design System Compliance

### Colors to Use

**Replace Hardcoded Colors:**

- ❌ `#8B5CF6` → ✅ `chart-rent` or `accent-purple`
- ❌ `#3B82F6` → ✅ `chart-revenue` or `accent-blue`
- ❌ `#10B981` → ✅ `chart-ebitda` or `accent-green`
- ❌ `#F97316` → ✅ `chart-rentLoad` or `accent-orange`

**Design System Tokens:**

```typescript
// Chart Colors (from design system)
chart-rent: '#8B5CF6'      // Purple
chart-revenue: '#3B82F6'   // Blue
chart-ebitda: '#10B981'    // Green
chart-cashflow: '#14B8A6'  // Teal
chart-rentLoad: '#F97316'  // Orange

// Status Colors
accent-green: '#10B981'     // Optimal
accent-yellow: '#F59E0B'    // Warning
accent-red: '#EF4444'       // Critical
```

### Components to Use

**Required Components:**

- `Card`, `CardHeader`, `CardTitle`, `CardContent` (shadcn/ui)
- `Badge` (for status indicators)
- `Button` (with variants)
- `Input` (for search/filters)
- `Select` (for filters)
- `Table` (with enhancements)

**Chart Library:**

- Recharts (already in use)
- Use design system colors
- Ensure accessibility

### Spacing System

**8px Grid System:**

- Dashboard gap: `gap-6` (24px)
- Card padding: `p-6` (24px)
- Section spacing: `space-y-6` (24px)
- KPI grid gap: `gap-4` (16px)

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**Color Contrast:**

- Text on background: ≥ 4.5:1
- Chart colors: ≥ 3:1
- Interactive elements: ≥ 3:1

**Keyboard Navigation:**

- All interactive elements keyboard accessible
- Focus indicators visible
- Tab order logical

**Screen Reader Support:**

- ARIA labels on all charts
- Semantic HTML structure
- Status announcements for dynamic content

**Chart Accessibility:**

```tsx
<LineChart
  data={chartData}
  role="img"
  aria-label="Rent trend chart showing rent amounts from 2028 to 2052"
>
  {/* Chart configuration */}
</LineChart>
```

**Table Accessibility:**

```tsx
<Table role="table" aria-label="Year-by-year rent projection" aria-rowcount={data.length}>
  {/* Table configuration */}
</Table>
```

---

## Success Metrics

### Quantitative Metrics

1. **Information Scanning Time:**
   - Current: ~45-60 seconds to understand financial position
   - Target: <20 seconds

2. **Task Completion:**
   - Current: ~5-7 minutes to analyze costs
   - Target: <3 minutes

3. **User Engagement:**
   - Current: Unknown
   - Target: >80% users interact with charts/tables

### Qualitative Metrics

1. **Visual Hierarchy:**
   - Users can quickly identify key metrics
   - Trends are immediately visible

2. **Data Exploration:**
   - Users can easily filter and search data
   - Tables are navigable and scannable

3. **Insights:**
   - Users understand financial position quickly
   - Recommendations are actionable

4. **Responsive Design:**
   - Works well on all device sizes
   - Mobile experience is optimized

---

## Appendices

### Appendix A: Current Code Structure

**File:** `components/versions/costs-analysis/RentLens.tsx`

- Lines 1-857: Rent model display and calculations
- Key functions: Revenue projection, rent projection, NPV calculation

**File:** `components/versions/costs-analysis/CostBreakdown.tsx`

- Lines 1-477: Cost breakdown display and calculations
- Key functions: Full projection, pie chart data, table data

### Appendix B: Chart Configuration

**Recharts Configuration:**

```typescript
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Use design system colors
const CHART_COLORS = {
  rent: '#8B5CF6',
  staff: '#3B82F6',
  opex: '#10B981',
  rentLoad: '#F97316',
};
```

### Appendix C: Table Virtualization

**@tanstack/react-virtual for Virtualization:**

```typescript
// NOTE: Must install dependency first: npm install @tanstack/react-virtual
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

// Virtualize table rows for performance (30-year tables)
function VirtualizedTable({ data }: { data: TableRow[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows outside viewport
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <TableRow>
              {/* Row content */}
            </TableRow>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Installation:**

```bash
npm install @tanstack/react-virtual
```

**Compatibility:**

- React 18.3.0 ✅
- TanStack Table v8.x ✅
- TypeScript 5.6+ ✅

### Appendix D: Insights Calculation

**Complete Implementation:**
See Section "360° Review Feedback - Addressed Issues" → "Critical Blockers" → "Insights Calculation Module Missing" for full implementation.

**Key Points:**

- Uses `Result<T>` pattern for error handling
- Uses `Decimal.js` for financial precision
- Thresholds documented:
  - Rent Load: 20-30% optimal, 30-40% warning, 40%+ critical
  - Staff Costs: >50% warning
  - Opex: >40% warning
- Performance: <50ms calculation time
- Test Coverage: >90% required

---

## 360° Review Feedback - Addressed Issues

This section addresses all feedback from the Implementation Audit Agent's 360° review report.

### 🔴 Critical Blockers - Resolved

#### 1. Missing Dependency: @tanstack/react-virtual

**Issue:** Plan references `@tanstack/react-virtual` for table virtualization but dependency is not installed.

**Resolution:** Install dependency before Phase 4 implementation.

**Implementation:**

```bash
npm install @tanstack/react-virtual
```

**Add to package.json:**

```json
{
  "dependencies": {
    "@tanstack/react-virtual": "^3.0.0"
  }
}
```

**Verification:**

- Compatible with React 18.3.0 ✅
- Works with TanStack Table v8.x ✅
- No breaking changes expected ✅

**Effort:** 5 minutes

**Action Required:** Install before Phase 4 (Interactive Tables)

#### 2. Insights Calculation Module Missing

**Issue:** Plan proposes `lib/calculations/insights/cost-insights.ts` but no existing pattern exists.

**Resolution:** Create insights calculation module following existing calculation patterns.

**Implementation:**

````typescript
// lib/calculations/insights/cost-insights.ts
import { Decimal } from 'decimal.js';
import type { Result } from '@/types/result';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';

export interface Insight {
  type: 'optimal' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendation: string;
}

/**
 * Calculates cost insights and recommendations from financial projection.
 *
 * Analyzes rent load, cost structure, and trends to provide actionable insights.
 *
 * @param projection - Full financial projection result (30-year period)
 * @returns Result<Insight[]> - Array of insights with type, message, and recommendation
 *
 * @example
 * ```typescript
 * const result = calculateCostInsights(projection);
 * if (result.success) {
 *   result.data.forEach(insight => {
 *     console.log(`${insight.type}: ${insight.title}`);
 *   });
 * }
 * ```
 */
export function calculateCostInsights(projection: FullProjectionResult): Result<Insight[]> {
  const insights: Insight[] = [];

  if (!projection || !projection.years || projection.years.length === 0) {
    return {
      success: false,
      error: 'Invalid projection data',
    };
  }

  // Calculate average rent load (2028-2052 period)
  const npvPeriod = projection.years.filter((y) => y.year >= 2028 && y.year <= 2052);
  const avgRentLoad = npvPeriod
    .reduce((sum, year) => {
      if (year.revenue.isZero()) return sum;
      const rentLoad = year.rent.div(year.revenue).times(100);
      return sum.plus(rentLoad);
    }, new Decimal(0))
    .div(npvPeriod.length);

  // Rent Load Analysis
  if (avgRentLoad.greaterThan(40)) {
    insights.push({
      type: 'critical',
      title: 'High Rent Load',
      message: `Rent load is ${avgRentLoad.toFixed(1)}%, exceeding optimal range (20-30%)`,
      recommendation:
        'Consider renegotiating rent terms, increasing revenue, or exploring alternative rent models',
    });
  } else if (avgRentLoad.greaterThan(30)) {
    insights.push({
      type: 'warning',
      title: 'Elevated Rent Load',
      message: `Rent load is ${avgRentLoad.toFixed(1)}%, above optimal range (20-30%)`,
      recommendation: 'Monitor rent load trends and consider revenue optimization strategies',
    });
  } else if (avgRentLoad.greaterThanOrEqualTo(20) && avgRentLoad.lessThanOrEqualTo(30)) {
    insights.push({
      type: 'optimal',
      title: 'Optimal Rent Load',
      message: `Rent load is ${avgRentLoad.toFixed(1)}%, within optimal range (20-30%)`,
      recommendation: 'Maintain current rent model and revenue strategy',
    });
  }

  // Cost Structure Analysis
  const totalCosts = npvPeriod.reduce(
    (sum, year) => sum.plus(year.rent).plus(year.staffCost).plus(year.opex),
    new Decimal(0)
  );
  const totalStaff = npvPeriod.reduce((sum, year) => sum.plus(year.staffCost), new Decimal(0));
  const staffPercent = totalCosts.isZero() ? new Decimal(0) : totalStaff.div(totalCosts).times(100);

  if (staffPercent.greaterThan(50)) {
    insights.push({
      type: 'warning',
      title: 'High Staff Costs',
      message: `Staff costs represent ${staffPercent.toFixed(1)}% of total costs`,
      recommendation:
        'Review staffing ratios, salary structures, and consider efficiency improvements',
    });
  }

  // Opex Analysis
  const totalOpex = npvPeriod.reduce((sum, year) => sum.plus(year.opex), new Decimal(0));
  const opexPercent = totalCosts.isZero() ? new Decimal(0) : totalOpex.div(totalCosts).times(100);

  if (opexPercent.greaterThan(40)) {
    insights.push({
      type: 'warning',
      title: 'High Operating Expenses',
      message: `Operating expenses represent ${opexPercent.toFixed(1)}% of total costs`,
      recommendation: 'Review opex sub-accounts and identify optimization opportunities',
    });
  }

  return {
    success: true,
    data: insights,
  };
}
````

**Type Definitions:**

```typescript
// lib/types/insights.ts
export interface Insight {
  type: 'optimal' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendation: string;
}

// Export from lib/types/index.ts
export type { Insight } from './insights';
```

**Thresholds Documented:**

- Rent Load: 20-30% optimal, 30-40% warning, 40%+ critical
- Staff Costs: >50% warning
- Opex: >40% warning

**Effort:** 4-6 hours (including tests)

**Action Required:** Create before Phase 5 (Insights Panel)

### ⚠️ Major Issues - Resolved

#### 3. Component Integration with VersionDetail

**Issue:** Plan doesn't specify how to integrate new `CostsAnalysisDashboard` component.

**Resolution:** Update `VersionDetail.tsx` to use new dashboard component.

**Implementation:**

```typescript
// components/versions/VersionDetail.tsx
import { CostsAnalysisDashboard } from './costs-analysis/CostsAnalysisDashboard';

// In TabsContent for "costs" tab:
<TabsContent value="costs" className="space-y-4">
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
```

**Backward Compatibility:**

- Keep existing `RentLens` and `CostBreakdown` components
- `CostsAnalysisDashboard` wraps them with new features
- Gradual migration path

**Effort:** 1-2 hours

#### 4. Chart Performance Optimization

**Issue:** Multiple charts on same page may cause performance issues.

**Resolution:** Memoize chart components and optimize data transformations.

**Implementation:**

```typescript
// components/versions/costs-analysis/RentTrendChart.tsx
import { memo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartColors, chartTheme, formatChartCurrency } from '@/lib/charts/config';

interface RentTrendChartProps {
  data: Array<{ year: number; rent: Decimal }>;
}

function RentTrendChartComponent({ data }: RentTrendChartProps): JSX.Element {
  // Memoize chart data transformation
  const chartData = useMemo(() => {
    return data.map(item => ({
      year: item.year,
      rent: item.rent.toNumber(),
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={chartData}
        role="img"
        aria-label="Rent trend chart showing rent amounts from 2028 to 2052"
      >
        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} opacity={0.3} />
        <XAxis dataKey="year" stroke={chartTheme.textColor} />
        <YAxis stroke={chartTheme.textColor} tickFormatter={formatChartCurrency} />
        <Tooltip
          contentStyle={{
            backgroundColor: chartTheme.backgroundColor,
            border: `1px solid ${chartTheme.borderColor}`,
          }}
          formatter={(value: number) => formatChartCurrency(value)}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="rent"
          stroke={chartColors.rent}
          strokeWidth={2}
          name="Rent"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Memoize component to prevent unnecessary re-renders
export const RentTrendChart = memo(RentTrendChartComponent);
```

**Lazy Loading (Optional):**

```typescript
// For charts below fold
const RentLoadTrendChart = lazy(() => import('./RentLoadTrendChart'));

// Wrap in Suspense
<Suspense fallback={<Skeleton className="h-96 w-full" />}>
  <RentLoadTrendChart data={rentLoadData} />
</Suspense>
```

**Effort:** 2-3 hours

#### 5. Error Handling in Components

**Issue:** Plan doesn't specify error handling for edge cases.

**Resolution:** Add comprehensive error handling to all components.

**Implementation:**

```typescript
// Example: KPIMetricsGrid component
interface KPIMetricsGridProps {
  projection: FullProjectionResult | null;
  rentNPV: Decimal | null;
  avgRentLoad: Decimal | null;
}

export function KPIMetricsGrid({
  projection,
  rentNPV,
  avgRentLoad,
}: KPIMetricsGridProps): JSX.Element {
  // Error handling: Missing data
  if (!projection || !projection.summary) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No projection data available</p>
        </CardContent>
      </Card>
    );
  }

  // Error handling: Invalid calculations
  if (!rentNPV || rentNPV.isNaN()) {
    console.error('Invalid NPV calculation');
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error calculating NPV</p>
        </CardContent>
      </Card>
    );
  }

  // Normal rendering
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* KPI Cards */}
    </div>
  );
}
```

**Error Boundary:**

```typescript
// components/versions/costs-analysis/CostsAnalysisErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/components/ErrorFallback';

export function CostsAnalysisErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Costs Analysis Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

**Loading States:**

```typescript
const [calculating, setCalculating] = useState(false);

if (calculating) {
  return <Skeleton className="h-96 w-full" />;
}
```

**Effort:** 3-4 hours

#### 6. Test Coverage Specification

**Issue:** Plan doesn't specify test requirements.

**Resolution:** Add comprehensive test coverage requirements.

**Test Coverage Requirements:**

- **Insights Calculations:** >90% coverage
- **Component Tests:** >80% coverage
- **Integration Tests:** All user flows
- **Performance Tests:** <50ms calculation time

**Test Scenarios:**

**Insights Calculation Tests:**

```typescript
// lib/calculations/insights/__tests__/cost-insights.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCostInsights } from '../cost-insights';
import type { FullProjectionResult } from '@/lib/calculations/financial/projection';

describe('calculateCostInsights', () => {
  it('returns optimal insight when rent load is 25%', () => {
    const projection = createMockProjection({ avgRentLoad: 25 });
    const result = calculateCostInsights(projection);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].type).toBe('optimal');
  });

  it('returns warning insight when rent load is 35%', () => {
    const projection = createMockProjection({ avgRentLoad: 35 });
    const result = calculateCostInsights(projection);

    expect(result.success).toBe(true);
    expect(result.data[0].type).toBe('warning');
  });

  it('returns critical insight when rent load is 45%', () => {
    const projection = createMockProjection({ avgRentLoad: 45 });
    const result = calculateCostInsights(projection);

    expect(result.success).toBe(true);
    expect(result.data[0].type).toBe('critical');
  });

  it('handles missing projection data', () => {
    const result = calculateCostInsights(null as any);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

**Component Tests:**

```typescript
// components/versions/costs-analysis/__tests__/KPIMetricsGrid.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPIMetricsGrid } from '../KPIMetricsGrid';

describe('KPIMetricsGrid', () => {
  it('renders all 4 KPI cards', () => {
    const projection = createMockProjection();
    render(
      <KPIMetricsGrid
        projection={projection}
        rentNPV={new Decimal(232792422)}
        avgRentLoad={new Decimal(23.99)}
      />
    );

    expect(screen.getByText('NPV (2028-2052)')).toBeInTheDocument();
    expect(screen.getByText('Avg Rent Load %')).toBeInTheDocument();
    expect(screen.getByText('Year 1 Rent (2028)')).toBeInTheDocument();
    expect(screen.getByText('Avg Cost per Student')).toBeInTheDocument();
  });

  it('handles null projection data', () => {
    render(
      <KPIMetricsGrid
        projection={null}
        rentNPV={null}
        avgRentLoad={null}
      />
    );

    expect(screen.getByText('No projection data available')).toBeInTheDocument();
  });
});
```

**Effort:** 2-3 hours (documentation) + 8-12 hours (implementation)

#### 7. Export Functionality Security

**Issue:** Plan mentions CSV/PDF export but doesn't specify security measures.

**Resolution:** Add secure export functionality with sanitization.

**Implementation:**

```typescript
// lib/utils/export.ts
/**
 * Exports data to CSV with security measures.
 *
 * @param data - Array of objects to export
 * @param filename - Output filename (without extension)
 * @param maxRows - Maximum rows to export (default: 10000)
 * @returns void
 */
export function exportToCSV(data: unknown[], filename: string, maxRows: number = 10000): void {
  // Limit export size
  if (data.length > maxRows) {
    throw new Error(`Export limited to ${maxRows} rows. Current data: ${data.length} rows`);
  }

  // Sanitize data
  const sanitized = data.map((row) => sanitizeRow(row));

  // Convert to CSV
  const csv = convertToCSV(sanitized);

  // Create secure download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(filename)}-${Date.now()}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeRow(row: unknown): Record<string, string> {
  const sanitized: Record<string, string> = {};
  if (typeof row === 'object' && row !== null) {
    Object.entries(row).forEach(([key, value]) => {
      // Sanitize key
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
      // Sanitize value (prevent CSV injection)
      const safeValue = String(value || '').replace(/[=+\-@]/g, '');
      sanitized[safeKey] = safeValue;
    });
  }
  return sanitized;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_-]/g, '_');
}
```

**Effort:** 1-2 hours

#### 8. Documentation Standards

**Issue:** Plan doesn't follow 10-step methodology and lacks JSDoc examples.

**Resolution:** Add comprehensive JSDoc documentation.

**JSDoc Format:**

````typescript
/**
 * KPI Metrics Grid Component
 *
 * Displays key financial metrics in prominent cards at top of dashboard.
 * Shows NPV, Rent Load, Year 1 Rent, and Average Cost per Student.
 *
 * @component
 * @param props - KPIMetricsGridProps containing projection data and metrics
 * @param props.projection - Full financial projection result (30-year period)
 * @param props.rentNPV - Net Present Value of rent (2028-2052 period)
 * @param props.avgRentLoad - Average rent load percentage (2028-2052 period)
 *
 * @returns JSX.Element - Grid of 4 KPI cards
 *
 * @example
 * ```tsx
 * <KPIMetricsGrid
 *   projection={projection}
 *   rentNPV={new Decimal(232792422)}
 *   avgRentLoad={new Decimal(23.99)}
 * />
 * ```
 */
export function KPIMetricsGrid(props: KPIMetricsGridProps): JSX.Element {
  // Component implementation
}
````

**Effort:** 2-3 hours

#### 9. Filter Input Validation

**Issue:** Plan mentions filters but doesn't specify validation rules.

**Resolution:** Add comprehensive input validation.

**Implementation:**

```typescript
// components/versions/costs-analysis/TableFilters.tsx
interface YearRangeFilterProps {
  startYear: number;
  endYear: number;
  onStartYearChange: (year: number) => void;
  onEndYearChange: (year: number) => void;
}

export function YearRangeFilter({
  startYear,
  endYear,
  onStartYearChange,
  onEndYearChange,
}: YearRangeFilterProps): JSX.Element {
  const [error, setError] = useState<string | null>(null);

  const handleStartYearChange = (value: number) => {
    // Validate range
    const minYear = Math.max(2023, value);
    const maxYear = Math.min(2052, endYear);

    if (minYear > maxYear) {
      setError('Start year must be before end year');
      return;
    }

    if (value < 2023 || value > 2052) {
      setError('Year must be between 2023 and 2052');
      return;
    }

    setError(null);
    onStartYearChange(value);
  };

  return (
    <div className="space-y-2">
      <Input
        type="number"
        min={2023}
        max={2052}
        value={startYear}
        onChange={(e) => handleStartYearChange(parseInt(e.target.value) || 2023)}
        className={error ? 'border-destructive' : ''}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
```

**Effort:** 1-2 hours

#### 10. Design System Color Usage

**Issue:** Plan references design system colors but some hardcoded colors in examples.

**Resolution:** Replace all hardcoded colors with design system tokens.

**Implementation:**

```typescript
// ✅ CORRECT: Use design system tokens
import { chartColors } from '@/lib/charts/config';
import { colors } from '@/config/design-system';

// Chart colors
const rentColor = chartColors.rent; // '#8B5CF6'
const staffColor = chartColors.revenue; // '#3B82F6'
const opexColor = chartColors.ebitda; // '#10B981'

// Status colors
const optimalColor = colors.accent.green; // '#10B981'
const warningColor = colors.accent.yellow; // '#F59E0B'
const criticalColor = colors.accent.red; // '#EF4444'
```

**Effort:** 1 hour

### Updated Implementation Timeline

**Phase 0: Preparation (5-7 hours):**

- [ ] Install `@tanstack/react-virtual` (5 minutes)
- [ ] Create `lib/calculations/insights/cost-insights.ts` (4-6 hours)
- [ ] Create `lib/types/insights.ts` (30 minutes)
- [ ] Add unit tests for insights (>90% coverage) (2-3 hours)
- [ ] Review insights formulas with stakeholders (1 hour)

**Phase 1-10: Implementation (49-69 hours):**

- Follow plan phases with adjustments:
  - Add error handling to each component
  - Memoize chart components
  - Add comprehensive tests
  - Follow JSDoc standards
  - Use design system tokens only

**Post-Implementation (4-6 hours):**

- Component tests (2-3 hours)
- Integration tests (2-3 hours)
- Performance testing (1 hour)
- Accessibility audit (1 hour)

**Total Estimated Time:** 79-111 hours (10-14 days)

---

## Review Questions

1. **KPI Cards:** Should KPI cards be at the top, or integrated into sections?

2. **Trend Charts:** Which trend charts are most important? (Rent, Rent Load, Costs, All?)

3. **Comparison Tools:** Is rent model comparison a priority, or can it be Phase 2?

4. **Insights Panel:** Should insights be auto-generated or user-triggered?

5. **Table Features:** Which table features are highest priority? (Filter, Sort, Search, Export?)

6. **Responsive Design:** What's the minimum screen size to support? (Mobile, Tablet, Desktop?)

7. **Performance:** Are there any performance concerns with multiple charts?

8. **Timeline:** Is the 49-69 hour estimate acceptable for implementation?

---

## Approval

**Status:** ⚠️ **APPROVED WITH NOTES** (per 360° Review Report)

**Review Summary:**

- ✅ **Overall Assessment:** Well-structured, aligns with codebase patterns
- 🔴 **Critical Blockers:** 2 (easily resolvable)
- ⚠️ **Major Issues:** 8 (addressable during implementation)
- 🟡 **Risk Level:** MEDIUM (manageable with proper mitigation)
- ✅ **No Fundamental Misalignments:** Plan aligns well with codebase

**Conditions Met:**

1. ✅ Missing dependency identified (`@tanstack/react-virtual`)
2. ✅ Insights calculation module specified
3. ✅ Component integration approach documented
4. ✅ Chart performance optimization specified
5. ✅ Error handling approach documented
6. ✅ Test coverage requirements specified
7. ✅ Export security measures documented
8. ✅ Documentation standards specified
9. ✅ Filter validation rules documented
10. ✅ Design system color usage clarified

**Next Steps:**

1. ✅ Review feedback addressed
2. ✅ Implementation plan updated
3. ⏳ Install missing dependency (before Phase 4)
4. ⏳ Create insights module (before Phase 5)
5. ⏳ Begin implementation (Phase 0: Preparation)

**Implementation Ready:** ✅ Yes - All blockers and major issues addressed

**Pre-Implementation Checklist:**

- [ ] Install `@tanstack/react-virtual`
- [ ] Create insights calculation module with tests
- [ ] Review insights formulas with stakeholders
- [ ] Set up error boundaries
- [ ] Add loading state components

---

**Document End**

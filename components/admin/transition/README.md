# Transition Period Planning Components

A comprehensive set of admin UI components for managing transition period parameters (2025-2027) in Project Zeta.

## Quick Start

```typescript
// Import all components
import {
  GlobalSettingsCard,
  YearlyPlanningTable,
  LivePreviewCalculator,
  QuickActionsBar,
  RecalculateDialog,
} from '@/components/admin/transition';

// Or import individually
import { GlobalSettingsCard } from '@/components/admin/transition/GlobalSettingsCard';
```

## Components

### GlobalSettingsCard

Configure capacity cap and rent adjustment for transition period.

**Props:**

```typescript
interface GlobalSettingsCardProps {
  capacityCap: number; // Current capacity cap (1-3000)
  rentAdjustmentPercent: number; // Rent adjustment % (-50 to +100)
  historicalRent2024?: number; // Base rent for calculation (default: 4,500,000)
  onChange: (settings) => void; // Callback when settings change
  disabled?: boolean; // Disable editing
}
```

**Features:**

- Inline validation
- Live rent calculation preview
- Visual indicators for modified/invalid values
- Info tooltips

**Usage:**

```typescript
<GlobalSettingsCard
  capacityCap={1850}
  rentAdjustmentPercent={10.0}
  historicalRent2024={4500000}
  onChange={(settings) => console.log(settings)}
/>
```

---

### YearlyPlanningTable

Editable table for transition years with live preview.

**Props:**

```typescript
interface YearlyPlanningTableProps {
  yearData: YearData[]; // Array of year data (2025-2027)
  capacityCap: number; // Max enrollment constraint
  rent: number; // Calculated rent for preview
  onChange: (yearData) => void; // Callback when data changes
  disabled?: boolean; // Disable editing
}

interface YearData {
  id: string;
  year: number;
  targetEnrollment: number;
  staffCostBase: string; // Decimal as string
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Features:**

- Inline editing with validation
- Live preview column
- Color-coded borders (valid/modified/invalid)
- Formatted number display
- Legend for visual indicators

**Usage:**

```typescript
<YearlyPlanningTable
  yearData={yearData}
  capacityCap={1850}
  rent={4950000}
  onChange={(newData) => setYearData(newData)}
/>
```

---

### LivePreviewCalculator

Displays real-time financial metrics for a year.

**Props:**

```typescript
interface LivePreviewCalculatorProps {
  enrollment: number; // Student count
  staffCosts: number; // Staff costs in SAR
  rent: number; // Annual rent in SAR
  averageTuition?: number; // Default: 25,000 SAR
  opexPercent?: number; // Default: 0.15 (15%)
  isLoading?: boolean; // Show loading skeleton
}
```

**Calculations:**

- Revenue = Enrollment × Average Tuition
- OpEx = Revenue × OpEx%
- EBITDA = Revenue - Staff Costs - Rent - OpEx
- Staff % = Staff Costs / Revenue

**Usage:**

```typescript
<LivePreviewCalculator
  enrollment={1850}
  staffCosts={8500000}
  rent={4950000}
/>
```

---

### QuickActionsBar

Helper actions for transition planning.

**Props:**

```typescript
interface QuickActionsBarProps {
  onRecalculate: () => void; // Handler for recalculate action
  onReset: () => void; // Handler for reset action
  disabled?: boolean; // Disable buttons
}
```

**Features:**

- Recalculate from 2028 button
- Reset to defaults button with confirmation
- Disabled state support

**Usage:**

```typescript
<QuickActionsBar
  onRecalculate={() => setShowRecalculateDialog(true)}
  onReset={handleReset}
/>
```

---

### RecalculateDialog

Dialog for recalculating staff costs from 2028 baseline.

**Props:**

```typescript
interface RecalculateDialogProps {
  open: boolean; // Dialog open state
  onOpenChange: (open: boolean) => void; // Close handler
  onConfirm: (staffCost2028, cpiRate) => Promise<void>; // Confirm handler
}
```

**Features:**

- Input for 2028 staff cost base
- Input for CPI rate
- Live preview of calculated values
- Validation with error messages
- Visual formula display
- Loading state during confirmation

**Calculation Formula:**

```
2027 = 2028 / (1 + CPI)
2026 = 2027 / (1 + CPI)
2025 = 2026 / (1 + CPI)
```

**Usage:**

```typescript
<RecalculateDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  onConfirm={async (base2028, cpi) => {
    await recalculateStaffCosts(base2028, cpi);
  }}
/>
```

## Design System

### Color Coding

Components use consistent color coding for validation states:

- **Valid/Saved**: `border-input` (default gray)
- **Modified/Unsaved**: `border-yellow-500` (yellow warning)
- **Invalid/Error**: `border-red-500` (red error)
- **Positive EBITDA**: `text-green-500`
- **Negative EBITDA**: `text-red-500`

### Typography

- Headers: `text-3xl font-bold`
- Card titles: `text-xl font-semibold`
- Labels: `text-sm font-medium`
- Body text: `text-sm text-muted-foreground`
- Monospace numbers: `font-mono`

### Spacing

- Card padding: `p-6`
- Section spacing: `space-y-6`
- Form fields: `space-y-2`
- Buttons: `gap-2`

### Dark Mode

All components support dark mode out of the box using Tailwind's `dark:` prefix.

## Accessibility

All components follow WCAG 2.1 AA+ guidelines:

- ✅ Keyboard navigation
- ✅ ARIA labels and descriptions
- ✅ Proper heading hierarchy
- ✅ Focus indicators
- ✅ Screen reader support
- ✅ Semantic HTML

### Keyboard Shortcuts

- **Tab**: Navigate between fields
- **Enter**: Confirm dialog actions
- **Escape**: Close dialogs
- **Space**: Toggle buttons

## Validation Rules

### Capacity Cap

- Min: 1 student
- Max: 3,000 students
- Type: Integer

### Rent Adjustment

- Min: -50%
- Max: +100%
- Type: Decimal (0.1 step)

### Enrollment

- Min: 1 student
- Max: Capacity cap value
- Type: Integer

### Staff Costs

- Min: > 0 SAR
- Type: Decimal

### CPI Rate (Recalculation)

- Min: 0%
- Max: 50%
- Type: Decimal (0.1 step)

## Number Formatting

### Display Format

```typescript
// Large numbers (millions)
12,300,000 → "12.3M SAR"

// Standard numbers
1,850 → "1,850 students"
8,500,000 → "8,500,000 SAR"

// Percentages
18.8 → "18.8%"
```

### Internal Format

All financial calculations use Decimal.js for precision:

```typescript
import Decimal from 'decimal.js';

const revenue = new Decimal(enrollment).times(tuition);
```

## State Management

Components use controlled inputs with local state:

```typescript
const [localValue, setLocalValue] = useState(value);

// Update on blur for validation
const handleBlur = (e) => {
  const validated = validate(e.target.value);
  if (validated.isValid) {
    onChange(validated.value);
  }
};
```

## Error Handling

Components provide inline error messages:

```typescript
{error && (
  <p className="text-xs text-red-500">{error}</p>
)}
```

## Testing

### Manual Testing Checklist

- [ ] All inputs validate correctly
- [ ] Live preview updates in real-time
- [ ] Recalculation dialog works
- [ ] Save/discard functionality works
- [ ] Toast notifications appear
- [ ] Dark mode displays correctly
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Mobile/tablet responsive layout

### Example Test Cases

1. **Invalid Enrollment**: Enter enrollment > capacity cap
   - Expected: Red border, error message

2. **Modified Value**: Change any value without saving
   - Expected: Yellow border, dirty state flag

3. **Recalculate**: Use recalculation dialog
   - Expected: New values applied, preview updates

4. **Unsaved Changes**: Navigate away with unsaved changes
   - Expected: Browser warning dialog

## Performance

- **Debounced calculations**: 300ms delay for live preview
- **Optimized renders**: Proper React dependency arrays
- **Memoized calculations**: Use Decimal.js efficiently
- **Loading states**: Skeleton loaders for async operations

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

Required packages:

- `react` v18+
- `decimal.js` v10+
- `lucide-react` (icons)
- `@radix-ui/*` (shadcn/ui primitives)
- `tailwindcss` v3+

## Contributing

When modifying components:

1. Maintain TypeScript strict mode
2. Follow existing naming conventions
3. Add JSDoc comments for complex logic
4. Test in dark mode
5. Verify keyboard navigation
6. Update this README if needed

## License

Part of Project Zeta - Financial Planning Application

---

**Last Updated**: November 20, 2025

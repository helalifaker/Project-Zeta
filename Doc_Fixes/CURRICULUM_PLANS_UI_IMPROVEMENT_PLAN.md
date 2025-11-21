# Curriculum Plans Page - UI/UX Improvement Plan

**Document Version:** 2.0 (Updated per 360° Review)  
**Date:** November 13, 2025  
**Status:** Approved with Notes - Ready for Implementation  
**Prepared By:** UI/UX Coherence Control Agent  
**Review Status:** ✅ APPROVED WITH NOTES (see 360° Review Report)

---

## Executive Summary

This document outlines a comprehensive improvement plan for the Curriculum Plans page (`/versions/[id]` - Curriculum tab) to enhance visual hierarchy, improve information organization, ensure design system compliance, and create a more intuitive user experience.

**Key Objectives:**

- Improve visual hierarchy and information scanning
- Organize content into logical, scannable groups
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
│ Curriculum Plans                                            │
│ FR curriculum is required. IB curriculum is optional.       │
├─────────────────────────────────────────────────────────────┤
│ [Enable IB Program] Checkbox                                │
│ IB program is disabled. Check to enable...                 │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FR                                                       │ │
│ │ [Edit]                                                   │ │
│ │                                                          │ │
│ │ Capacity: 2000 students                                  │ │
│ │ Base Tuition: 38000 SAR                                 │ │
│ │ CPI Frequency: Every 2 year(s)                          │ │
│ │ Tuition Growth Rate: 5.0%                               │ │
│ │ Students per Teacher: 14.01                             │ │
│ │ Students per Non-Teacher: 27.03                          │ │
│ │ Teacher Monthly Salary: 17,000 SAR                      │ │
│ │ Non-Teacher Monthly Salary: 12,000 SAR                  │ │
│ │                                                          │ │
│ │ Capacity Ramp-Up (2028-2032)                            │ │
│ │ 2028: 95.0% = 1900 students                            │ │
│ │ 2029: 95.0% = 1900 students                            │ │
│ │ 2030: 95.0% = 1900 students                            │ │
│ │ 2031: 100.0% = 2000 students                            │ │
│ │ 2032: 100.0% = 2000 students                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ IB                                                       │ │
│ │ [Edit]                                                   │ │
│ │                                                          │ │
│ │ Capacity: 0 students                                    │ │
│ │ Base Tuition: 60000 SAR                                 │ │
│ │ ... (same structure as FR)                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Current Component Analysis

**File:** `components/versions/VersionDetail.tsx` (Lines 1228-1800)

**Current Implementation:**

- Single Card container for all curriculum plans
- Flat list of curriculum plans with basic borders
- Key-value pairs displayed as plain text
- Ramp-up data in simple grid (5 columns)
- Edit mode shows all fields in 2-column grid
- IB enable/disable checkbox in separate container above plans

**Issues Identified:**

1. **Visual Hierarchy:** All information has equal visual weight
2. **Information Density:** Too much information displayed at once
3. **Grouping:** No logical grouping of related fields
4. **Visual Distinction:** FR and IB sections look identical
5. **Ramp-Up Prominence:** Critical ramp-up data lacks visual emphasis
6. **Edit Mode:** Overwhelming 2-column grid with all fields
7. **Design System:** Mixed usage of design tokens and hardcoded values

---

## Identified Issues

### 1. Visual Hierarchy Problems

**Issue:** All information displayed with equal visual weight

- Capacity, tuition, and staffing parameters all look the same
- No clear distinction between primary and secondary information
- Ramp-up period (critical business data) blends into other details

**Impact:** Users struggle to quickly identify key information

### 2. Layout and Spacing Issues

**Issue:** Dense, text-heavy layout

- Key-value pairs displayed as plain text
- Inconsistent spacing between sections
- No visual breathing room
- Edit mode shows all 8+ fields in overwhelming 2-column grid

**Impact:** Poor information scanning and cognitive overload

### 3. Information Organization

**Issue:** No logical grouping of related fields

- Basic configuration mixed with staffing parameters
- Ramp-up data appears as afterthought
- No clear sections or categories

**Impact:** Difficult to find specific information quickly

### 4. Design System Compliance

**Issue:** Inconsistent design system usage

- Mixed use of design tokens (`text-muted-foreground`) and hardcoded colors
- Inconsistent Card component usage
- Missing visual indicators (badges, icons)
- No clear component patterns

**Impact:** Visual inconsistency and maintenance challenges

### 5. User Experience Issues

**Issue:** Poor edit mode experience

- All fields shown at once in edit mode
- No step-by-step guidance
- Unclear which fields are required vs optional
- IB enable/disable disconnected from IB card

**Impact:** Confusing editing experience, potential data entry errors

### 6. Accessibility Concerns

**Issue:** Missing accessibility features

- No ARIA labels for curriculum sections
- Missing keyboard navigation indicators
- Color-only indicators (no icons/text)
- Insufficient contrast in some areas

**Impact:** Accessibility barriers for users with disabilities

---

## Proposed Solution

### High-Level Approach

1. **Card-Based Layout:** Separate Card components for each curriculum
2. **Visual Distinction:** Different accent colors for FR (blue) and IB (green)
3. **Information Grouping:** Organize into logical sections with clear hierarchy
4. **Ramp-Up Prominence:** Make ramp-up period visually prominent with timeline
5. **Improved Edit Mode:** Step-by-step form with clear sections
6. **Design System Compliance:** Use only design system tokens and components

### Proposed Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Curriculum Plans                                             │
│ FR curriculum is required. IB curriculum is optional.        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ ┌──────────────────┐ │
│ │  🇫🇷 FR CURRICULUM                  │ │  🌍 IB CURRICULUM│ │
│ │  [Required] [Enabled]               │ │  [Optional]      │ │
│ │                                     │ │  [Disabled]      │ │
│ │  ┌───────────────────────────────┐ │ │  ┌──────────────┐│ │
│ │  │ Basic Configuration           │ │ │  │ Basic Config ││ │
│ │  │ • Capacity: 2000 students     │ │ │  │ (grayed out) ││ │
│ │  │ • Base Tuition: 38,000 SAR   │ │ │  └──────────────┘│ │
│ │  │ • CPI Frequency: Every 2 yrs │ │ │                  │ │
│ │  └───────────────────────────────┘ │ │  [Enable IB]    │ │
│ │                                     │ │  Checkbox       │ │
│ │  ┌───────────────────────────────┐ │ │                  │ │
│ │  │ Staffing Parameters           │ │ │                  │ │
│ │  │ • Students per Teacher: 14.01│ │ │                  │ │
│ │  │ • Teacher Salary: 17,000 SAR │ │ │                  │ │
│ │  │ • Non-Teacher Salary: 12K SAR│ │ │                  │ │
│ │  └───────────────────────────────┘ │ │                  │ │
│ │                                     │ │                  │ │
│ │  ┌───────────────────────────────┐ │ │                  │ │
│ │  │ Capacity Ramp-Up (2028-2032)  │ │ │                  │ │
│ │  │ [Timeline Visualization]       │ │ │                  │ │
│ │  │ 2028: ████████░░ 95% (1900)   │ │ │                  │ │
│ │  │ 2029: ████████░░ 95% (1900)   │ │ │                  │ │
│ │  │ 2030: ████████░░ 95% (1900)   │ │ │                  │ │
│ │  │ 2031: ██████████ 100% (2000)  │ │ │                  │ │
│ │  │ 2032: ██████████ 100% (2000)  │ │ │                  │ │
│ │  └───────────────────────────────┘ │ │                  │ │
│ │                                     │ │                  │ │
│ │  [Edit] Button                      │ │                  │ │
│ └─────────────────────────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Improvements

1. **Separate Cards:** Each curriculum gets its own Card component
2. **Visual Distinction:** FR (blue accent) vs IB (green accent)
3. **Status Badges:** Clear Required/Optional and Enabled/Disabled indicators
4. **Sectioned Content:** Logical grouping with visual separation
5. **Prominent Ramp-Up:** Timeline-style visualization with progress bars
6. **Integrated IB Toggle:** Checkbox moved to IB card header
7. **Collapsible Sections:** Optional accordion for better scanning

---

## Design Specifications

### Color Scheme

**FR Curriculum (French):**

- Accent Color: `accent-blue` (#3B82F6)
- Card Border: `border-accent-blue/20`
- Header Background: `bg-accent-blue/10`
- Badge: Blue variant

**IB Curriculum (International Baccalaureate):**

- Accent Color: `accent-green` (#10B981)
- Card Border: `border-accent-green/20`
- Header Background: `bg-accent-green/10`
- Badge: Green variant

**Disabled State:**

- Opacity: 60%
- Background: `bg-muted/30`
- Text: `text-muted-foreground`
- Border: `border-muted`

### Typography

**Card Headers:**

- Font Size: `text-xl` (1.25rem)
- Font Weight: `font-semibold`
- Color: `text-foreground`

**Section Titles:**

- Font Size: `text-base` (1rem)
- Font Weight: `font-medium`
- Color: `text-foreground`

**Field Labels:**

- Font Size: `text-sm` (0.875rem)
- Font Weight: `font-medium`
- Color: `text-muted-foreground`

**Field Values:**

- Font Size: `text-sm` (0.875rem)
- Font Weight: `font-normal`
- Color: `text-foreground`

### Spacing

**Card Padding:**

- Padding: `p-6` (1.5rem / 24px)

**Section Spacing:**

- Between sections: `space-y-4` (1rem / 16px)
- Within sections: `space-y-2` (0.5rem / 8px)

**Grid Gaps:**

- Ramp-up grid: `gap-3` (0.75rem / 12px)
- Edit form grid: `gap-4` (1rem / 16px)

### Component Specifications

**Card Structure:**

```tsx
<Card className="border-accent-blue/20">
  <CardHeader className="bg-accent-blue/10">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon />
        <CardTitle>FR CURRICULUM</CardTitle>
        <Badge variant="outline">Required</Badge>
        <Badge variant="outline" className="border-accent-green/50 text-accent-green">
          Enabled
        </Badge>
      </div>
      <Button variant="ghost" size="sm">
        <Edit2 className="h-4 w-4" />
        Edit
      </Button>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">{/* Sections */}</CardContent>
</Card>
```

**Section Structure:**

```tsx
<div className="space-y-2">
  <h3 className="text-base font-medium">Basic Configuration</h3>
  <div className="grid grid-cols-2 gap-4">{/* Key-value pairs */}</div>
</div>
```

**Ramp-Up Timeline:**

```tsx
<div className="space-y-3">
  <h3 className="text-base font-medium">Capacity Ramp-Up (2028-2032)</h3>
  <div className="space-y-2">
    {years.map((year) => (
      <div className="flex items-center gap-3">
        <div className="w-16 text-sm font-medium">{year}</div>
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-blue transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <div className="w-24 text-sm text-muted-foreground">
          {percentage}% ({students} students)
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## Component Structure

### New Component Hierarchy

```
VersionDetail (Parent)
└── CurriculumTab
    ├── CurriculumPlansHeader
    │   ├── Title
    │   └── Description
    └── CurriculumPlansContainer
        ├── FRCurriculumCard
        │   ├── CurriculumCardHeader
        │   │   ├── Icon/Flag
        │   │   ├── Title
        │   │   ├── StatusBadges
        │   │   └── EditButton
        │   └── CurriculumCardContent
        │       ├── BasicConfigurationSection
        │       ├── StaffingSection
        │       └── RampUpSection
        └── IBCurriculumCard
            ├── CurriculumCardHeader
            │   ├── Icon/Flag
            │   ├── Title
            │   ├── StatusBadges
            │   ├── EnableCheckbox
            │   └── EditButton
            └── CurriculumCardContent
                ├── BasicConfigurationSection (disabled when IB off)
                ├── StaffingSection (disabled when IB off)
                └── RampUpSection (disabled when IB off)
```

### Component Breakdown

#### 1. CurriculumCard Component

**Purpose:** Reusable card component for each curriculum

**Props:**

```typescript
interface CurriculumCardProps {
  curriculumType: 'FR' | 'IB';
  plan: CurriculumPlan;
  isEditing: boolean;
  editFormData: EditFormData | null;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: () => void;
  canEdit: boolean;
  saving: boolean;
}
```

**Features:**

- Visual distinction based on curriculum type
- Status badges (Required/Optional, Enabled/Disabled)
- Integrated edit functionality
- Collapsible sections (optional)

#### 2. BasicConfigurationSection Component

**Purpose:** Display/edit basic curriculum configuration

**Fields:**

- Capacity
- Base Tuition
- CPI Frequency
- Tuition Growth Rate

**Display Mode:**

- Key-value pairs in 2-column grid
- Clear labels and values

**Edit Mode:**

- Form inputs with validation
- Inline help text
- Error messages

#### 3. StaffingSection Component

**Purpose:** Display/edit staffing parameters

**Fields:**

- Students per Teacher
- Students per Non-Teacher
- Teacher Monthly Salary
- Non-Teacher Monthly Salary

**Display Mode:**

- Key-value pairs with calculated yearly costs
- Warning badge if not configured

**Edit Mode:**

- Form inputs with validation
- Help text explaining calculations

#### 4. RampUpSection Component

**Purpose:** Display/edit capacity ramp-up period (2028-2032)

**Display Mode:**

- Timeline visualization with progress bars
- Year-by-year breakdown
- Utilization percentage and student count
- Note about 2033-2052 maintenance

**Edit Mode:**

- Input fields for each year (2028-2032)
- Percentage input with validation
- Real-time student count calculation
- Visual feedback for over-capacity

#### 5. IBEnableCheckbox Component

**Purpose:** Toggle IB program enable/disable

**Location:** IB card header (integrated)

**Features:**

- Checkbox with label
- Status text (enabled/disabled)
- Disables entire IB card when unchecked
- Visual feedback (grayed out when disabled)

---

## Implementation Plan

### Phase 1: Structure and Layout (Priority: High)

**Tasks:**

1. Extract curriculum display logic into `CurriculumCard` component
2. Implement card-based layout with proper spacing
3. Add visual distinction between FR and IB (accent colors)
4. Move IB enable checkbox to IB card header

**Estimated Time:** 4-6 hours

**Files to Modify:**

- `components/versions/VersionDetail.tsx`
- Create: `components/versions/curriculum/CurriculumCard.tsx`

### Phase 2: Information Organization (Priority: High)

**Tasks:**

1. Create section components (BasicConfiguration, Staffing, RampUp)
2. Group related fields into logical sections
3. Implement collapsible sections (optional, using Accordion)
4. Improve spacing and visual hierarchy

**Estimated Time:** 6-8 hours

**Files to Create:**

- `components/versions/curriculum/BasicConfigurationSection.tsx`
- `components/versions/curriculum/StaffingSection.tsx`
- `components/versions/curriculum/RampUpSection.tsx`

### Phase 3: Visual Enhancements (Priority: Medium)

**Tasks:**

1. Add status badges (Required/Optional, Enabled/Disabled)
2. Implement timeline visualization for ramp-up
3. Add icons/flags for curriculum types
4. Improve edit mode with step-by-step flow

**Estimated Time:** 4-6 hours

**Files to Modify:**

- All curriculum components
- Add: `components/versions/curriculum/RampUpTimeline.tsx`

### Phase 4: Design System Compliance (Priority: High)

**Tasks:**

1. Replace all hardcoded colors with design system tokens
2. Ensure consistent Card component usage
3. Apply proper spacing (8px grid)
4. Use Badge components for status indicators

**Estimated Time:** 2-3 hours

**Files to Modify:**

- All curriculum components

### Phase 5: Accessibility Improvements (Priority: High)

**Tasks:**

1. Add ARIA labels to all interactive elements
2. Ensure keyboard navigation support
3. Add screen reader friendly structure
4. Verify color contrast (WCAG AA)

**Estimated Time:** 2-3 hours

**Files to Modify:**

- All curriculum components

### Phase 6: Testing and Refinement (Priority: Medium)

**Tasks:**

1. Test all functionality (edit, save, cancel)
2. Test IB enable/disable flow
3. Test responsive design
4. Test accessibility with screen readers
5. Performance testing

**Estimated Time:** 3-4 hours

**Total Estimated Time:** 21-30 hours

---

## Design System Compliance

### Colors to Use

**Replace Hardcoded Colors:**

- ❌ `text-green-400` → ✅ `text-accent-green`
- ❌ `text-red-400` → ✅ `text-accent-red`
- ❌ `bg-blue-100` → ✅ `bg-accent-blue/10`
- ❌ `border-red-500` → ✅ `border-destructive`

**Design System Tokens:**

```typescript
// Backgrounds
bg - background - primary; // #0A0E1A
bg - background - secondary; // #141825
bg - background - tertiary; // #1E2332

// Text
text - primary; // #F8FAFC
text - secondary; // #94A3B8
text - muted - foreground; // #64748B

// Accents
accent - blue; // #3B82F6 (FR)
accent - green; // #10B981 (IB)
accent - red; // #EF4444 (errors)
accent - yellow; // #F59E0B (warnings)
```

### Components to Use

**Required Components:**

- `Card`, `CardHeader`, `CardTitle`, `CardContent` (shadcn/ui)
- `Badge` (for status indicators)
- `Button` (with variants: default, ghost, outline)
- `Input`, `Label` (for forms)
- `Accordion` (optional, for collapsible sections)

**Patterns:**

- Use `cn()` utility for conditional classes
- Follow shadcn/ui component patterns
- Use CSS variables for theming

### Spacing System

**8px Grid System:**

- Card padding: `p-6` (24px)
- Section spacing: `space-y-4` (16px)
- Field spacing: `space-y-2` (8px)
- Grid gaps: `gap-4` (16px)

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**Color Contrast:**

- Text on background: ≥ 4.5:1
- Large text: ≥ 3:1
- Interactive elements: ≥ 3:1

**Keyboard Navigation:**

- All interactive elements keyboard accessible
- Focus indicators visible (ring-2 ring-accent-blue)
- Tab order logical

**Screen Reader Support:**

- ARIA labels on all interactive elements
- Semantic HTML structure
- Status announcements for dynamic content

**Implementation:**

```tsx
// Example: Accessible Card Header
<CardHeader className="bg-accent-blue/10" aria-label="French Curriculum Configuration">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span aria-hidden="true">🇫🇷</span>
      <CardTitle id="fr-curriculum-title">FR CURRICULUM</CardTitle>
      <Badge aria-label="Required curriculum">Required</Badge>
      <Badge aria-label="Currently enabled">Enabled</Badge>
    </div>
    <Button
      variant="ghost"
      size="sm"
      aria-label="Edit French curriculum"
      aria-describedby="fr-curriculum-title"
    >
      <Edit2 className="h-4 w-4" aria-hidden="true" />
      Edit
    </Button>
  </div>
</CardHeader>
```

---

## Success Metrics

### Quantitative Metrics

1. **Information Scanning Time:**
   - Current: ~30-45 seconds to find specific information
   - Target: <15 seconds

2. **Edit Mode Completion:**
   - Current: ~5-7 minutes to edit all fields
   - Target: <3 minutes with step-by-step flow

3. **User Errors:**
   - Current: Unknown (no tracking)
   - Target: <5% error rate in edit mode

### Qualitative Metrics

1. **Visual Hierarchy:**
   - Users can quickly identify key information
   - Ramp-up data is immediately visible

2. **Information Organization:**
   - Related fields are grouped logically
   - Easy to find specific configuration

3. **Design Consistency:**
   - All components use design system tokens
   - Visual consistency across curriculum cards

4. **Accessibility:**
   - Screen reader users can navigate effectively
   - Keyboard-only users can complete all tasks

---

## Appendices

### Appendix A: Current Code Structure

**File:** `components/versions/VersionDetail.tsx`

**Relevant Sections:**

- Lines 1228-1800: Curriculum tab content
- Lines 1410-1795: Curriculum plan display and edit logic

**Key Functions:**

- `handleEditStart(plan)`: Start editing a curriculum plan
- `handleSave(planId)`: Save curriculum plan changes
- `handleEditCancel()`: Cancel editing

### Appendix B: Design System Reference

**File:** `config/design-system.ts`

**Key Exports:**

- `colors`: Color palette
- `typography`: Font sizes and families
- `spacing`: Spacing system
- `borderRadius`: Border radius values

**File:** `app/globals.css`

**CSS Variables:**

- `--background`: Background colors
- `--foreground`: Text colors
- `--accent-*`: Accent colors
- `--muted-*`: Muted colors

### Appendix C: Component Examples

**Example: Curriculum Card (Read Mode)**

```tsx
<Card className="border-accent-blue/20">
  <CardHeader className="bg-accent-blue/10">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          🇫🇷
        </span>
        <CardTitle>FR CURRICULUM</CardTitle>
        <Badge variant="outline">Required</Badge>
        <Badge variant="default">Enabled</Badge>
      </div>
      {canEdit && (
        <Button variant="ghost" size="sm" onClick={onEditStart}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )}
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    <BasicConfigurationSection plan={plan} />
    <StaffingSection plan={plan} />
    <RampUpSection plan={plan} />
  </CardContent>
</Card>
```

**Example: Ramp-Up Timeline**

```tsx
<div className="space-y-3">
  <h3 className="text-base font-medium">Capacity Ramp-Up (2028-2032)</h3>
  <div className="space-y-2">
    {[2028, 2029, 2030, 2031, 2032].map((year) => {
      const students = getStudentsForYear(year);
      const percentage = (students / capacity) * 100;

      return (
        <div key={year} className="flex items-center gap-3">
          <div className="w-16 text-sm font-medium">{year}</div>
          <div className="flex-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-blue transition-all"
                style={{ width: `${percentage}%` }}
                aria-label={`${percentage.toFixed(1)}% utilization`}
              />
            </div>
          </div>
          <div className="w-32 text-sm text-muted-foreground">
            {percentage.toFixed(1)}% ({students} students)
          </div>
        </div>
      );
    })}
  </div>
  <p className="text-xs text-muted-foreground mt-2">
    Years 2033-2052: Maintain {get2032Percentage()}% utilization
  </p>
</div>
```

### Appendix D: Accessibility Checklist

- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works for all features
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Screen reader announces status changes
- [ ] Form validation messages are accessible
- [ ] Error states are clearly communicated
- [ ] Loading states are announced

---

## 360° Review Feedback - Addressed Issues

This section addresses all feedback from the Architecture Audit Agent's 360° review report.

### ✅ Major Issues - Resolved

#### 1. Progress Bar Implementation

**Issue:** No existing progress bar component in codebase.

**Resolution:** Use simple inline `div` with `width` style (Option A from review).

**Implementation:**

```tsx
// Simple inline progress bar (no new component needed)
<div className="h-2 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-accent-blue transition-all"
    style={{ width: `${percentage}%` }}
    aria-label={`${percentage.toFixed(1)}% utilization`}
  />
</div>
```

**Location:** `components/versions/curriculum/RampUpSection.tsx`

**Effort:** 1-2 hours (inline implementation)

#### 2. Edit Mode Approach

**Issue:** Unclear whether edit mode is inline or modal-based.

**Resolution:** **Inline editing** (matches current pattern in codebase).

**Implementation:**

- Edit mode expands inline within the card (replaces display content)
- Same pattern as current implementation (lines 1430-1675 in VersionDetail.tsx)
- No modal component needed
- Save/Cancel buttons appear at bottom of edit form

**Pattern:**

```tsx
{
  isEditing && editFormData ? (
    <div className="space-y-4">
      {/* Edit form fields */}
      <div className="flex gap-2">
        <Button onClick={handleSave}>Save</Button>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <div className="text-sm space-y-3">{/* Display mode */}</div>
  );
}
```

**Effort:** Already documented in plan

### ✅ Minor Issues - Resolved

#### 3. Badge Variant Fix

**Issue:** Plan used `Badge variant="success"` which doesn't exist.

**Resolution:** Use `variant="outline"` with custom className.

**Implementation:**

```tsx
// Required badge
<Badge variant="outline">Required</Badge>

// Enabled badge (green)
<Badge variant="outline" className="border-accent-green/50 text-accent-green">
  Enabled
</Badge>

// Disabled badge (muted)
<Badge variant="outline" className="border-muted text-muted-foreground">
  Disabled
</Badge>
```

**Effort:** 15 minutes (already fixed in plan)

#### 4. Type Definitions

**Issue:** Plan doesn't specify where types are defined.

**Resolution:** Create `components/versions/curriculum/types.ts` for shared types.

**Implementation:**

```typescript
// components/versions/curriculum/types.ts
import type { CurriculumPlan } from '@prisma/client';

export interface CurriculumCardProps {
  curriculumType: 'FR' | 'IB';
  plan: CurriculumPlan;
  isEditing: boolean;
  editFormData: EditFormData | null;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: () => void;
  canEdit: boolean;
  saving: boolean;
}

export interface EditFormData {
  capacity: number;
  tuitionBase: number;
  cpiFrequency: number;
  tuitionGrowthRate?: number;
  studentsPerTeacher?: number;
  studentsPerNonTeacher?: number;
  teacherMonthlySalary?: number;
  nonTeacherMonthlySalary?: number;
  rampUp?: {
    [year: number]: number; // year -> percentage (0-100)
  };
}

// Import in components:
import type { CurriculumCardProps, EditFormData } from './types';
```

**Effort:** 30 minutes

#### 5. Validation Rules - Detailed

**Issue:** Plan mentions validation but doesn't specify all rules.

**Resolution:** Document all validation rules.

**Validation Rules:**

| Field                          | Rules               | Error Message                                                                                            |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------- |
| **Capacity**                   | FR: > 0<br>IB: >= 0 | "Capacity must be greater than 0 for FR curriculum"<br>"Capacity must be 0 or greater for IB curriculum" |
| **Base Tuition**               | > 0                 | "Base tuition must be greater than 0"                                                                    |
| **CPI Frequency**              | 1, 2, or 3          | "CPI frequency must be 1, 2, or 3 years"                                                                 |
| **Tuition Growth Rate**        | 0-100% (0-1)        | "Tuition growth rate must be between 0% and 100%"                                                        |
| **Students per Teacher**       | > 0                 | "Students per teacher must be greater than 0"                                                            |
| **Students per Non-Teacher**   | > 0                 | "Students per non-teacher must be greater than 0"                                                        |
| **Teacher Monthly Salary**     | >= 0                | "Teacher monthly salary must be 0 or greater"                                                            |
| **Non-Teacher Monthly Salary** | >= 0                | "Non-teacher monthly salary must be 0 or greater"                                                        |
| **Ramp-Up Percentage**         | 0-100%              | "Ramp-up percentage must be between 0% and 100%"<br>Warning if > 100%: "Over 100% capacity!"             |

**Implementation:**

```typescript
function validateCurriculumPlan(
  data: EditFormData,
  curriculumType: 'FR' | 'IB'
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Capacity validation
  if (curriculumType === 'FR' && data.capacity <= 0) {
    errors.capacity = 'Capacity must be greater than 0 for FR curriculum';
  } else if (curriculumType === 'IB' && data.capacity < 0) {
    errors.capacity = 'Capacity must be 0 or greater for IB curriculum';
  }

  // Tuition validation
  if (data.tuitionBase <= 0) {
    errors.tuitionBase = 'Base tuition must be greater than 0';
  }

  // CPI Frequency validation
  if (![1, 2, 3].includes(data.cpiFrequency)) {
    errors.cpiFrequency = 'CPI frequency must be 1, 2, or 3 years';
  }

  // Ramp-up validation
  if (data.rampUp) {
    Object.entries(data.rampUp).forEach(([year, percentage]) => {
      if (percentage < 0 || percentage > 100) {
        errors[`rampUp.${year}`] = 'Ramp-up percentage must be between 0% and 100%';
      }
    });
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
```

**Effort:** 1 hour

#### 6. Error Recovery Flow

**Issue:** Plan doesn't specify what happens after validation errors.

**Resolution:** Inline error messages with disabled save button.

**Error Recovery Flow:**

1. **Validation on Input Change:**
   - Validate field immediately on blur/change
   - Show inline error message below input
   - Highlight input with red border: `border-destructive`

2. **Save Button State:**
   - Disable save button if any validation errors exist
   - Show tooltip: "Please fix validation errors before saving"

3. **Error Display:**

   ```tsx
   <div className="space-y-2">
     <Input className={errors.capacity ? 'border-destructive' : ''} {...props} />
     {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
   </div>
   ```

4. **Clear Errors:**
   - Errors clear automatically when field becomes valid
   - Save button enables when all errors resolved

**Effort:** 1-2 hours

#### 7. Test Cases - Specified

**Issue:** Plan mentions testing but doesn't specify test cases.

**Resolution:** Add comprehensive test cases.

**Test Cases:**

**Component Rendering:**

- ✅ CurriculumCard renders with correct props
- ✅ FR card shows blue accent colors
- ✅ IB card shows green accent colors
- ✅ Disabled IB card is grayed out
- ✅ Status badges display correctly

**Edit Mode:**

- ✅ Edit button toggles edit mode
- ✅ Edit form displays with current values
- ✅ Cancel button exits edit mode without saving
- ✅ Save button saves changes and exits edit mode

**Form Validation:**

- ✅ Capacity validation works (FR > 0, IB >= 0)
- ✅ Tuition validation works (> 0)
- ✅ CPI frequency validation works (1, 2, or 3)
- ✅ Ramp-up percentage validation works (0-100%)
- ✅ Error messages display correctly
- ✅ Save button disabled when errors exist

**IB Enable/Disable:**

- ✅ Checkbox toggles IB capacity (0 ↔ 200)
- ✅ IB card grays out when disabled
- ✅ Save persists IB state correctly

**Accessibility:**

- ✅ Keyboard navigation works (Tab, Enter, Escape)
- ✅ Screen reader announces all content
- ✅ Focus indicators visible
- ✅ ARIA labels present on all interactive elements

**Test Files:**

- `components/versions/curriculum/__tests__/CurriculumCard.test.tsx`
- `components/versions/curriculum/__tests__/RampUpSection.test.tsx`

**Effort:** 2-3 hours

#### 8. JSDoc Examples

**Issue:** Plan requires JSDoc but doesn't show examples.

**Resolution:** Add JSDoc examples for all components.

**JSDoc Format:**

````typescript
/**
 * CurriculumCard component displays curriculum plan information
 * with visual distinction for FR (blue) and IB (green) curricula.
 *
 * Supports inline editing mode with form validation and error handling.
 *
 * @param props - CurriculumCardProps containing plan data and callbacks
 * @param props.curriculumType - Type of curriculum ('FR' | 'IB')
 * @param props.plan - Curriculum plan data from database
 * @param props.isEditing - Whether component is in edit mode
 * @param props.editFormData - Form data when editing (null in display mode)
 * @param props.onEditStart - Callback to start editing
 * @param props.onEditCancel - Callback to cancel editing
 * @param props.onSave - Callback to save changes
 * @param props.canEdit - Whether user has permission to edit
 * @param props.saving - Whether save operation is in progress
 *
 * @returns JSX.Element - Card component with curriculum information
 *
 * @example
 * ```tsx
 * <CurriculumCard
 *   curriculumType="FR"
 *   plan={frPlan}
 *   isEditing={editingPlanId === frPlan.id}
 *   editFormData={editFormData}
 *   onEditStart={() => handleEditStart(frPlan)}
 *   onEditCancel={handleEditCancel}
 *   onSave={() => handleSave(frPlan.id)}
 *   canEdit={version.status === 'DRAFT'}
 *   saving={saving}
 * />
 * ```
 */
export function CurriculumCard(props: CurriculumCardProps): JSX.Element {
  // Component implementation
}
````

**Effort:** 1-2 hours

#### 9. Accordion Usage Decision

**Issue:** Plan mentions accordion but doesn't specify when to use.

**Resolution:** **Start with always-visible sections** (no accordion initially).

**Decision:**

- **Phase 1:** All sections always visible (simpler implementation)
- **Phase 2 (Enhancement):** Add accordion for sections if needed based on user feedback

**Rationale:**

- Simpler initial implementation
- All information immediately visible
- Can add accordion later if sections become too long

**If Accordion Needed Later:**

```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="basic">
    <AccordionTrigger>Basic Configuration</AccordionTrigger>
    <AccordionContent>{/* Basic config fields */}</AccordionContent>
  </AccordionItem>
  <AccordionItem value="staffing">
    <AccordionTrigger>Staffing Parameters</AccordionTrigger>
    <AccordionContent>{/* Staffing fields */}</AccordionContent>
  </AccordionItem>
</Accordion>
```

**Effort:** 1-2 hours (if implemented later)

#### 10. Type Import Source

**Issue:** Plan uses `CurriculumPlan` type but doesn't specify source.

**Resolution:** Import from Prisma client.

**Implementation:**

```typescript
// Import CurriculumPlan from Prisma client
import type { CurriculumPlan } from '@prisma/client';

// Or from service layer if extended:
import type { VersionWithRelations } from '@/services/version';
// Then use: version.curriculumPlans[0] (already typed)
```

**Effort:** 15 minutes

#### 11. Error Logging

**Issue:** Plan doesn't specify error logging.

**Resolution:** Log validation errors for debugging.

**Implementation:**

```typescript
function validateAndLog(data: EditFormData, curriculumType: 'FR' | 'IB') {
  const validation = validateCurriculumPlan(data, curriculumType);

  if (!validation.isValid) {
    console.error('Curriculum plan validation failed:', {
      curriculumType,
      errors: validation.errors,
      data,
    });
  }

  return validation;
}
```

**Effort:** 30 minutes

### Updated Implementation Timeline

**Pre-Implementation (2-4 hours):**

- [x] Clarify edit mode approach (inline) ✅
- [x] Fix badge variant (use `outline` with className) ✅
- [ ] Document all validation rules (1 hour)
- [ ] Add type definitions (30 minutes)
- [ ] Create types file (30 minutes)

**Implementation (21-30 hours):**

- Phase 1: Structure and Layout (4-6 hours)
- Phase 2: Information Organization (6-8 hours)
- Phase 3: Visual Enhancements (4-6 hours) - includes progress bar
- Phase 4: Design System Compliance (2-3 hours)
- Phase 5: Accessibility Improvements (2-3 hours)
- Phase 6: Testing and Refinement (3-4 hours)

**Post-Implementation (4-6 hours):**

- Component tests (2-3 hours)
- Accessibility tests (1 hour)
- Documentation updates (1 hour)

**Total Estimated Time:** **27-40 hours** (including all fixes)

---

## Review Questions

1. **Layout Structure:** Does the proposed card-based layout with separate FR/IB cards meet your expectations?

2. **Visual Distinction:** Are the accent colors (blue for FR, green for IB) appropriate?

3. **Information Organization:** Does the sectioned approach (Basic Config, Staffing, Ramp-Up) make sense?

4. **Ramp-Up Visualization:** Is the timeline with progress bars the right approach, or would you prefer a different visualization?

5. **Edit Mode:** Should edit mode be inline (expandable) or modal-based?

6. **IB Toggle:** Is moving the IB enable checkbox to the IB card header acceptable?

7. **Collapsible Sections:** Should sections be collapsible (accordion) or always visible?

8. **Timeline:** Is the 21-30 hour estimate acceptable for implementation?

---

## Approval

**Status:** ✅ **APPROVED WITH NOTES** (per 360° Review Report)

**Review Summary:**

- ✅ **Overall Assessment:** Well-aligned with existing patterns, ready for implementation
- ✅ **Major Issues:** All addressed (progress bar, edit mode)
- ✅ **Minor Issues:** All addressed (badge variant, types, validation, etc.)
- ✅ **Risk Level:** 🟢 LOW
- ✅ **No Blockers:** Ready to proceed

**Conditions Met:**

1. ✅ Edit mode clarified (inline editing)
2. ✅ Progress bar implementation specified (inline div)
3. ✅ Badge variant fixed (use `outline` with custom className)
4. ✅ Validation rules documented
5. ✅ Type definitions specified
6. ✅ Error recovery flow documented
7. ✅ Test cases specified
8. ✅ JSDoc examples provided

**Next Steps:**

1. ✅ Review feedback addressed
2. ✅ Implementation plan updated
3. ⏳ Begin implementation (Phase 1: Structure and Layout)
4. ⏳ Follow implementation phases as documented

**Implementation Ready:** ✅ Yes - All clarifications addressed

---

**Document End**

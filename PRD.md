# 🧾 School Relocation Planner — Product Requirements Document (PRD)

**Version:** 1.4  
**Last Updated:** November 13, 2025  
**Target Launch:** Q1 2026 (to support 2028 relocation)  
**Planning Horizon:** 2023-2052 (30 years)  
**Timezone:** Asia/Riyadh

---

## Project Metadata

```yaml
meta:
  product: School Relocation Planner
  timezone: Asia/Riyadh
  planning_horizon: [2023, 2052]
  relocation_year: 2028
  historical_years: [2023, 2024]
  transition_years: [2025, 2026, 2027]
  new_campus_start: 2028
  curricula: [French, IB]
  curriculum_codes: [FR, IB]
  rent_models: [FixedEscalation, RevenueShare, PartnerModel]
  capex_classes: [Building, FF&E, IT, Other]
  performance_target_ms: 50
  ui_framework: Next.js 16 + Tailwind v4 + shadcn/ui + Framer Motion
  design_language: "Neo-Minimal, Data-Centric, Accessible, Adaptive"
```

## Glossary

- **2024A**: Actual data for year 2024 (locked historical record)
- **FR**: French curriculum code
- **IB**: International Baccalaureate curriculum code
- **FixedEscalation**: Rent model with fixed annual escalation rate
- **RevenueShare**: Rent model based on percentage of revenue
- **PartnerModel**: Rent model based on partner yield calculation
- **FF&E**: Furniture, Fixtures & Equipment
- **BUA**: Built-Up Area (total constructed floor area in square meters)
- **CPI**: Consumer Price Index (inflation measure)
- **EBITDA**: Earnings Before Interest, Taxes, Depreciation, and Amortization
- **NPV**: Net Present Value

---

## 0. Executive Summary

### Vision
Create a world-class, **rent-driven financial planning application** that empowers school administrators to make data-driven decisions about the school's 2028 relocation by modeling dual-curriculum scenarios, evaluating three distinct rent models, and simulating tuition adjustments to maintain target financial performance.

### Core Model Principle

**Rent-Centric Planning:** Rent is the **MOST IMPORTANT** decision variable. The financial model evaluates different rent scenarios (FixedEscalation, RevenueShare, PartnerModel) to understand their long-term impact. Tuition is adjusted **manually** by users—there is NO automatic calculation linking rent to tuition. Users independently decide tuition strategy based on rent model outcomes.

**Key Planning Periods:**
- **2025-2027 (Transition)**: Rent stays constant (cloned from 2024A actual), limited planning focus
- **2028-2032 (Ramp-Up)**: New campus opens, gradual capacity fill-up, rent models highly effective
- **2033-2052 (Full Capacity)**: School runs at full capacity, steady-state operations

**NPV Focus:** Financial analysis prioritizes the **25-year post-relocation period (2028-2052)** where rent model selection has maximum impact.

---

## ⚠️ CRITICAL BUSINESS RULES

**These rules are fundamental to the system's logic and must be strictly followed:**

### 1. Rent is the Primary Decision Variable
- Rent is the **MOST IMPORTANT** component of the financial model
- The primary goal is to evaluate and compare different rent models (FixedEscalation, RevenueShare, PartnerModel)
- All financial analysis focuses on understanding the long-term impact of rent model selection

### 2. Tuition and Rent are INDEPENDENT
- **NO automatic calculation linking rent to tuition**
- Tuition has its own growth logic: **CPI-based automatic growth** based on frequency (1, 2, or 3 years)
- Revenue = Tuition × Students (automatic calculation)
- Users set:
  - **Base tuition** (starting point per curriculum)
  - **Students** (enrollment projections per year)
  - **CPI frequency** (1, 2, or 3 years between adjustments)
- There is NO "required tuition" calculation based on rent model selection
- Users independently decide tuition strategy after evaluating rent model outcomes
- The Tuition Simulator allows users to adjust **base tuition** and see financial impact, NOT calculate "required tuition from rent"

### 3. Critical Planning Periods
- **2025-2027 (Transition)**: Rent fixed at 2024A level, minimal planning focus
- **2028-2032 (Ramp-Up)**: **CRITICAL PERIOD** - New campus, gradual capacity fill-up, rent models highly effective for decision-making
- **2033-2052 (Full Capacity)**: School runs at 100% capacity, steady-state operations

### 4. Capacity Ramp-Up Logic (2028-2032) - Curriculum-Specific
- **Different ramp-up profiles per curriculum** (FR vs IB):

**French Curriculum (FR):**
- **Already established school** moving to new campus
- May start 2028 with **higher initial capacity utilization** (e.g., 70-80%)
- Gradual growth to 100% capacity by 2032
- Example trajectory: 2028 (75%) → 2029 (85%) → 2030 (90%) → 2031 (95%) → 2032 (100%)

**IB Curriculum (IB):**
- **Brand new program starting in 2028**
- Starts from **zero or very low enrollment** (e.g., 0-20%)
- Gradual ramp-up as program establishes and gains students
- Example trajectory: 2028 (15%) → 2029 (30%) → 2030 (50%) → 2031 (75%) → 2032 (100%)

**After 2032:**
- Assumption: **100% capacity utilization** for BOTH curricula
- Students ≈ capacity for steady-state financial projections

### 5. NPV Calculation Period
- NPV calculations focus on **25-year post-relocation period (2028-2052)**
- This is where rent model selection has maximum financial impact
- Historical (2023-2024) and transition (2025-2027) periods are context, not decision focus

---

## 📊 Planning Periods Visual Summary

```
Timeline: 2023 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2052

┌──────────────┬──────────────────┬──────────────────────┬──────────────────────────────────┐
│  Historical  │   Transition     │    Ramp-Up           │       Full Capacity              │
│  2023-2024   │   2025-2027      │    2028-2032         │       2033-2052                  │
├──────────────┼──────────────────┼──────────────────────┼──────────────────────────────────┤
│              │                  │                      │                                  │
│ ✓ Locked     │ ⚠️ Fixed Rent    │ 🎯 CRITICAL PERIOD   │ ✅ Steady State                  │
│   Actuals    │   (2024A)        │   New Campus Opens   │   100% Capacity                  │
│              │                  │   Gradual Fill-Up    │   Full Operations                │
│              │                  │   60%→100% Capacity  │                                  │
│              │                  │                      │                                  │
│ Planning:    │ Planning:        │ Planning:            │ Planning:                        │
│ Reference    │ Limited          │ HIGHLY EFFECTIVE     │ Long-term                        │
│ Only         │ (Rent Fixed)     │ Rent Model Impact    │ Sustainability                   │
│              │                  │                      │                                  │
│ Rent:        │ Rent:            │ Rent:                │ Rent:                            │
│ Actual       │ = 2024A          │ FixedEscalation OR   │ Continued                        │
│ Data         │ (cloned)         │ RevenueShare OR      │ Application                      │
│              │                  │ PartnerModel         │ of Model                         │
│              │                  │                      │                                  │
│ Focus:       │ Focus:           │ Focus:               │ Focus:                           │
│ Minimal      │ Minimal          │ ⭐ MAXIMUM ⭐         │ High                             │
│              │                  │                      │                                  │
└──────────────┴──────────────────┴──────────────────────┴──────────────────────────────────┘
                                  │◄────── NPV Period (25 years) ──────────────────────────►│
                                  │        Primary Decision Focus                          │
                                  └─────────────────────────────────────────────────────────┘

Key Insights:
• 2028-2032: Rent model selection HIGHLY EFFECTIVE - this is when decisions matter most
• 2028-2052: 25-year NPV period - primary focus for financial analysis
• Capacity ramp-up is CURRICULUM-SPECIFIC:
  - French (FR): Already established, starts high (70-80%) → 100%
  - IB: Brand new program, starts low (0-20%) → 100%
• Revenue = Tuition × Students (automatic calculation with CPI-based tuition growth)
• Tuition growth is INDEPENDENT of rent (CPI frequency: 1, 2, or 3 years)
• Users set: base tuition, students enrollment, CPI frequency
```

---

### Problem Statement
The school needs to relocate by 2028 and must evaluate complex financial scenarios across:
- **Two curricula** (French and International Baccalaureate) with independent enrollment, tuition, and staffing
- **Multiple rent models** (fixed escalation, revenue share, partner yield)
- **30-year financial projections** (2023-2052) with historical actuals, transition planning, and long-term forecasting
- **Dynamic cost structures** including CPI-adjusted salaries, auto-reinvesting capex, and revenue-based opex

Current methods (spreadsheets, manual calculations) cannot handle this complexity, leading to errors, inefficiency, and limited scenario planning.

### Solution
A purpose-built, high-performance web application that provides:
- **Dual-curriculum modeling** (FR, IB) with independent planning and aggregated financials
- **Three specialized rent models** (FixedEscalation, RevenueShare, PartnerModel) for evaluating post-relocation scenarios
- **Rent-centric financial analysis** with focus on 25-year post-relocation period (2028-2052)
- **Manual tuition exploration tool** to view financial impact of tuition adjustments (NO automatic calculation)
- **Capacity ramp-up modeling** (2028-2032) to plan gradual enrollment growth
- **Version-based scenario planning** with cloning, comparison, and simulation
- **Sub-50ms calculation performance** for real-time financial modeling
- **Professional reporting** for board presentations and stakeholder meetings
- **Role-based governance** (Admin, Planner, Viewer) with comprehensive audit trails

---

## 1. Design Philosophy

> *A world-class, chart-driven financial intelligence platform with razor-sharp aesthetics, built for data-intensive decision-making.*

### Design Vision

**Modern Financial Command Center:** Inspired by Bloomberg Terminal, Figma, and Linear—combining financial data density with consumer-grade UX polish. Every pixel serves a purpose. Every interaction feels instantaneous. Every chart tells a story.

**Chart-First Mentality:** Data visualization is not an afterthought—it's the primary interface. Numbers are secondary; visual patterns drive insights.

### Core Principles

1. **Data-Centric Visual Hierarchy**
   - Charts and graphs take center stage (60% of screen real estate)
   - Typography optimized for scanning large datasets
   - Progressive disclosure: Show summaries, reveal details on demand
   - Years-as-columns orientation for financial projections
   - Sticky headers and intelligent scrolling for large tables

2. **Sharp, Modern Aesthetics**
   - **Depth & Layering:** Subtle shadows and elevation create spatial hierarchy
   - **Glassmorphism:** Frosted glass effects for overlays and modals (8-12% opacity)
   - **Smooth Borders:** 8-12px border radius for cards, 4-6px for buttons
   - **Precise Spacing:** 8px grid system for perfect alignment
   - **High Contrast:** Intentional use of contrast for data focus

3. **Intelligent Interactions**
   - **Predictive:** Autocomplete, smart defaults, contextual suggestions
   - **Responsive:** Sub-50ms feedback on every interaction
   - **Forgiving:** Undo/redo everywhere, auto-save drafts
   - **Keyboard-First:** Full keyboard navigation with visible shortcuts
   - **Haptic Feedback:** Subtle animations that guide user attention

4. **Zero Cognitive Load**
   - **Progressive Complexity:** Simple by default, powerful when needed
   - **Contextual Help:** Inline tooltips, hover cards with calculations
   - **Visual Affordances:** Clear states (hover, active, disabled, loading)
   - **Smart Validation:** Prevent errors before they happen
   - **Consistent Patterns:** Same interaction model across all pages

5. **Performance as Design**
   - Every chart animates in smoothly (no flickering)
   - Loading states that don't feel like waiting
   - Optimistic UI updates (don't wait for server)
   - Skeleton screens (not spinners) for content loading
   - Virtual scrolling for 1000+ row tables

---

### Color System

**Dark Mode Primary** (default theme for power users)

```yaml
dark_mode:
  # Base Colors
  background_primary: "#0A0C0E"          # Deep black (main canvas)
  background_secondary: "#14161A"        # Elevated surfaces (cards)
  background_tertiary: "#1C1F26"         # Nested cards, sidebars
  
  # Surface Colors (with subtle gradients)
  surface_glass: "rgba(255,255,255,0.03)"  # Frosted glass overlay
  surface_hover: "rgba(255,255,255,0.05)"  # Hover state
  surface_active: "rgba(255,255,255,0.08)" # Active/pressed state
  
  # Border Colors
  border_subtle: "rgba(255,255,255,0.08)"  # Dividers, cards
  border_medium: "rgba(255,255,255,0.12)"  # Inputs, buttons
  border_strong: "rgba(255,255,255,0.20)"  # Focus states
  
  # Text Colors (optimized for readability)
  text_primary: "#F5F5F7"      # Main text (≥7:1 contrast)
  text_secondary: "#A0A0A8"    # Secondary text (≥4.5:1 contrast)
  text_tertiary: "#6E6E78"     # Disabled, placeholder
  text_inverse: "#0A0C0E"      # Text on light backgrounds
  
  # Accent Colors (data visualization palette)
  accent_primary: "#0E7EFF"    # Primary blue (links, CTAs)
  accent_hover: "#2B8FFF"      # Hover state
  accent_pressed: "#0866D6"    # Active state
  
  # Semantic Colors (financial data)
  success: "#00D77F"           # Positive values, growth, profit
  warning: "#FFB800"           # Caution, thresholds, attention
  critical: "#FF5C5C"          # Negative values, losses, danger
  info: "#00B8F5"              # Informational, neutral data
  
  # Chart Colors (8-color palette for multi-line charts)
  chart_1: "#0E7EFF"  # Primary blue
  chart_2: "#00D77F"  # Success green
  chart_3: "#FF5C5C"  # Critical red
  chart_4: "#FFB800"  # Warning amber
  chart_5: "#A855F7"  # Purple
  chart_6: "#00B8F5"  # Cyan
  chart_7: "#F59E0B"  # Orange
  chart_8: "#EC4899"  # Pink
  
  # Gradient Overlays (for charts and cards)
  gradient_blue: "linear-gradient(135deg, #0E7EFF 0%, #2B8FFF 100%)"
  gradient_green: "linear-gradient(135deg, #00D77F 0%, #00F593 100%)"
  gradient_red: "linear-gradient(135deg, #FF5C5C 0%, #FF7070 100%)"
  
  # Shadows (depth and elevation)
  shadow_sm: "0 1px 2px rgba(0,0,0,0.3)"
  shadow_md: "0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)"
  shadow_lg: "0 12px 24px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)"
  shadow_xl: "0 24px 48px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4)"
  
  # Data-Specific Colors
  rent_color: "#F59E0B"        # Orange for rent costs
  revenue_color: "#00D77F"     # Green for revenue
  staff_color: "#A855F7"       # Purple for staff costs
  capex_color: "#FF5C5C"       # Red for capital expenses
  opex_color: "#00B8F5"        # Cyan for operating expenses
  ebitda_color: "#FFB800"      # Amber for EBITDA
```

**Light Mode** (secondary theme for board presentations)

```yaml
light_mode:
  background_primary: "#FFFFFF"
  background_secondary: "#F9FAFB"
  background_tertiary: "#F3F4F6"
  
  text_primary: "#0A0C0E"
  text_secondary: "#4B5563"
  text_tertiary: "#9CA3AF"
  
  # Colors adjusted for light background
  accent_primary: "#0066CC"
  success: "#00B068"
  warning: "#D97706"
  critical: "#DC2626"
  
  shadow_sm: "0 1px 2px rgba(0,0,0,0.06)"
  shadow_md: "0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)"
```

**Theme Toggle:**
- System auto-detect by default
- Manual toggle in user menu (top right)
- Preference saved per user
- Smooth transition animation (300ms)

---

### Typography System

**Font Stack**

```yaml
fonts:
  text_primary:
    family: "Inter Variable"
    weights: [400, 500, 600, 700]
    usage: "UI text, labels, paragraphs, headers"
    features: "tabular-nums, -webkit-font-smoothing: antialiased"
    
  text_monospace:
    family: "JetBrains Mono Variable"
    weights: [400, 500, 600]
    usage: "Numbers, currency, dates, code, data tables"
    features: "tabular-nums, font-variant-numeric: tabular-nums"
    
  text_display:
    family: "Inter Variable"
    weights: [700, 800]
    usage: "Hero text, page titles, large numbers"
    letter_spacing: "-0.02em"

type_scale:
  # Display
  display_xl: "72px / 1.1 / 800"    # Hero numbers
  display_lg: "60px / 1.1 / 700"    # Large KPI cards
  display_md: "48px / 1.2 / 700"    # Page headers
  
  # Headings
  heading_xl: "36px / 1.3 / 600"    # Section headers
  heading_lg: "30px / 1.3 / 600"    # Card headers
  heading_md: "24px / 1.4 / 600"    # Sub-section headers
  heading_sm: "20px / 1.4 / 600"    # Small headers
  
  # Body Text
  body_xl: "18px / 1.6 / 400"       # Large body text
  body_lg: "16px / 1.6 / 400"       # Default body text
  body_md: "14px / 1.5 / 400"       # Small body text
  body_sm: "12px / 1.5 / 400"       # Captions, labels
  
  # Data Text (monospace)
  data_xl: "24px / 1.2 / 600"       # Large data values
  data_lg: "18px / 1.2 / 500"       # Default data values
  data_md: "14px / 1.2 / 500"       # Table cells
  data_sm: "12px / 1.2 / 400"       # Small data labels

formatting:
  currency:
    format: "SAR 1,234,567.89"
    font: "JetBrains Mono"
    alignment: "right"
    decimals: 2
    
  percentage:
    format: "12.34%"
    font: "JetBrains Mono"
    decimals: 2
    color_coding: true (green if positive, red if negative for change %)
    
  large_numbers:
    format: "1.23M" or "1,234,567"
    suffix: "K (thousands), M (millions), B (billions)"
    hover: "Show full number in tooltip"
```

---

### Chart Design System

**Chart Philosophy:** Every chart should be immediately readable, visually stunning, and tell a story at a glance.

**Chart Components**

```yaml
chart_design:
  grid_lines:
    color: "rgba(255,255,255,0.05)"  # Subtle, non-distracting
    style: "dashed"
    width: "1px"
    
  axes:
    color: "rgba(255,255,255,0.12)"
    labels:
      font: "Inter"
      size: "12px"
      color: "#A0A0A8"
      
  legends:
    position: "top-right"
    interactive: true (click to toggle series)
    font: "Inter"
    size: "13px"
    
  tooltips:
    background: "rgba(20,22,26,0.95)"  # Dark with slight transparency
    backdrop_filter: "blur(12px)"       # Glassmorphism
    border: "1px solid rgba(255,255,255,0.12)"
    border_radius: "8px"
    padding: "12px 16px"
    shadow: "shadow_lg"
    font: "JetBrains Mono"
    animation: "fade-in 150ms ease-out"
    
  data_points:
    size: "6px" (default), "8px" (hover)
    hover_effect: "scale 1.5, glow"
    animation: "smooth transition 200ms"
    
  lines:
    width: "2.5px" (default), "3.5px" (active)
    curve: "monotoneX" (smooth curves)
    animation: "draw-in 800ms ease-out"
    
  bars:
    border_radius: "4px 4px 0 0"  # Rounded top
    gap: "8px"
    hover_effect: "brighten 10%"
    animation: "grow-up 600ms ease-out"
    
  areas:
    opacity: "0.15" (default), "0.25" (hover)
    gradient: true (fade from solid to transparent)
```

**Chart Types & Use Cases**

```yaml
chart_types:
  line_chart:
    use_case: "Trends over time (Revenue, EBITDA, Rent)"
    best_practices:
      - Max 5 lines per chart (avoid clutter)
      - Different line styles (solid, dashed, dotted) for comparison
      - Gradient area fill for emphasis
      - Y-axis starts at 0 for absolute values
      - Interactive legend to show/hide series
      
  bar_chart:
    use_case: "Period-over-period comparisons, categorical data"
    best_practices:
      - Horizontal bars for long labels
      - Vertical bars for time series
      - Grouped bars for multi-series
      - Gradient fills for visual appeal
      
  area_chart:
    use_case: "Cumulative values, cost breakdown over time"
    best_practices:
      - Stacked areas for composition
      - Subtle gradients (top: opaque, bottom: transparent)
      - Clear layer separation with contrasting colors
      
  combo_chart:
    use_case: "Multiple metrics with different scales (e.g., EBITDA bars + margin % line)"
    best_practices:
      - Bars on primary axis, line on secondary axis
      - Clear dual-axis labels
      - Color-coded to avoid confusion
      
  heatmap:
    use_case: "Sensitivity analysis, multi-dimensional comparisons"
    best_practices:
      - Diverging color scale (red → yellow → green)
      - Cell annotations for exact values
      - Hover tooltips for details
      
  waterfall_chart:
    use_case: "Cash flow analysis, bridge charts"
    best_practices:
      - Color-coded: green (positive), red (negative), blue (total)
      - Connectors between bars
      - Clear labeling of starting/ending points
      
  sparklines:
    use_case: "Inline mini-charts for tables, KPI cards"
    best_practices:
      - No axes or labels (just trend visualization)
      - Small footprint (40-80px height)
      - Subtle colors
      - Responsive to hover (show tooltip)
```

**Chart Interactions**

```yaml
interactions:
  hover:
    - Show detailed tooltip with exact values
    - Highlight hovered element (brighten, scale up)
    - Dim other elements slightly for focus
    - Cross-hair cursor for precise selection
    
  click:
    - Drill down to detailed view
    - Toggle series visibility (on legend click)
    - Select data point for comparison
    
  zoom:
    - Scroll to zoom in/out on time axis
    - Double-click to reset zoom
    - Pinch-to-zoom on touch devices
    
  brush_selection:
    - Click and drag to select date range
    - Update all charts based on selection
    - Show "Reset Selection" button
```

---

### Component Library Principles

**Atomic Design Approach**

```yaml
component_hierarchy:
  atoms:
    - Button (primary, secondary, ghost, destructive)
    - Input (text, number, date, currency)
    - Icon (Lucide React, 16px, 20px, 24px)
    - Badge (status, role, tag)
    - Tooltip
    - Skeleton (loading state)
    
  molecules:
    - Form Field (label + input + error)
    - KPI Card (label + value + change indicator + sparkline)
    - Data Cell (table cell with formatting)
    - Chart Legend Item
    - Dropdown Menu
    
  organisms:
    - Navigation Bar (top nav)
    - Sidebar (parameter groups)
    - Data Table (virtualized, sortable, filterable)
    - Chart Container (chart + toolbar + legend)
    - Modal Dialog
    - Comparison Panel
    
  templates:
    - 3-column layout (left: params, center: charts, right: comparison)
    - Dashboard grid (KPI cards + charts)
    - Form wizard (multi-step)
    - Report layout (header + sections + charts)
```

**Component States**

```yaml
interaction_states:
  default:
    border: "border_subtle"
    background: "surface_glass"
    
  hover:
    border: "border_medium"
    background: "surface_hover"
    cursor: "pointer"
    transition: "150ms ease-out"
    
  active:
    border: "border_strong"
    background: "surface_active"
    scale: "0.98"
    
  focus:
    border: "accent_primary"
    outline: "2px solid rgba(14, 126, 255, 0.3)"
    outline_offset: "2px"
    
  disabled:
    opacity: "0.4"
    cursor: "not-allowed"
    pointer_events: "none"
    
  loading:
    cursor: "wait"
    animation: "shimmer or spinner"
```

---

### Animation & Motion

**Animation Principles**

```yaml
animation:
  philosophy: "Animations guide attention, provide feedback, and create delight—never distract"
  
  timing_functions:
    ease_out: "cubic-bezier(0.16, 1, 0.3, 1)"      # Snappy exit
    ease_in_out: "cubic-bezier(0.4, 0, 0.2, 1)"    # Smooth both directions
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)" # Playful bounce
    
  durations:
    instant: "100ms"    # Icon changes, toggles
    fast: "150ms"       # Hover effects, focus rings
    normal: "250ms"     # Modals, dropdowns, page transitions
    slow: "400ms"       # Chart animations, large movements
    chart: "800ms"      # Chart line/bar draw-in
    
  animation_types:
    fade:
      in: "opacity 0 → 1"
      out: "opacity 1 → 0"
      
    slide:
      in: "translateY(20px) → 0, opacity 0 → 1"
      out: "translateY(-20px), opacity 1 → 0"
      
    scale:
      in: "scale(0.95) → 1, opacity 0 → 1"
      out: "scale(0.95), opacity 1 → 0"
      
    shimmer:
      loading: "gradient position animates left to right"
      duration: "1.5s infinite"
      
    number_count_up:
      trigger: "On KPI value change"
      duration: "800ms"
      easing: "ease-out"
      
    chart_draw_in:
      trigger: "On chart mount or data change"
      duration: "800ms"
      easing: "ease-out"
      stagger: "50ms per series"
```

**Micro-Interactions**

```yaml
micro_interactions:
  button_press:
    - Scale down to 0.98
    - Slight shadow reduction
    - Haptic feedback (if supported)
    
  input_focus:
    - Border color animates to accent
    - Label moves/scales (floating label)
    - Helper text fades in
    
  data_change:
    - Flash green (increase) or red (decrease)
    - Number counts up/down to new value
    - Sparkline updates with smooth transition
    
  validation_error:
    - Shake animation (3-5px horizontal)
    - Border turns red
    - Error message slides in below
    
  success_action:
    - Checkmark icon animates (draw-in)
    - Toast slides in from top-right
    - Optional confetti (major actions only)
    
  drag_and_drop:
    - Element lifts (shadow increases)
    - Drop zones highlight
    - Smooth snap-to-grid
```

---

### Layout & Spacing

**8px Grid System**

```yaml
spacing_scale:
  0: "0px"
  1: "4px"      # Tight spacing (icon padding)
  2: "8px"      # Small spacing (between related items)
  3: "12px"     # Default spacing (form fields)
  4: "16px"     # Medium spacing (card padding)
  5: "24px"     # Large spacing (section gaps)
  6: "32px"     # Extra large spacing (page sections)
  7: "48px"     # Huge spacing (major sections)
  8: "64px"     # Enormous spacing (page margins)
  
container_max_widths:
  sm: "640px"
  md: "768px"
  lg: "1024px"
  xl: "1280px"
  2xl: "1536px"
  full: "100%"
```

**Responsive Breakpoints**

```yaml
breakpoints:
  mobile: "< 640px"      # Minimal support (read-only reports)
  tablet: "640px - 1024px"   # Partial support (view-only, basic charts)
  desktop: "1024px - 1920px" # Full support (primary target)
  wide: "> 1920px"        # Ultra-wide support (show more data)
```

---

### Accessibility (WCAG 2.1 AA+)

```yaml
accessibility:
  color_contrast:
    - Text: ≥ 4.5:1 for normal text, ≥ 7:1 for financial data
    - Icons: ≥ 3:1 against background
    - Charts: Color + pattern (not color alone)
    
  keyboard_navigation:
    - All interactive elements focusable
    - Tab order follows visual hierarchy
    - Focus rings visible (2px solid accent)
    - Keyboard shortcuts for common actions
    - Skip navigation links
    
  screen_readers:
    - ARIA labels on all interactive elements
    - Live regions for dynamic content
    - Table headers properly associated
    - Chart data accessible via table fallback
    
  reduced_motion:
    - Respect prefers-reduced-motion
    - Disable animations, use instant transitions
    - Keep essential feedback (color changes)
```

---

### Design Inspiration & References

**World-Class Interfaces We Emulate:**
- **Bloomberg Terminal** - Data density, professional feel
- **Linear** - Sharp aesthetics, smooth animations, dark mode excellence
- **Figma** - Intuitive interactions, performance, clean UI
- **Stripe Dashboard** - Clear data visualization, elegant design
- **Vercel Dashboard** - Modern, fast, beautiful charts
- **Notion** - Flexible, keyboard-friendly, delightful UX

**Chart Libraries:**
- **Recharts** - React-native, composable, customizable
- **Tremor** - Built for data-heavy dashboards, great defaults
- **Chart.js** - Powerful, performant, extensive options

---

### Implementation Checklist

- [ ] Dark mode as default theme with smooth toggle
- [ ] Inter Variable + JetBrains Mono fonts loaded
- [ ] 8-color chart palette implemented
- [ ] All semantic colors (success, warning, critical) applied
- [ ] Glassmorphism effects on modals and overlays
- [ ] Framer Motion integrated for animations
- [ ] All charts use consistent design tokens
- [ ] Hover states, focus rings, and interactions polished
- [ ] Skeleton loading states for all async content
- [ ] Number count-up animations on KPI changes
- [ ] Responsive layout tested at all breakpoints
- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation fully functional

---

## 2. Goals & Success Metrics

### Primary Goals
1. **Decision Support**: Enable informed relocation decision by Q4 2026 using data-driven rent/tuition modeling
2. **Performance**: Sub-50ms calculation response for real-time scenario exploration
3. **Transparency**: Provide clear 30-year financial projections across dual curricula
4. **Efficiency**: Reduce scenario analysis time from weeks to hours
5. **Governance**: Full audit trail and role-based access control

### Success Metrics (KPIs)

**Performance Targets:**
- Calculation response time: **< 50 ms**
- Report generation: **< 5 seconds** (30-year horizon)
- UI interaction response: **< 50 ms** (excluding network latency)
- Page load time: **< 2 seconds**

**User Productivity:**
- Time to create complete scenario: **< 30 minutes**
- Number of scenarios evaluated: **10+ versions** with comparisons
- User satisfaction score: **> 4.5/5**
- Learning curve: New users productive within **1 hour**

**Adoption & Impact:**
- 100% of finance team actively using the tool
- 50%+ time savings vs. spreadsheets
- Zero calculation errors in production
- Decision confidence: 90% of stakeholders feel confident in recommendations

---

## 3. User Personas & Roles

### Role-Based Access Control

```yaml
roles:
  ADMIN:
    - Manage global CPI, interest, discount, inflation, validation rules
    - Configure base salaries (teacher/non-teacher, FR/IB)
    - Approve, lock, or archive versions
    - Enter/import historical actuals (2023-2024)
    - Manage users and permissions
    - View system audit logs
    
  PLANNER:
    - Create and clone versions
    - Input curriculum data (capacity, students, tuition)
    - Configure rent models and parameters
    - Input staffing ratios (teacher_ratio, non_teacher_ratio)
    - Model capex and opex
    - Run tuition simulations
    - Generate reports
    - Validate and submit for approval
    
  VIEWER:
    - Read-only access to all versions and reports
    - View dashboards and comparisons
    - Export reports
    - Cannot create or modify data
```

### Primary Users

#### 1. Chief Financial Officer (CFO) - **ADMIN Role**
- **Needs**: High-level comparisons, rent model evaluation, tuition impact analysis, board presentations
- **Pain Points**: Balancing enrollment growth with rent commitments, justifying tuition increases, managing dual-curriculum complexity
- **Technical Proficiency**: Medium
- **Use Frequency**: Weekly during evaluation period (2025-2026), monthly monitoring (2027+)
- **Key Features**: Version comparison, tuition simulator, NPV analysis, executive reports

#### 2. Finance Manager / Controller - **PLANNER Role**
- **Needs**: Detailed scenario modeling, accurate projections, version control, sensitivity analysis
- **Pain Points**: Manual calculations in spreadsheets, reconciling dual-curriculum data, rent model complexity, keeping track of CPI adjustments
- **Technical Proficiency**: High
- **Use Frequency**: Daily during scenario planning, weekly during monitoring
- **Key Features**: Version creation/cloning, rent lens, capex/opex modeling, validation tools

#### 3. Principal / Academic Director - **PLANNER or VIEWER Role**
- **Needs**: Understanding enrollment capacity constraints, tuition positioning, curriculum-specific financials
- **Pain Points**: Translating financial models to academic planning, capacity planning per curriculum
- **Technical Proficiency**: Medium
- **Use Frequency**: Monthly during planning cycles
- **Key Features**: Curriculum split view, capacity vs. students tracking, tuition trends

#### 4. Board Members / Stakeholders - **VIEWER Role**
- **Needs**: Clear visualizations, executive summaries, understand financial trade-offs, rent vs. tuition relationship
- **Pain Points**: Understanding complex financial models, comparing scenarios, grasping 30-year implications
- **Technical Proficiency**: Low to Medium
- **Use Frequency**: Quarterly during board meetings
- **Key Features**: Dashboards, comparison reports, PDF exports, presentation mode

---

## 4. App Layout & Navigation

```yaml
layout:
  top_nav: [Overview, Versions, Tuition Simulator, Compare, Reports, Admin]
  breadcrumbs: enabled
  theme: light/dark + system auto
  loading_state: shimmer skeleton + Lottie micro-loader
  transitions: 120ms fade-slide
  keyboard_shortcuts: enabled (Cmd+K command palette)
```

### 4.1 Overview Page (`/`)

**Purpose:** Dashboard home with quick access to all features

**Components:**
- **Hero Banner**: Blurred background, logo watermark, quick actions
- **Status Cards**: 
  - Total versions (Draft/Ready/Locked/Archived)
  - Validation issues requiring attention
  - Recent activity timeline
- **Mini Compare**: Sparkline charts showing Revenue, Rent %, EBITDA, Cash Flow trends across recent versions
- **Quick Actions**:
  - "Create New Version" (primary CTA)
  - "Tuition Simulator" (secondary CTA)
  - "Compare Versions"
  - "View Latest Report"
- **Recent Versions**: Last 5 accessed versions with status badges

### 4.2 Versions Page (`/versions`)

**Purpose:** Master list of all financial scenarios/versions

**Features:**
- **List View**: All versions with columns:
  - Name
  - Status badge (Draft/Ready/Locked/Archived)
  - Created by
  - Last modified (relative time)
  - Key metrics preview (Revenue, EBITDA)
  - Actions menu (Edit, Clone, Archive, Export)
- **Filters**: 
  - Status (Draft/Ready/Locked/Archived)
  - Curriculum (FR/IB/Both)
  - Date range
  - Created by (user)
- **Sort**: Name, Date, Status
- **Actions**:
  - "Create New Version" button
  - Bulk actions: Compare selected, Export selected, Archive selected
- **Click behavior**: Click version row → navigate to `/versions/[id]` (version detail page)

**Version Cloning:**
- "Clone Version" button creates new Draft version
- Copies all data: curriculum plans, rent plans, capex, opex
- Excludes: audit logs, approval history, tuition simulations
- User can modify cloned version independently
- Use case: Create scenarios from baseline version

### 4.3 Version Detail Page (`/versions/[id]`)

**Purpose:** Detailed view and edit interface for a specific financial scenario

**Tab Navigation:**
1. Overview
2. Curriculum
3. Costs Analysis
4. Capex
5. Opex
6. Tuition Sim
7. Reports

#### Tab 1: Overview

**Components:**
- **Status Banner**: Draft/Ready/Locked status with color coding
- **Version Metadata**: Name, created by, last modified, description
- **Approval Workflow**: Submit for approval, approval history, lock/unlock (Admin only)
- **Summary Metrics Cards**:
  - Total Revenue (30-year sum)
  - Total Rent (30-year sum)
  - Average EBITDA Margin %
  - Rent Load % (rent as % of revenue)
  - NPV of Rent
- **Quick Charts**:
  - Revenue trend (FR + IB aggregated)
  - Rent vs. Revenue over time
  - EBITDA trend
  - Cash flow projection
- **Validation Status**: Pass/fail indicators for business rules
- **Actions**: Clone, Export, Delete (if Draft)

#### Tab 2: Curriculum

**Purpose:** Dual-curriculum planning interface

**UI Pattern:** Split Tabs + Aggregate Totals

```yaml
component: CurriculumSplitView
layout:
  left_tab: French (FR) with 🇫🇷 flag icon
  right_tab: IB with 🌍 icon
  bottom_section: Aggregated Financial Summary
```

**Per-Curriculum Inputs (Year-by-Year Table, 2023-2052):**
- **Capacity**: Total student capacity
- **Students**: Enrolled students (must be ≤ capacity)
- **Tuition**: Annual tuition per student
- **Teacher Ratio**: Teachers per student (e.g., 0.15 = 1 teacher per 6.67 students)
- **Non-Teacher Ratio**: Non-teaching staff per student (e.g., 0.08)
- **CPI Frequency**: Years between tuition CPI adjustments (1, 2, or 3 years)
- **CPI Base Year**: Reference year for CPI calculations

**Aggregated Summary (Bottom Section):**
- Total Students (FR + IB)
- Total Capacity (FR + IB)
- Total Revenue (FR Revenue + IB Revenue)
- Total Staff Costs (FR Staff + IB Staff with CPI-adjusted salaries)
- Utilization % (Students / Capacity)

**Visual Cues:**
- Flag icons and distinct accent colors (FR = blue, IB = green)
- Sticky first column (Year column)
- Smooth horizontal scroll for years
- Aggregate row highlighted with subtle background
- Validation indicators (red if students > capacity)

**Data Entry:**
- Inline editing with debounced auto-save
- Copy-forward button (copy current year to all future years)
- Bulk edit modal (apply % increase to tuition across years)
- Import from CSV

#### Tab 3: Costs Analysis

**Purpose:** Rent modeling and cost breakdown

**Components:**

**A. Rent Lens (Expandable Card)**

**Collapsed State:**
- Summary card showing:
  - Selected rent model name
  - Annual rent range (Year 1 vs. Year 30)
  - NPV of rent (25-year) period 2028-2052
  - Rent Load % average

**Expanded State:**
- Rent model selector (FixedEscalation, RevenueShare, PartnerModel)
- Model-specific input form (see Section 5 for details)
- NPV calculation display (using Admin discount rate)
- Mini sensitivity chart: Rent impact on EBITDA across model options
- Year-by-year rent projection table (scrollable)
- "Apply Model" button to save changes

**B. Cost Breakdown**
- Pie chart: Rent, Staff, Opex, Capex
- Year-by-year table: All cost categories
- Cost per student metrics
- Year-over-year % changes

#### Tab 4: Capex

**Purpose:** Capital expenditure planning with auto-reinvestment

**Features:**
- **Timeline Chart**: Gradient bars showing reinvestment cycles per class
  - Building (20-year cycle)
  - FF&E (7-year cycle)
  - IT (4-year cycle)
  - Other (configurable)
- **Hover Details**: Class, cycle years, cost amount (inflation-adjusted)
- **Edit Modal**: Click bar to open drawer with:
  - Class selection
  - Cycle years or utilization threshold trigger
  - Base cost
  - Inflation index (linked to Admin CPI settings)
- **Summary Table**: All capex items by year with totals

#### Tab 5: Opex

**Purpose:** Operating expenses as % of revenue

**Model:**
```yaml
FR-8.2: Planner.OpexStructure
purpose: Model operating expenses as % of revenue
inputs:
  - opex_pct_of_revenue (overall %)
  - sub_accounts: optional list {name, pct}
behavior:
  - Default: single % of total revenue
  - If sub-accounts: total must = 100%
```

**UI:**
- **Simple Mode** (Default):
  - Single slider: Opex as % of revenue (0-100%)
  - Auto-calculated amount based on projected revenue
  - Year-by-year table showing amounts
  
- **Sub-Account Mode**:
  - "+ Add Sub-Account" button
  - Per sub-account inputs:
    - Name (e.g., "Utilities", "Maintenance", "Insurance")
    - % of revenue (slider)
  - Validation: Sum of all sub-account % must = 100%
  - Animated pie chart showing distribution
  - Year-by-year breakdown table

#### Tab 6: Tuition Sim

**Purpose:** Tuition simulation within version context (see Section 5 for details)

**Features:**
- Rent-driven tuition adjustment tool
- Per-curriculum tuition sliders (FR, IB)
- Target EBITDA input
- Real-time impact calculations
- Tuition vs. Rent Load % curve
- "Save Adjustments to Version" button

#### Tab 7: Reports

**Purpose:** Generate and export reports for this version

**Features:**
- Report template selector (Executive Summary, Detailed Financial, Board Presentation)
- Format selector (PDF, Excel, CSV)
- Date range selector (default: full 30 years)
- Include/exclude sections (checkboxes)
- Preview pane
- "Generate Report" button
- Download history for this version

### 4.4 Tuition Simulator Page (`/tuition-simulator`)

**Purpose:** Dedicated tool for **adjusting base tuition** and viewing the financial impact under different rent scenarios. Tuition then grows automatically via CPI, and revenue is calculated automatically.

**CRITICAL: Tuition and Rent are INDEPENDENT**
- Rent models are evaluated for their financial impact
- **Revenue Calculation (Automatic):**
  - Revenue = Tuition × Students (calculated automatically per curriculum)
  - Tuition grows via CPI frequency (1, 2, or 3 years)
  - Students enrollment is set by user (per year, per curriculum)
- **What Users Adjust:**
  - **Base tuition** (starting point per curriculum: FR, IB)
  - **Students enrollment** (year-by-year projections per curriculum)
  - **CPI frequency** (1, 2, or 3 years between tuition adjustments)
- **NO automatic calculation of "required tuition to meet target EBITDA"**
- Users decide tuition strategy independently based on rent model outcomes

**Core Workflow:**
1. Select base version (or start fresh)
2. View rent model and its projected costs (for context)
3. **Adjust base tuition** per curriculum (FR, IB) using sliders or inputs
4. **Set students enrollment** projections (year-by-year per curriculum)
5. **Select CPI frequency** (1, 2, or 3 years) for automatic tuition growth
6. View automatic calculations: Revenue (Tuition × Students), EBITDA, Cash Flow, Rent Load %
7. Iterate and compare multiple tuition scenarios
8. Save as new version/scenario

**Model Flow:**
```yaml
flow:
  1. Rent Context: Display selected rent model and projected costs (read-only)
  2. User Inputs:
     - Base tuition per curriculum (FR, IB)
     - Students enrollment per year per curriculum
     - CPI frequency (1, 2, or 3 years)
  3. Automatic Calculations:
     - Tuition growth: tuition(t) = base_tuition × (1 + CPI)^(applications)
     - Revenue: revenue(t) = tuition(t) × students(t) per curriculum
     - EBITDA: revenue - staff - rent - opex - capex
     - Cash Flow: EBITDA - capex - interest - taxes
  4. Visual Feedback: Show Rent Load %, EBITDA trends, utilization % per curriculum
  5. Scenario Creation: Save adjusted tuition + enrollment as new version
```

**UI Layout:**

**Left Panel: Rent Context (Read-Only Display)**
- Selected rent model display (from base version)
- Model name and key parameters (read-only)
- Rent projection preview (year-by-year, scrollable table)
- NPV calculation display (2028-2052 period)
- Rent Load % average across projection period
- **Note:** "Rent is fixed based on selected version. Adjust tuition to see financial impact."

**Center: Interactive Charts**
- **Primary Chart**: Revenue vs. Rent over time
  - Multi-line chart: Revenue (FR), Revenue (IB), Total Revenue, Rent
  - X-axis: Years (2028-2052 focus, 2023-2052 full view)
  - Y-axis: Currency (SAR millions)
  - Highlight: Ramp-up period (2028-2032), Full capacity period (2033+)
  - Hover: detailed tooltip per year

- **Secondary Chart**: EBITDA Trend
  - Bar chart: EBITDA by year
  - Line overlay: EBITDA Margin %
  - Color-coded: Green (positive), Red (negative)
  - X-axis: Years (2028-2052)
  - Reference line: User can set "target EBITDA margin" for visual reference only (no calculation)

- **Tertiary Chart**: Rent Load % Trend
  - Line chart: Rent Load % by year
  - X-axis: Years (2028-2052)
  - Y-axis: Percentage
  - Threshold bands: Green (0-30%), Yellow (30-40%), Red (40%+)

**Right Panel: Tuition & Enrollment Controls**
- **Base Tuition Inputs (per curriculum)**:
  - French (FR): Base tuition input (SAR amount)
    - Adjustment slider: -20% to +50% from current base
    - Or direct input: Enter absolute SAR amount
  - IB: Base tuition input (SAR amount)
    - Adjustment slider: -20% to +50% from current base
    - Or direct input: Enter absolute SAR amount
  - Lock icon: lock ratio between curricula (adjust proportionally)
  - **Note:** "Tuition will grow automatically via CPI (every 1-3 years based on frequency)"

- **CPI Frequency Selector (per curriculum)**:
  - Dropdown: "Apply CPI every: 1 year / 2 years / 3 years"
  - Shows projected tuition with CPI growth
  - Example: Base 50,000 SAR + 3% CPI every 2 years

- **Enrollment Projections** (quick inputs, detailed entry in Curriculum tab):
  - French (FR): Students per year (with ramp-up helper)
    - 2028: [input] (suggest: 70-80% of capacity)
    - Growth rate slider for quick fill (e.g., +5% per year)
  - IB: Students per year (with ramp-up helper)
    - 2028: [input] (suggest: 0-20% of capacity, new program)
    - Growth rate slider for quick fill (e.g., +30% per year initially)

- **Summary Metrics Cards**:
  - Total Revenue (30-year sum, **automatic calculation**)
  - Average EBITDA Margin % (30-year average)
  - Average Rent Load % (**25-year 2028-2052 focus**)
  - Revenue Impact from tuition change (absolute and %)
  - Capacity Utilization % (per curriculum, during ramp-up 2028-2032)

- **Year-by-Year Detailed Table** (scrollable):
  - Columns: Year, Tuition (FR), Tuition (IB), Students (FR), Students (IB), Utilization (FR), Utilization (IB), Revenue, Rent, Staff, Opex, EBITDA, EBITDA %, Rent Load %
  - Highlight: Ramp-up years (2028-2032) with capacity utilization % per curriculum
  - Color-coded cells: Modified tuition/enrollment (yellow), EBITDA positive (green), negative (red)
  - Show CPI adjustment years (icon or highlight when tuition increases via CPI)

**Bottom Actions:**
- "Reset to Base" button (revert all tuition adjustments)
- "Create Scenario" CTA button → clones version with tuition adjustments applied
- "Compare Scenarios" button → add to comparison queue
- "Export Results" button → PDF/Excel of simulation

**Performance Requirement:** Response time < 50 ms for recalculation on tuition slider adjustment.

**Key Metrics Displayed (All Calculated Automatically):**
- **Revenue** = Tuition × Students (per curriculum, summed for total)
  - Tuition grows via CPI frequency (automatic)
  - Students set by user (enrollment projections)
- **Rent Load %** = (Rent / Revenue) × 100
- **EBITDA Margin %** = (EBITDA / Revenue) × 100
- **Capacity Utilization %** = (Students / Capacity) × 100 (per curriculum)
- **Revenue Impact** = (New Revenue - Base Revenue) / Base Revenue
- Year-by-year: Tuition (with CPI growth), Students, Utilization %, Revenue, Rent, Staff Costs, Opex, EBITDA, Cash Flow, Rent Load %
- **No automatic calculation of "required tuition"** - user sets base tuition + enrollment, system calculates financial impact

### 4.5 Compare Page (`/compare`)

**Purpose:** Side-by-side comparison of 2-4 versions

**Features:**
- **Version Selector**: Multi-select dropdown to choose 2-4 versions
- **Comparison Table**: Key metrics side-by-side
  - Total Revenue (30-year)
  - Total Rent (30-year)
  - Average EBITDA Margin %
  - Average Rent Load %
  - NPV of Rent
  - Total Capex
  - Total Opex
  - Final Cash Position
- **Year-by-Year Diff View**:
  - Table with columns per version
  - Color coding: green = higher (better), red = lower (worse), gray = same
  - Toggle between absolute values and deltas
- **Charts**:
  - Revenue comparison (line chart, one line per version)
  - Rent comparison (line chart)
  - EBITDA comparison (line chart)
  - Rent Load % comparison (line chart)
  - Cost breakdown comparison (stacked bar chart)
- **Highlight Deltas**: 
  - Automatic detection of significant differences
  - Call-out cards for key divergence points
- **Export**: "Export Comparison Report" button (PDF/Excel)

### 4.6 Reports Page (`/reports`)

**Purpose:** Report library and generation center

**Features:**
- **Report Library**:
  - List of all generated reports
  - Filters: Version, Date range, Report type, Created by
  - Sort: Date, Name, Version
  - Preview thumbnail
  - Download button
  - Delete button (if user is creator or Admin)
- **Generate New Report**:
  - Select version(s) (single or comparison)
  - Select template:
    - Executive Summary (1-2 pages)
    - Detailed Financial Analysis (full 30-year breakdown)
    - Board Presentation (slide deck format)
    - Custom (build your own)
  - Select format: PDF (A4 landscape), Excel (with formulas), CSV (raw data)
  - Options: Include charts, Include assumptions, Include audit trail
  - Preview pane (live preview as options selected)
  - "Generate" button
- **Scheduled Reports** (Admin only):
  - Auto-generate report on version approval
  - Email distribution list
  - Recurring reports (weekly/monthly summary)
- **Download History**:
  - Who downloaded what and when
  - Checksum verification for data integrity
  - Re-download capability

**Report Content:**
- Header: Logo, version name, generation date, page numbers
- Footer: Version ID, checksum, confidentiality notice
- Executive summary with key metrics
- Charts and visualizations
- Year-by-year data tables
- Assumptions and parameters
- Audit trail (optional)

### 4.7 Admin Page (`/admin`)

**Purpose:** System configuration and governance (Admin role only)

**Sections:**

**A. Global Settings**
- **CPI Rates**:
  - Annual CPI rate (%)
  - Historical CPI rates (2023-2024)
  - Projected CPI rates (2025+)
- **Interest Rates**: Discount rate for NPV calculations
- **Inflation Indices**: Custom indices for capex adjustments
- **Base Salaries** (with CPI adjustment tracking):
  - Teacher salary - French curriculum
  - Teacher salary - IB curriculum
  - Non-teacher salary - French curriculum
  - Non-teacher salary - IB curriculum
  - Note: Salaries auto-adjust annually via CPI

**B. Validation Rules Configuration**
- Business rule editor
- Threshold settings (warnings vs. errors)
- Custom validation formulas
- Enable/disable specific validations

**C. User Management**
- User list with role badges
- Add new user (email, name, role)
- Edit user (change role, deactivate)
- Role assignment: ADMIN, PLANNER, VIEWER
- Permission matrix view

**D. System Audit Log**
- Full activity log with filters:
  - User
  - Action type (Create, Update, Delete, Approve, Lock, Archive)
  - Entity type (Version, Curriculum, Rent, etc.)
  - Date range
- Export audit log (CSV)
- Retention policy settings

**E. Historical Actuals Import**
- Upload CSV/Excel for 2023-2024 actuals
- Field mapping interface
- Validation before import
- Import history and rollback

**F. System Health**
- Performance metrics dashboard
- Calculation benchmark tests
- Database size and query performance
- Error logs and alerts

---

## 5. Rent Models & Timeline Logic

### 5.1 Rent Model Specifications

#### Model 1: FixedEscalation

```yaml
description: Rent with fixed annual escalation rate
inputs:
  - base_rent: initial annual rent amount (currency)
  - escalation_rate: annual percentage increase (e.g., 3% = 0.03)
  - escalation_frequency: years between escalations (default: 1)
calculation:
  - year1: base_rent
  - subsequent: rent(t) = base_rent × (1 + escalation_rate)^(number_of_escalations)
  - number_of_escalations = floor((year - base_year) / escalation_frequency)
example:
  - base_rent: 1,000,000 SAR
  - escalation_rate: 3%
  - escalation_frequency: 1 year
  - Year 1: 1,000,000 SAR
  - Year 2: 1,030,000 SAR
  - Year 3: 1,060,900 SAR
```

**Visual:** Line chart showing smooth escalation curve with step increases at escalation frequency intervals.

#### Model 2: RevenueShare

```yaml
description: Rent as percentage of revenue
inputs:
  - revenue_share_pct: percentage of revenue (e.g., 15% = 0.15)
  - minimum_rent: optional floor amount (nullable)
  - maximum_rent: optional cap amount (nullable)
calculation:
  - base_rent(t) = Revenue(t) × revenue_share_pct
  - If minimum_rent set: rent(t) = max(base_rent(t), minimum_rent)
  - If maximum_rent set: rent(t) = min(rent(t), maximum_rent)
example:
  - revenue_share_pct: 15%
  - minimum_rent: 800,000 SAR
  - maximum_rent: 2,000,000 SAR
  - If Revenue = 5,000,000 SAR → Rent = 750,000 SAR (but floor applies) → 800,000 SAR
  - If Revenue = 15,000,000 SAR → Rent = 2,250,000 SAR (but cap applies) → 2,000,000 SAR
```

**Visual:** Dual-axis line chart showing Revenue (primary axis) and Rent (secondary axis) with min/max constraint bands.

#### Model 3: PartnerModel

```yaml
description: Rent based on partner yield calculation with growth
inputs:
  - land_size: land area in square meters (sqm)
  - land_price_per_sqm: price per square meter of land (currency/sqm)
  - bua_size: Built-Up Area (BUA) in square meters (sqm)
  - bua_price_per_sqm: price per square meter of BUA (currency/sqm)
  - yield_base: initial yield percentage for first year (e.g., 8% = 0.08)
  - yield_growth_rate: annual yield growth percentage (e.g., 0.5% = 0.005)
  - growth_frequency: years between yield increases (1, 2, or 3 years)
calculation:
  - capex_base = (land_size × land_price_per_sqm) + (bua_size × bua_price_per_sqm)
  - year1: rent = capex_base × yield_base
  - subsequent: 
      yield(t) = yield_base × (1 + yield_growth_rate)^(floor((t-1)/growth_frequency))
      rent(t) = capex_base × yield(t)
example:
  - land_size: 10,000 sqm
  - land_price_per_sqm: 5,000 SAR/sqm
  - bua_size: 15,000 sqm
  - bua_price_per_sqm: 8,000 SAR/sqm
  - capex_base = (10,000 × 5,000) + (15,000 × 8,000) = 170,000,000 SAR
  - yield_base: 8%
  - yield_growth_rate: 0.5%
  - growth_frequency: 2 years
  - Year 1: rent = 170,000,000 × 0.08 = 13,600,000 SAR
  - Year 2: yield = 0.08 × (1.005)^0 = 8% → rent = 13,600,000 SAR (no growth yet)
  - Year 3: yield = 0.08 × (1.005)^1 = 8.04% → rent = 13,668,000 SAR
  - Year 4: yield = 0.08 × (1.005)^1 = 8.04% → rent = 13,668,000 SAR (no growth this year)
  - Year 5: yield = 0.08 × (1.005)^2 = 8.08% → rent = 13,736,400 SAR
```

**Visual:** Bar chart showing yield % by year with smooth growth animation. Growth applied based on frequency (every 1, 2, or 3 years).

### 5.2 Timeline Logic & Periods

```yaml
periods:
  historical: [2023, 2024]
  transition: [2025, 2026, 2027]
  relocation: [2028, 2052]
```

#### Historical Data (2023-2024)

- **Status:** Locked actuals (read-only for all users except Admin)
- **Data Entry:** Admin can import/enter actual financial data via Admin panel
- **Source:** Import from accounting systems (CSV/Excel) or manual entry
- **Fields:** Revenue, Costs, Rent, Staff, Capex, Opex, Students, Capacity per curriculum
- **Validation:** Must reconcile with accounting records; checksum stored for audit
- **UI Indicator:** Gray background, lock icon, "Actuals 2024" label
- **Planning Focus:** Minimal (historical reference only)

#### Transition Years (2025-2027)

- **Rent Behavior:** Automatically clones rent amount from 2024 actuals (2024A)
- **Logic:** `rent(2025) = rent(2026) = rent(2027) = rent(2024A)`
- **Other Data:** Planner can modify curriculum, tuition, staffing, opex, capex
- **Purpose:** Model pre-relocation scenarios with current rent structure
- **UI Indicator:** Yellow accent, "Transition" badge, auto-fill notice for rent
- **Planning Focus:** Limited (rent is fixed, minimal decision impact)

#### Relocation Mode: Ramp-Up Period (2028-2032)

- **Phase:** New campus opens, gradual capacity fill-up
- **Rent Behavior:** New rent model applies (FixedEscalation, RevenueShare, or PartnerModel) - **HIGHLY EFFECTIVE for decision-making**
- **Capacity Logic:** **Curriculum-specific ramp-up profiles**

**French Curriculum (FR):**
- **Established school relocating** to new campus
- Likely starts with **high initial utilization** (70-80% of capacity in 2028)
- Students can transfer from current location
- Gradual growth to 100% by 2032
- Example: 2028 (300 students, 75% capacity) → 2032 (400 students, 100% capacity)

**IB Curriculum (IB):**
- **Brand new program launching** in 2028
- Starts from **zero or very low enrollment** (0-20% of capacity in 2028)
- Requires time to establish program, recruit students, build reputation
- Steeper growth curve as program gains traction
- Example: 2028 (30 students, 15% capacity) → 2032 (200 students, 100% capacity)

**Revenue Impact:**
- Revenue = Tuition × Students (calculated automatically per curriculum)
- Tuition grows via **CPI frequency** (1, 2, or 3 years) - INDEPENDENT of rent
- Lower enrollment in early years (especially IB) means lower revenue → higher Rent Load %
- This is why **rent model selection is CRITICAL** during this period

- **Planning Focus:** **CRITICAL PERIOD** - Rent model selection has maximum impact
- **UI Indicator:** Orange accent, "Ramp-Up" badge, capacity utilization % displayed per curriculum
- **Validation:** Students ≤ capacity (allow < 100% utilization per curriculum)

#### Relocation Mode: Full Capacity (2033-2052)

- **Phase:** School runs at full capacity (steady-state operations)
- **Rent Behavior:** Continued application of selected rent model
- **Capacity Logic:** **Assumption: 100% capacity utilization**
  - Students ≈ capacity (minor variance acceptable)
  - Default behavior: students = capacity unless user overrides
- **Planning Focus:** Long-term financial sustainability under rent model
- **UI Indicator:** Green accent, "Full Capacity" badge
- **Validation:** Students should be close to capacity (warn if < 90% utilization)

### 5.3 Dual-Curriculum Aggregation

**Per-Curriculum Calculations:**
```yaml
French (FR):
  - revenue_fr = students_fr × tuition_fr
  - teacher_cost_fr = students_fr × teacher_ratio_fr × teacher_salary_fr_with_cpi
  - non_teacher_cost_fr = students_fr × non_teacher_ratio_fr × non_teacher_salary_fr_with_cpi
  - staff_cost_fr = teacher_cost_fr + non_teacher_cost_fr

IB:
  - revenue_ib = students_ib × tuition_ib
  - teacher_cost_ib = students_ib × teacher_ratio_ib × teacher_salary_ib_with_cpi
  - non_teacher_cost_ib = students_ib × non_teacher_ratio_ib × non_teacher_salary_ib_with_cpi
  - staff_cost_ib = teacher_cost_ib + non_teacher_cost_ib

Aggregated:
  - total_revenue = revenue_fr + revenue_ib
  - total_students = students_fr + students_ib
  - total_capacity = capacity_fr + capacity_ib
  - total_staff_cost = staff_cost_fr + staff_cost_ib
  - utilization_pct = (total_students / total_capacity) × 100
```

**CPI Adjustments:**
```yaml
tuition_with_cpi:
  - frequency: per curriculum (1, 2, or 3 years)
  - apply_when: (year - base_year) % cpi_frequency == 0
  - calculation: tuition(t) = tuition_base × (1 + CPI_rate)^(number_of_applications)
  - number_of_applications = floor((year - base_year) / cpi_frequency)

salary_with_cpi:
  - frequency: annual (every year)
  - calculation: salary(t) = base_salary × (1 + CPI_rate)^(t - base_year)
  - applies_to: teacher_salary_fr, teacher_salary_ib, non_teacher_salary_fr, non_teacher_salary_ib
```

**Visual Cue:** Tuition and salary charts highlight CPI step years with vertical dashed lines and hover tooltips showing applied rate.

---

## 6. Financial Calculations Reference

### 6.1 Core Formulas

| Logic | Formula |
|-------|----------|
| **Revenue (per curriculum)** | `Students × Tuition` |
| **Total Revenue** | `Revenue(FR) + Revenue(IB)` |
| **Teacher Salary (with CPI)** | `teacher_salary_base × (1 + CPI_rate)^(year - base_year)` |
| **Non-Teacher Salary (with CPI)** | `non_teacher_salary_base × (1 + CPI_rate)^(year - base_year)` |
| **Staff Costs (per curriculum)** | `(Students × teacher_ratio × teacher_salary_with_CPI) + (Students × non_teacher_ratio × non_teacher_salary_with_CPI)` |
| **Total Staff Costs** | `Staff_Costs(FR) + Staff_Costs(IB)` |
| **Opex Total** | `Revenue × opex_pct` (or sum of sub-accounts if configured) |
| **Opex Sub-Account** | `Revenue × sub_account_pct` |
| **Tuition with CPI** | `tuition_base × (1 + CPI_rate)^(number_of_applications)` where CPI applied when `(year - base_year) % periodicity == 0` |
| **FixedEscalation Rent** | `base_rent × (1 + escalation_rate)^(number_of_escalations)` |
| **RevenueShare Rent** | `Revenue × revenue_share_pct` (with min/max constraints if set) |
| **PartnerModel Capex Base** | `(land_size × land_price_per_sqm) + (bua_size × bua_price_per_sqm)` |
| **PartnerModel Yield** | `yield(t) = yield_base × (1 + yield_growth_rate)^(floor((t-1)/growth_frequency))` where growth_frequency ∈ [1,2,3] |
| **PartnerModel Rent** | `capex_base × yield(t)` |
| **Capex Replacement** | Auto-triggered per `cycle_years`, cost = `base_cost × (1 + inflation_index)^(years_since_base)` |
| **EBITDA** | `Revenue - Staff_Costs - Rent - Opex - Other_Costs` |
| **Cash Flow** | `EBITDA - Capex - Interest - Taxes` |
| **NPV (Rent)** | `Σ(rent(t) / (1 + discount_rate)^(t-2027))` for t = 2028 to 2052 (25-year period) |
| **Rent Load %** | `(Rent / Revenue) × 100` |
| **Capacity Utilization %** | `(Students / Capacity) × 100` (per curriculum and total) |

### 6.2 Calculation Performance

**Target:** All calculations < 50 ms

**Techniques:**
- **Virtualized Rendering**: Only render visible table rows
- **Delta Computation**: Recalculate only changed years on edit
- **Memoized Functions**: Cache rent/staff/opex calculations
- **Edge Caching**: Use Supabase Edge Functions for compute
- **Web Workers**: Offload heavy calculations to background threads
- **Shared Rounding**: Consistent rounding utility across modules

**Benchmark:**
- 30-year full version calculation: < 40 ms
- Single year edit recalculation: < 10 ms
- Tuition simulator adjustment: < 50 ms
- Version comparison (4 versions): < 200 ms

---

## 7. Data Model & Database Schema

### 7.1 Core Tables

```yaml
tables:
  versions:
    columns:
      - id (uuid, PK)
      - name (string, unique per user)
      - status (enum: Draft, Ready, Locked, Archived)
      - created_by (uuid, FK → users)
      - created_at (timestamp)
      - updated_at (timestamp)
      - approved_by (uuid, FK → users, nullable)
      - approved_at (timestamp, nullable)
      - checksum (string, for validation)
      - description (text, nullable)
    indexes: [status, created_by, created_at]
    
  curriculum_plan:
    columns:
      - id (uuid, PK)
      - version_id (uuid, FK → versions, CASCADE DELETE)
      - curriculum_type (enum: FR, IB)
      - year (integer, 2023-2052)
      - capacity (integer, >= 0)
      - students (integer, >= 0, <= capacity)
      - tuition (decimal, > 0)
      - teacher_ratio (decimal, > 0, < 1)
      - non_teacher_ratio (decimal, > 0, < 1)
      - cpi_frequency (integer, 1-3)
      - cpi_base_year (integer)
    indexes: [version_id, curriculum_type, year]
    constraints: [students ≤ capacity, year in [2023,2052]]
    
  rent_plan:
    columns:
      - id (uuid, PK)
      - version_id (uuid, FK → versions, CASCADE DELETE)
      - year (integer, 2023-2052)
      - model_type (enum: FixedEscalation, RevenueShare, PartnerModel, nullable for 2025-2027)
      - amount (decimal, >= 0)
      - model_config (jsonb)
        # FixedEscalation: {base_rent, escalation_rate, escalation_frequency}
        # RevenueShare: {revenue_share_pct, minimum_rent, maximum_rent}
        # PartnerModel: {land_size, land_price_per_sqm, bua_size, bua_price_per_sqm, yield_base, yield_growth_rate, growth_frequency}
    indexes: [version_id, year]
    
  capex_rule:
    columns:
      - id (uuid, PK)
      - class (enum: Building, FF&E, IT, Other)
      - cycle_years (integer, > 0)
      - inflation_index (string, FK → admin_settings.cpi_name)
      - base_cost (decimal, > 0)
      - created_by (uuid, FK → users)
      - created_at (timestamp)
    indexes: [class]
    
  capex_plan:
    columns:
      - id (uuid, PK)
      - version_id (uuid, FK → versions, CASCADE DELETE)
      - year (integer, 2023-2052)
      - class (enum: Building, FF&E, IT, Other)
      - amount (decimal, >= 0)
      - rule_id (uuid, FK → capex_rule, nullable)
    indexes: [version_id, year, class]
    
  opex_plan:
    columns:
      - id (uuid, PK)
      - version_id (uuid, FK → versions, CASCADE DELETE)
      - sub_account (string, nullable)
      - pct_of_revenue (decimal, 0-100)
      - amount (decimal, calculated)
    indexes: [version_id]
    constraints: [sum(pct_of_revenue) = 100 if sub_accounts exist]
    
  tuition_simulation:
    columns:
      - id (uuid, PK)
      - version_id (uuid, FK → versions, CASCADE DELETE)
      - rent_model_type (enum: FixedEscalation, RevenueShare, PartnerModel)
      - adjustment_factor_fr (decimal, -20 to 50)
      - adjustment_factor_ib (decimal, -20 to 50)
      - target_margin (decimal, nullable)
      - target_ebitda (decimal, nullable)
      - results (jsonb)  # Year-by-year simulation results
      - created_at (timestamp)
    indexes: [version_id, created_at]
    
  audit_log:
    columns:
      - id (uuid, PK)
      - user_id (uuid, FK → users)
      - action (enum: Create, Update, Delete, Approve, Lock, Archive)
      - entity_type (string)
      - entity_id (uuid)
      - changes (jsonb, nullable)
      - reason (text, nullable)
      - timestamp (timestamp)
    indexes: [user_id, entity_type, entity_id, timestamp]
    
  admin_settings:
    columns:
      - id (uuid, PK)
      - setting_key (string, unique)
      - setting_value (jsonb)
      - updated_by (uuid, FK → users)
      - updated_at (timestamp)
    indexes: [setting_key]
    # Examples: 
    #   global_cpi_rate: decimal (annual CPI rate for salary adjustments)
    #   discount_rate: decimal
    #   interest_rate: decimal
    #   teacher_salary_fr: decimal
    #   teacher_salary_ib: decimal
    #   non_teacher_salary_fr: decimal
    #   non_teacher_salary_ib: decimal
    #   validation_rules: jsonb
    
  users:
    columns:
      - id (uuid, PK)
      - email (string, unique)
      - name (string)
      - role (enum: ADMIN, PLANNER, VIEWER)
      - created_at (timestamp)
      - last_login (timestamp, nullable)
    indexes: [email, role]
```

### 7.2 Relationships

- `versions` → `curriculum_plan` (1:N, cascade delete)
- `versions` → `rent_plan` (1:N, cascade delete)
- `versions` → `capex_plan` (1:N, cascade delete)
- `versions` → `opex_plan` (1:N, cascade delete)
- `versions` → `tuition_simulation` (1:N, cascade delete)
- `capex_rule` → `capex_plan` (1:N, nullable)
- `users` → `versions` (1:N, created_by)
- `users` → `audit_log` (1:N)

### 7.3 Validation Rules

```yaml
curriculum_plan:
  - students ≤ capacity (per year, per curriculum)
  - tuition > 0
  - teacher_ratio > 0 and < 1
  - non_teacher_ratio > 0 and < 1
  - cpi_frequency in [1, 2, 3]
  - year in [2023, 2052]

rent_plan:
  - amount ≥ 0
  - year in [2023, 2052]
  - For transition years (2025-2027): model_type must be null (uses 2024A)
  - For relocation years (2028+): model_type must be set

opex_plan:
  - pct_of_revenue in [0, 100]
  - If sub_accounts exist: sum(pct_of_revenue) = 100
  - amount = Revenue × pct_of_revenue (auto-calculated)

capex_plan:
  - amount ≥ 0
  - year in [2023, 2052]

versions:
  - name must be unique per user
  - Cannot delete Locked versions (only Archive)
  - Cannot edit Locked versions (only Admin can unlock)

version_status_transitions:
  - Draft → Ready: requires all mandatory fields filled, validation passes
  - Ready → Locked: Admin approval required, reason mandatory
  - Locked → Draft: Admin only, reason mandatory
  - Any → Archived: Admin only

rent_model_validation:
  - FixedEscalation: base_rent > 0, escalation_rate ≥ 0
  - RevenueShare: revenue_share_pct in [0, 100], min_rent ≤ max_rent if both set
  - PartnerModel: land_size > 0, land_price_per_sqm > 0, bua_size > 0, bua_price_per_sqm > 0, yield_base > 0, yield_growth_rate ≥ 0, growth_frequency in [1, 2, 3]

aggregation_validation:
  - Total students across curricula ≤ total capacity across curricula
  - Revenue calculations must reconcile: (Students × Tuition) per curriculum
```

---

## 8. Technical Architecture

### 8.1 Tech Stack

```yaml
frontend:
  framework: Next.js 16 (App Router)
  language: TypeScript 5.x
  styling: Tailwind CSS v4 + shadcn/ui
  animations: Framer Motion
  charts: Recharts (or Tremor for data-centric UI)
  state: Zustand + React Context
  forms: React Hook Form + Zod
  tables: TanStack Table v8 (virtualized)
  icons: Lucide React
  fonts: Inter (text) + JetBrains Mono (figures)

backend:
  api: Next.js API Routes (Server Actions for mutations)
  database: PostgreSQL 15+ (via Supabase)
  orm: Prisma 5.x
  auth: Supabase Auth (email/password)
  realtime: Supabase Realtime (optional for collaboration)
  validation: Zod (shared schemas)
  
infrastructure:
  hosting: Vercel (Edge Functions for compute)
  database: Supabase (managed PostgreSQL)
  storage: Supabase Storage (for document attachments)
  cdn: Vercel Edge Network
  monitoring: Vercel Analytics + Sentry
  
tooling:
  pdf: react-pdf or Puppeteer
  excel: ExcelJS
  email: Resend (notifications)
  ci_cd: GitHub Actions + Vercel
  testing: Vitest + Playwright
```

### 8.2 Architecture Patterns

#### Frontend Architecture
- **App Router Structure**:
  ```
  app/
    ├── (auth)/           # Auth routes
    ├── (dashboard)/      # Protected routes
    │   ├── page.tsx      # Overview
    │   ├── versions/     # Versions pages
    │   ├── tuition-simulator/
    │   ├── compare/
    │   ├── reports/
    │   └── admin/
    ├── api/              # API routes
    └── layout.tsx        # Root layout
  ```

- **Component Architecture**:
  ```
  components/
    ├── ui/               # shadcn/ui base components
    ├── features/         # Feature-specific components
    │   ├── versions/
    │   ├── curriculum/
    │   ├── rent/
    │   ├── tuition-sim/
    │   └── charts/
    ├── layouts/          # Layout components
    └── shared/           # Shared utilities
  ```

- **State Management**:
  - **Zustand** for global app state (user, settings)
  - **React Context** for feature-scoped state
  - **Server State**: Managed by Supabase client + React Query patterns
  - **Form State**: React Hook Form
  - **URL State**: Next.js searchParams for filters/pagination

#### Backend Architecture
- **Server Actions** for mutations (create, update, delete)
- **API Routes** for complex queries and external integrations
- **Edge Functions** (Supabase) for intensive calculations
- **Database Functions** (PostgreSQL) for complex aggregations
- **Row-Level Security** (RLS) for data access control

#### Database Architecture
- **Normalized Schema**: Relational model with foreign keys
- **Cascade Deletes**: version_id cascades to all related tables
- **Indexes**: Optimized for common queries (version_id, year, curriculum_type)
- **JSONB**: Used for flexible config (model_config, settings, results)
- **Enums**: Type-safe status, roles, models
- **Triggers**: Auto-update timestamps, audit logging
- **Views**: Pre-computed aggregations for reporting

### 8.3 Performance Optimization

#### Calculation Performance (<50ms target)
- **Delta Computation**: Only recalculate changed years
- **Memoization**: Cache expensive calculations (React.useMemo, React.memo)
- **Web Workers**: Offload 30-year projections to background thread
- **Shared Utilities**: Consistent rounding and formatting
- **Lazy Loading**: Code-split heavy features (charts, reports)
- **Debouncing**: Input changes debounced to 300ms

#### UI Performance
- **Virtualized Tables**: TanStack Table with row virtualization
- **Optimistic Updates**: Immediate UI feedback before server confirmation
- **Skeleton Loading**: Shimmer states during data fetch
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Variable fonts, preload critical fonts
- **Bundle Size**: Tree-shaking, dynamic imports
- **Edge Caching**: Vercel Edge for static/semi-static content

#### Database Performance
- **Connection Pooling**: pgBouncer via Supabase
- **Query Optimization**: Indexes on FK and filter columns
- **Batch Operations**: Bulk inserts/updates for year-by-year data
- **Materialized Views**: Pre-computed aggregations for reports
- **Pagination**: Cursor-based for large datasets

### 8.4 Security & Compliance

#### Authentication & Authorization
- **Supabase Auth**: Email/password with magic links
- **Role-Based Access Control (RBAC)**: ADMIN, PLANNER, VIEWER
- **Row-Level Security (RLS)**: Database-level access control
- **Session Management**: JWT tokens with refresh
- **2FA**: Optional two-factor authentication (future)

#### Data Security
- **Encryption at Rest**: PostgreSQL encryption
- **Encryption in Transit**: TLS 1.3
- **SQL Injection**: Prevented by Prisma ORM
- **XSS Protection**: React escaping + Content Security Policy
- **CSRF Protection**: SameSite cookies
- **Rate Limiting**: Vercel Edge middleware

#### Audit & Compliance
- **Audit Log**: All CRUD operations logged
- **Checksum Validation**: Data integrity verification
- **Version History**: Immutable version records
- **Backups**: Daily automated backups (Supabase)
- **Disaster Recovery**: Point-in-time recovery (7-day retention)
- **GDPR Compliance**: User data export/deletion (if required)

### 8.5 Development Workflow

#### Local Development
- **Setup**:
  ```bash
  npm install
  cp .env.example .env.local
  # Configure DATABASE_URL and DIRECT_URL
  npx prisma migrate dev
  npx prisma db seed
  npm run dev
  ```
- **Database**: Supabase local development or cloud project
- **Hot Reload**: Fast Refresh for instant updates
- **Type Safety**: TypeScript strict mode

#### CI/CD Pipeline
1. **Pull Request**:
   - Linting (ESLint + Prettier)
   - Type checking (tsc)
   - Unit tests (Vitest)
   - Build validation
   - Preview deployment (Vercel)
   
2. **Merge to Main**:
   - Production deployment (Vercel)
   - Database migrations (Prisma)
   - Smoke tests (Playwright)
   - Monitoring alerts (Sentry)

#### Database Migrations
- **Prisma Migrate**: Version-controlled migrations
- **Migration Strategy**:
  - Dev: `prisma migrate dev`
  - Production: `prisma migrate deploy`
- **Seed Data**: `prisma/seed.ts` for initial data
- **Rollback**: Managed via Prisma migration history

### 8.6 Monitoring & Observability

- **Application Monitoring**: Sentry (errors, performance)
- **Analytics**: Vercel Analytics (page views, web vitals)
- **Database Monitoring**: Supabase dashboard (queries, connections)
- **Logging**: Vercel logs + custom structured logging
- **Alerting**: Slack/Email notifications for critical errors
- **Performance Budgets**: Core Web Vitals tracking

---

## 9. User Flows

### 9.1 Primary Flow: Create Financial Scenario

**Actor:** Finance Manager (PLANNER role)

1. **Navigate** → `/versions` page
2. **Click** "Create New Version" button
3. **Enter** version name and description
4. **Status** → Draft (auto-assigned)
5. **Configure Curriculum** (Tab 2):
   - Switch to French (FR) tab
   - Enter capacity, students, tuition (year-by-year or bulk edit)
   - Set teacher/non-teacher ratios
   - Set CPI frequency (1, 2, or 3 years)
   - Switch to IB tab, repeat
   - View aggregated totals at bottom
6. **Configure Costs** (Tab 3):
   - Expand Rent Lens
   - Select rent model (FixedEscalation for 2028+)
   - Enter base_rent, escalation_rate
   - View rent projection
   - Apply model
   - Note: Transition years (2025-2027) auto-filled from 2024A
7. **Configure Opex** (Tab 5):
   - Enter opex as % of revenue
   - Or add sub-accounts (Utilities, Maintenance, etc.)
8. **Configure Capex** (Tab 4):
   - View auto-reinvestment timeline
   - Adjust if needed (edit cycle rules)
9. **Review** (Tab 1: Overview):
   - View summary metrics
   - Check validation status
10. **Submit** → Change status to "Ready"
11. **Admin Approval** → CFO locks version

### 9.2 Secondary Flow: Tuition & Enrollment Planning

**Actor:** CFO or Finance Manager (ADMIN or PLANNER role)

**Goal:** Set base tuition, enrollment projections, and CPI frequency to view financial impact under a given rent scenario

1. **Navigate** → `/tuition-simulator`
2. **Select** base version from dropdown (with rent model already configured)
3. **View Rent Context** (Left Panel - Read-Only):
   - View selected rent model (e.g., PartnerModel)
   - View key parameters (land_size, bua_size, yield_base, etc.)
   - View rent projection (year-by-year)
   - View NPV of rent (2028-2052 period, 25 years)
   - Note: "Rent is fixed. Adjust tuition and enrollment to see financial impact."

4. **Set Base Tuition** (Right Panel):
   - French (FR): Adjust base tuition +10% (or enter 55,000 SAR absolute)
   - IB: Adjust base tuition +12% (or enter 60,000 SAR absolute)
   - Option: Lock ratio between curricula for proportional adjustment
   - Note: "Tuition will grow automatically via CPI frequency"

5. **Set CPI Frequency** (Right Panel):
   - French (FR): Select "Every 2 years" (tuition increases every 2 years)
   - IB: Select "Every 2 years"
   - System shows projected tuition with CPI growth

6. **Set Enrollment Projections** (Right Panel):
   - **French (FR)** - Established school relocating:
     - 2028: 300 students (75% of 400 capacity)
     - Use growth rate slider: +6% per year → reaches 400 by 2032
   - **IB** - New program launching:
     - 2028: 30 students (15% of 200 capacity)
     - Use growth rate slider: +40% per year → reaches 200 by 2032
   - System highlights: "Different ramp-up per curriculum"

7. **View Automatic Calculations** (Center Charts + Summary):
   - **Revenue** = Tuition × Students (calculated automatically per curriculum)
   - **Chart 1**: Revenue vs. Rent over time → See revenue growth with enrollment ramp-up
   - **Chart 2**: EBITDA Trend → See financial performance during ramp-up and full capacity
   - **Chart 3**: Rent Load % → See rent burden decrease as revenue grows
   - **Chart 4**: Utilization % per curriculum → FR high start, IB gradual build
   - **Summary Cards**: 
     - Average EBITDA Margin % (especially critical during 2028-2032 ramp-up)
     - Average Rent Load % (focus on 2028-2052, 25-year period)
     - Revenue growth from tuition + enrollment strategy

8. **Iterate** (Optional):
   - Adjust base tuition, enrollment growth rates, or CPI frequency
   - Try different scenarios: Conservative (lower tuition, slower growth) vs. Aggressive (higher tuition, faster growth)
   - View year-by-year table to understand ramp-up impact per curriculum

9. **Create Scenario** → Click "Create Scenario" button
10. **Save** → New version created with tuition + enrollment + CPI frequency settings (rent unchanged)

### 9.3 Tertiary Flow: Compare Versions

**Actor:** Board Member (VIEWER role)

1. **Navigate** → `/compare`
2. **Select** versions to compare (2-4):
   - Version A: FixedEscalation Model
   - Version B: RevenueShare Model
   - Version C: PartnerModel
3. **View** comparison table:
   - Total Revenue (30-year)
   - Total Rent (30-year)
   - Average EBITDA Margin %
   - Rent Load %
   - NPV of Rent
4. **Analyze** charts:
   - Revenue trend comparison
   - Rent Load % over time
   - EBITDA comparison
5. **Identify** best scenario based on:
   - Lowest Rent Load %
   - Highest EBITDA
   - Lowest NPV of Rent
6. **Export** → "Export Comparison Report" (PDF)
7. **Download** → Present to board meeting

---

## 10. Non-Functional Requirements

### Performance Targets

```yaml
calculations:
  - single_year_edit: < 10 ms
  - full_version_recalc: < 40 ms
  - tuition_simulation: < 50 ms
  - version_comparison: < 200 ms (4 versions)

ui_responsiveness:
  - page_load: < 2 seconds (initial load)
  - page_transition: < 300 ms
  - input_response: < 50 ms (excluding network)
  - skeleton_to_content: < 1 second

reporting:
  - pdf_generation: < 5 seconds (30-year report)
  - excel_export: < 3 seconds
  - chart_rendering: < 200 ms

data_operations:
  - version_clone: < 2 seconds
  - bulk_year_update: < 1 second (30 years)
  - audit_log_query: < 500 ms
```

### Reliability & Availability

- **Uptime Target**: 99.9% (maximum 8.76 hours downtime/year)
- **Data Durability**: 99.999999999% (11 nines via Supabase)
- **Backup Frequency**: Daily automated backups with 7-day retention
- **Recovery Time Objective (RTO)**: < 4 hours
- **Recovery Point Objective (RPO)**: < 24 hours
- **Error Handling**: Graceful degradation with user-friendly messages
- **Failover**: Automatic failover to Vercel Edge regions

### Usability & Accessibility

```yaml
accessibility:
  - standard: WCAG 2.1 AA compliance
  - contrast_ratio: ≥ 4.5:1 for text
  - keyboard_navigation: full support with visible focus indicators
  - screen_readers: ARIA labels on all interactive elements
  - reduced_motion: respect prefers-reduced-motion
  - responsive: desktop (primary), tablet, mobile (read-only)

usability:
  - learning_curve: < 1 hour for new users
  - task_completion: < 30 minutes for new version creation
  - error_recovery: clear validation messages with guidance
  - help_system: contextual tooltips and help documentation
```

### Browser & Device Support

**Supported Browsers:**
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)

**Primary Device:** Desktop (1920×1080 and higher)  
**Secondary Devices:** Tablets (1024×768+), Mobile (view-only for reports)

### Scalability

```yaml
data_limits:
  - versions_per_user: unlimited
  - years_per_version: 30 (fixed: 2023-2052)
  - curricula_per_version: 2 (fixed: FR, IB)
  - users_total: 50 concurrent users

database:
  - max_connections: 100 (via pgBouncer)
  - query_timeout: 30 seconds
  - storage_capacity: 100 GB (Supabase Pro plan)

throughput:
  - api_requests: 1000 req/min per user
  - concurrent_calculations: 20 simultaneous
  - report_generation_queue: 10 concurrent
```

### Security Requirements

- **Authentication**: Multi-factor authentication (2FA) available
- **Session Timeout**: 24 hours of inactivity
- **Password Policy**: Minimum 8 characters, complexity requirements
- **Data Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Audit Retention**: 2 years minimum
- **Role-Based Access**: Strictly enforced at database and application levels
- **Input Validation**: All inputs validated and sanitized
- **Rate Limiting**: 100 req/min per user, 1000 req/min per organization

---

## 11. Development Phases & Roadmap

### Phase 1: Foundation & Core Modeling (6-8 weeks)
**Goal**: MVP with core financial modeling capabilities

**Deliverables:**
- ✅ Next.js 16 project setup with TypeScript
- ✅ Supabase integration (database + auth)
- ✅ Prisma schema and migrations
- ✅ User authentication (email/password)
- ✅ Role-based access control (ADMIN, PLANNER, VIEWER)
- ✅ Version management (create, list, detail)
- ✅ Dual-curriculum planning interface (FR, IB)
- ✅ Year-by-year data entry (2023-2052)
- ✅ Basic financial calculations (Revenue, Staff Costs)
- ✅ FixedEscalation rent model
- ✅ Timeline logic (historical, transition, relocation)
- ✅ Validation rules (students ≤ capacity, etc.)
- ✅ Basic dashboard (Overview page)

**Success Criteria:**
- Finance team can create a version with dual-curriculum data
- Revenue and staff costs calculate correctly (<50ms)
- Transition years (2025-2027) auto-clone rent from 2024A
- All validation rules enforced

**Team:** 1-2 developers + 1 designer

---

### Phase 2: Rent Models & Tuition Simulator (4-6 weeks)
**Goal**: Advanced rent modeling and tuition simulation

**Deliverables:**
- ✅ RevenueShare rent model (with min/max constraints)
- ✅ PartnerModel rent model (yield calculation with growth)
- ✅ Rent Lens component (expandable, model selector, NPV calculation)
- ✅ Capex auto-reinvestment (Building, FF&E, IT, Other)
- ✅ Opex modeling (% of revenue, sub-accounts)
- ✅ Tuition Simulator page (`/tuition-simulator`)
- ✅ Rent-driven tuition adjustment sliders (FR, IB)
- ✅ Target EBITDA configuration
- ✅ Interactive charts (Tuition vs. Rent Load %, year-by-year impact)
- ✅ Scenario creation from simulator
- ✅ CPI frequency for tuition (1, 2, or 3 years)
- ✅ Partner yield growth frequency

**Success Criteria:**
- All 3 rent models functional and validated
- Tuition simulator responds < 50ms
- CFO can evaluate rent impact on tuition positioning
- NPV calculations accurate

**Team:** 2 developers + 1 designer (UI for simulator)

---

### Phase 3: Comparison & Reporting (4-5 weeks)
**Goal**: Version comparison and professional reporting

**Deliverables:**
- ✅ Compare page (`/compare`) - side-by-side version comparison
- ✅ Comparison charts (Revenue, Rent, EBITDA, Cash Flow)
- ✅ Delta highlighting and call-outs
- ✅ Reports page (`/reports`) - report library
- ✅ Report templates (Executive Summary, Detailed Financial, Board Presentation)
- ✅ PDF generation (A4 landscape, with charts)
- ✅ Excel export (with formulas, year-by-year data)
- ✅ CSV export (raw data)
- ✅ Report download history with checksums
- ✅ Version cloning functionality
- ✅ Audit log (all CRUD operations)

**Success Criteria:**
- Compare 2-4 versions side-by-side
- Generate PDF report < 5 seconds
- Excel export includes formulas and formatting
- Audit log tracks all changes

**Team:** 2 developers

---

### Phase 4: Admin & Governance (3-4 weeks)
**Goal**: System administration and governance features

**Deliverables:**
- ✅ Admin page (`/admin`)
- ✅ Global settings management (CPI, discount rate, salaries)
- ✅ Base salary configuration (teacher/non-teacher, FR/IB)
- ✅ CPI adjustment tracking for salaries
- ✅ Validation rules configuration
- ✅ User management (add, edit, deactivate)
- ✅ System audit log viewer with filters
- ✅ Historical actuals import (CSV/Excel for 2023-2024)
- ✅ Version approval workflow (Draft → Ready → Locked)
- ✅ Version status transitions with reason tracking
- ✅ System health dashboard (performance metrics)

**Success Criteria:**
- Admin can configure global settings
- Historical actuals imported and locked
- Approval workflow enforced
- System health metrics visible

**Team:** 1 developer + security review

---

### Phase 5: Polish & Optimization (3-4 weeks)
**Goal**: Performance optimization, UX polish, testing

**Deliverables:**
- ✅ Performance optimization (calculations < 50ms)
- ✅ Virtualized tables for large datasets
- ✅ Debounced inputs and memoized calculations
- ✅ Dark mode implementation
- ✅ Responsive design (tablet support)
- ✅ Accessibility audit (WCAG 2.1 AA)
- ✅ Keyboard navigation and shortcuts
- ✅ Loading states and skeleton screens
- ✅ Error handling and user feedback
- ✅ Unit tests (Vitest)
- ✅ End-to-end tests (Playwright)
- ✅ Documentation (user guide, API docs)
- ✅ Deployment to production (Vercel + Supabase)

**Success Criteria:**
- All performance targets met
- WCAG 2.1 AA compliant
- Zero critical bugs
- User acceptance testing passed
- Production deployment successful

**Team:** 2 developers + 1 QA

---

### Total Timeline: 20-27 weeks (5-7 months)

**Recommended Start:** December 2024  
**Target Launch:** Q2 2026 (April-June 2026)  
**Decision Deadline:** Q4 2026 (relocation by 2028)

**Buffer:** 3-4 months before decision deadline for real-world usage and refinement

---

### Phase 6: Future Enhancements (Post-Launch)

**Optional Features:**
- Real-time collaboration (multiple users editing simultaneously)
- Advanced sensitivity analysis (Monte Carlo simulations)
- Mobile app (iOS/Android) for read-only access
- API access for external integrations
- Custom branding (white-label for other schools)
- AI-powered recommendations (optimal rent model selection)
- Predictive analytics (enrollment forecasting)
- Integration with accounting systems (QuickBooks, Xero)

---

## 12. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Calculation errors in complex rent models** | High | Medium | Validate against manual spreadsheets; unit tests for all formulas; CFO review before launch |
| **Performance degradation with 30-year data** | High | Low | Web workers for heavy calculations; virtualized tables; benchmark tests in CI |
| **Users find dual-curriculum interface confusing** | High | Medium | User testing with finance team; guided onboarding; contextual help |
| **Timeline slippage delaying decision-making** | High | Medium | Phased rollout; prioritize P0 features; weekly progress reviews |
| **Rent model assumptions don't match market** | Medium | Medium | Flexible model parameters; validation with real estate advisors; easy to adjust post-launch |
| **Data loss or corruption** | High | Low | Daily automated backups; transaction integrity; version checksums |
| **Security breach or unauthorized access** | High | Low | Row-level security (RLS); audit logging; penetration testing before launch |
| **Scope creep delays core features** | Medium | High | Strict PRD adherence; change control process; Phase 6 for "nice-to-haves" |
| **Supabase/Vercel service outages** | Medium | Low | 99.9% SLA; automatic failover; status page monitoring |
| **Browser compatibility issues** | Low | Low | Support only modern browsers (last 2 versions); progressive enhancement |

---

## 13. Definition of Done & Acceptance Criteria

### Phase 1 MVP Acceptance
- [ ] Finance team (PLANNER role) can create a new version
- [ ] Dual-curriculum data entry functional (FR, IB)
- [ ] Year-by-year inputs for capacity, students, tuition, ratios (2023-2052)
- [ ] Revenue and staff costs calculate correctly (match manual calculations within 1%)
- [ ] Transition years (2025-2027) automatically clone rent from 2024A
- [ ] Historical years (2023-2024) are read-only for PLANNER
- [ ] All validation rules enforced (students ≤ capacity, etc.)
- [ ] FixedEscalation rent model functional with correct calculations
- [ ] Performance target met: full version calculation < 50 ms
- [ ] Zero critical bugs
- [ ] User testing completed with finance team (2+ users)

### Phase 2 Tuition Simulator Acceptance
- [ ] All 3 rent models functional (FixedEscalation, RevenueShare, PartnerModel)
- [ ] Rent calculations match specifications exactly
- [ ] NPV calculations accurate (validated by CFO)
- [ ] Tuition Simulator page renders correctly
- [ ] Rent-driven tuition adjustment responds < 50 ms
- [ ] Per-curriculum tuition sliders functional (FR, IB, -20% to +50%)
- [ ] Target EBITDA configuration works (margin % and absolute)
- [ ] Interactive charts render correctly (Tuition vs. Rent Load %)
- [ ] "Create Scenario" button creates new version with adjusted tuition
- [ ] CPI frequency logic correct (1, 2, or 3 years)
- [ ] Partner yield growth frequency correct (1, 2, or 3 years)

### Phase 3 Comparison & Reporting Acceptance
- [ ] Compare page functional (2-4 versions side-by-side)
- [ ] Comparison charts render correctly (Revenue, Rent, EBITDA, Cash Flow)
- [ ] Delta highlighting works (green/red color coding)
- [ ] PDF generation < 5 seconds
- [ ] PDF content accurate and formatted correctly (A4 landscape)
- [ ] Excel export includes formulas and all data
- [ ] CSV export functional
- [ ] Report download history tracked with checksums
- [ ] Version cloning works (all data copied except audit logs)
- [ ] Audit log records all CRUD operations

### Phase 4 Admin & Governance Acceptance
- [ ] Admin page accessible by ADMIN role only
- [ ] Global settings editable (CPI, discount rate, salaries)
- [ ] Base salary configuration functional (4 salary types)
- [ ] CPI adjustment tracking works for salaries
- [ ] User management functional (add, edit, deactivate)
- [ ] Historical actuals import works (CSV/Excel)
- [ ] Version approval workflow enforced (Draft → Ready → Locked)
- [ ] Status transitions require reason (logged in audit)
- [ ] System health dashboard displays metrics

### Phase 5 Polish & Optimization Acceptance
- [ ] All performance targets met (<50ms calculations, <2s page load)
- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation functional with visible focus indicators
- [ ] Dark mode implemented and functional
- [ ] Responsive design works on tablets
- [ ] All loading states and skeleton screens implemented
- [ ] Error handling graceful with user-friendly messages
- [ ] Unit test coverage > 80%
- [ ] End-to-end tests pass (critical user flows)
- [ ] Documentation complete (user guide, technical docs)
- [ ] Production deployment successful

### Overall Project Success Criteria
- [ ] Decision made on school relocation by Q4 2026 using this tool
- [ ] 100% of finance team actively using the app (3+ users)
- [ ] Finance team reports 50%+ time savings vs. spreadsheets
- [ ] Board members rate tool quality 4.5+/5
- [ ] Zero calculation errors reported in production
- [ ] 99.9% uptime achieved over 3-month period
- [ ] All P0 features functional and tested
- [ ] Security audit passed (if required)
- [ ] Data migration successful (historical actuals imported)

---

## 14. Governance & Approval Workflow

### Version Lifecycle

```yaml
status_flow:
  Draft:
    - description: Work in progress, editable by creator (PLANNER)
    - transitions: [Ready, Archived]
    - permissions: Creator can edit, delete
    
  Ready:
    - description: Submitted for approval, awaiting Admin review
    - transitions: [Draft, Locked, Archived]
    - permissions: Read-only for creator, Admin can approve/reject
    
  Locked:
    - description: Approved by Admin, immutable record
    - transitions: [Draft (Admin only with reason), Archived]
    - permissions: Read-only for all, Admin can unlock with reason
    
  Archived:
    - description: Historical record, hidden from main views
    - transitions: [None]
    - permissions: Read-only for all, visible in archive section
```

### Approval UI
- **Status Banner**: Color-coded (Draft=gray, Ready=yellow, Locked=green, Archived=blue)
- **Reason Dialog**: Required for all status transitions (except Draft → Ready)
- **Approval History**: Timeline showing all approvals, rejections, locks, unlocks
- **Notification**: Email notification to creator on approval/rejection

---

## 15. Next Steps & Immediate Actions

### 1. Review & Finalize PRD (Week 1)
- [ ] Review this PRD v1.4 with stakeholders (CFO, Finance Manager, Principal)
- [ ] Validate rent models match real-world scenarios
- [ ] Confirm timeline aligns with decision deadline
- [ ] Validate base salary ranges and CPI assumptions
- [ ] Approve tech stack and architecture choices

### 2. Project Setup (Week 2)
- [ ] Create GitHub repository
- [ ] Set up Vercel project (hosting)
- [ ] Set up Supabase project (database + auth)
- [ ] Configure CI/CD pipeline (GitHub Actions)
- [ ] Set up project management (Linear, Jira, or Notion)
- [ ] Create design system in Figma (if needed)

### 3. Team Assembly (Week 2)
- [ ] Assign roles: Tech Lead, Frontend Dev, Backend Dev, Designer, QA
- [ ] Schedule kickoff meeting
- [ ] Set up communication channels (Slack, email lists)
- [ ] Define sprint cadence (2-week sprints recommended)

### 4. Design Phase (Week 3-4)
- [ ] Create wireframes for key pages (Overview, Version Detail, Tuition Simulator, Compare)
- [ ] Design UI components (shadcn/ui customization)
- [ ] Create design system tokens (colors, fonts, spacing)
- [ ] User flow diagrams for primary flows
- [ ] Prototype interactive tuition simulator
- [ ] Design review with stakeholders

### 5. Development Kickoff (Week 5)
- [ ] Phase 1 Sprint 1 begins
- [ ] Set up development environment (local Supabase, Next.js)
- [ ] Create Prisma schema and initial migration
- [ ] Implement authentication (Supabase Auth)
- [ ] Build version management (create, list, detail)
- [ ] Daily standups (async or sync)

### 6. Parallel Activities
- [ ] **CFO**: Prepare historical actuals data (2023-2024) for import
- [ ] **Finance Manager**: Validate rent model assumptions with real estate advisors
- [ ] **Principal**: Provide enrollment projections for both curricula
- [ ] **Tech Lead**: Set up monitoring and error tracking (Sentry)

### 7. Communication Plan
- **Weekly**: Progress update email to stakeholders
- **Bi-weekly**: Sprint demo to finance team
- **Monthly**: Executive update to CFO and board
- **Ad-hoc**: Slack for daily communication, blockers, questions

---

## 16. Appendix

### A. Calculation Examples

**Example 1: Revenue Calculation (French Curriculum, Year 2028)**
```yaml
inputs:
  students_fr: 250
  tuition_fr: 50,000 SAR
  cpi_frequency: 2 years
  cpi_base_year: 2028
  cpi_rate: 3%

calculation:
  # Year 2028 (base year)
  revenue_fr_2028 = 250 × 50,000 = 12,500,000 SAR
  
  # Year 2029 (no CPI adjustment, frequency = 2)
  revenue_fr_2029 = 250 × 50,000 = 12,500,000 SAR
  
  # Year 2030 (CPI adjustment applied)
  tuition_fr_2030 = 50,000 × (1.03)^1 = 51,500 SAR
  revenue_fr_2030 = 250 × 51,500 = 12,875,000 SAR
```

**Example 2: Staff Cost Calculation (IB Curriculum, Year 2030)**
```yaml
inputs:
  students_ib: 180
  teacher_ratio_ib: 0.15
  non_teacher_ratio_ib: 0.08
  teacher_salary_ib_base: 180,000 SAR (2028)
  non_teacher_salary_ib_base: 120,000 SAR (2028)
  cpi_rate: 3%
  base_year: 2028

calculation:
  # Teacher salary (2030)
  teacher_salary_ib_2030 = 180,000 × (1.03)^(2030-2028) = 180,000 × 1.0609 = 190,962 SAR
  
  # Non-teacher salary (2030)
  non_teacher_salary_ib_2030 = 120,000 × (1.03)^(2030-2028) = 120,000 × 1.0609 = 127,308 SAR
  
  # Staff costs
  teacher_cost_ib = 180 × 0.15 × 190,962 = 5,155,974 SAR
  non_teacher_cost_ib = 180 × 0.08 × 127,308 = 1,832,755 SAR
  staff_cost_ib_2030 = 5,155,974 + 1,832,755 = 6,988,729 SAR
```

### B. Reference Materials
- [ ] Sample rent agreements for validation
- [ ] Historical financial data (2023-2024)
- [ ] Current spreadsheet models (for validation)
- [ ] Board presentation templates
- [ ] Enrollment projections (FR, IB)

### C. Glossary Expansion
- **Draft**: Version status indicating work in progress
- **Ready**: Version status indicating submitted for approval
- **Locked**: Version status indicating approved and immutable
- **Archived**: Version status indicating historical record
- **Rent Load %**: Rent as percentage of revenue (key metric for sustainability)
- **Target EBITDA**: Financial target to be maintained through tuition adjustments

---

---

## 17. Simulation Page - Full Financial Sandbox

### 17.1 Concept: How the Simulation Page Works

**Purpose:** A comprehensive sandbox environment where Admin + Planner can temporarily override ANY assumption or parameter of a selected version, see live results in real-time, and optionally save as a new version.

**Key Difference from Tuition Simulator:**
- **Tuition Simulator**: Focused tool for rent-driven tuition adjustments to maintain target EBITDA
- **Simulation Page**: Full sandbox for exploring ANY parameter change (capacity, tuition, rent, staff ratios, capex, opex, CPI rates, etc.)

**Workflow:**

1. **Load Base Version**
   - User selects existing version (e.g., "V12 – Lease 4.5% yield, 30-year")
   - Opens Simulation page → engine loads all base version data:
     - Curriculum data (capacity, students, tuition, ratios)
     - Rent model and parameters
     - Capex rules and plans
     - Opex structure
     - Admin settings (CPI, discount rate, salaries)

2. **Adjust Parameters**
   - User overrides ANY parameter (capacity, tuition, rent model, yield, staff ratios, capex cycles, etc.)
   - Engine runs **live recalculation** (<50ms response)
   - Updates all outputs instantly:
     - KPI cards (Revenue, EBITDA, Cash Flow, Rent Load %)
     - Charts (trends, comparisons)
     - Tables (year-by-year breakdown, years as columns)

3. **Save or Discard**
   - **Discard**: Reset to original version (non-destructive)
   - **Save as New Version**: Creates new version (e.g., "V12b – Counter-offer 3% escalation")
   - **Original version stays intact** unless user explicitly overwrites

**Non-Destructive by Default:** All changes are temporary until user explicitly saves.

---

### 17.2 Page Metadata & Access

```yaml
page:
  route: /simulation or /versions/[id]/simulate
  title: "Financial Simulation Sandbox"
  description: "Override any parameter and see live impact on 30-year projections"
  
access:
  roles: [ADMIN, PLANNER]
  permissions:
    - View: All versions user has access to
    - Simulate: Override any parameter temporarily
    - Save: Create new version from simulation
    - Viewer role: Read-only access (cannot simulate)

navigation:
  primary_nav: "Simulation" (in top nav bar)
  breadcrumb: "Home > Simulation > [Version Name]"
  quick_access: "Simulate" button on version detail page (Tab 1: Overview)
  
entry_points:
  1. Top nav: "Simulation" link
  2. Version detail page: "Run Simulation" button
  3. Compare page: "Simulate Selected" button (loads version into simulator)
  4. Tuition Simulator: "Open Full Sandbox" link (transfers to Simulation page)
```

---

### 17.3 Parameter Groups (All Adjustable Parameters)

**Group A: Curriculum Parameters** (per curriculum: FR, IB)

```yaml
curriculum_parameters:
  per_curriculum: [FR, IB]
  adjustable_per_year: [2023-2052]
  
  parameters:
    - capacity:
        type: integer
        range: [0, 5000]
        default: from base version
        bulk_edit: true (apply to multiple years)
        
    - students:
        type: integer
        range: [0, capacity]
        default: from base version
        validation: students <= capacity
        bulk_edit: true
        
    - tuition:
        type: decimal (SAR)
        range: [0, 500000]
        default: from base version
        bulk_edit: true
        adjustment_mode: [absolute, percentage, CPI-driven]
        
    - teacher_ratio:
        type: decimal
        range: [0, 1]
        default: from base version
        description: "Teachers per student (e.g., 0.15 = 1:6.67)"
        
    - non_teacher_ratio:
        type: decimal
        range: [0, 1]
        default: from base version
        description: "Non-teaching staff per student (e.g., 0.08)"
        
    - cpi_frequency:
        type: integer
        range: [1, 2, 3]
        default: from base version
        description: "Years between tuition CPI adjustments"
        
    - cpi_base_year:
        type: integer
        range: [2023, 2052]
        default: from base version
```

**Group B: Rent Parameters**

```yaml
rent_parameters:
  model_type:
    type: enum [FixedEscalation, RevenueShare, PartnerModel]
    default: from base version
    switchable: true (can change model in simulation)
    
  FixedEscalation:
    - base_rent:
        type: decimal (SAR)
        range: [0, 100000000]
        default: from base version
    - escalation_rate:
        type: percentage
        range: [0, 50]
        default: from base version
    - escalation_frequency:
        type: integer (years)
        range: [1, 5]
        default: 1
        
  RevenueShare:
    - revenue_share_pct:
        type: percentage
        range: [0, 100]
        default: from base version
    - minimum_rent:
        type: decimal (SAR)
        range: [0, 100000000]
        optional: true
        default: from base version
    - maximum_rent:
        type: decimal (SAR)
        range: [0, 100000000]
        optional: true
        default: from base version
        
  PartnerModel:
    - land_size:
        type: decimal (sqm)
        range: [0, 1000000]
        default: from base version
    - land_price_per_sqm:
        type: decimal (SAR/sqm)
        range: [0, 100000]
        default: from base version
    - bua_size:
        type: decimal (sqm)
        range: [0, 1000000]
        default: from base version
    - bua_price_per_sqm:
        type: decimal (SAR/sqm)
        range: [0, 100000]
        default: from base version
    - yield_base:
        type: percentage
        range: [0, 50]
        default: from base version
    - yield_growth_rate:
        type: percentage
        range: [0, 20]
        default: from base version
    - growth_frequency:
        type: integer (years)
        range: [1, 2, 3]
        default: from base version
```

**Group C: Capex Parameters**

```yaml
capex_parameters:
  auto_reinvestment_rules:
    classes: [Building, FF&E, IT, Other]
    per_class:
      - cycle_years:
          type: integer
          range: [1, 50]
          default: from admin settings or base version
          description: "Years between reinvestment cycles"
      - base_cost:
          type: decimal (SAR)
          range: [0, 1000000000]
          default: from base version
      - inflation_index:
          type: string (CPI reference)
          default: from admin settings
          
  manual_capex_overrides:
    description: "Override auto-calculated capex for specific years"
    per_year: [2023-2052]
    per_class: [Building, FF&E, IT, Other]
    adjustable:
      - amount:
          type: decimal (SAR)
          range: [0, 1000000000]
          default: from base version or auto-calculated
```

**Group D: Opex Parameters**

```yaml
opex_parameters:
  mode: [simple, sub_accounts]
  
  simple_mode:
    - opex_pct_of_revenue:
        type: percentage
        range: [0, 100]
        default: from base version
        
  sub_accounts_mode:
    sub_accounts:
      - name: string (e.g., "Utilities", "Maintenance")
      - pct_of_revenue: percentage
      - validation: sum of all sub_accounts = 100%
      
  manual_overrides:
    description: "Override opex for specific years (absolute amounts)"
    per_year: [2023-2052]
    amount:
      type: decimal (SAR)
      range: [0, 100000000]
```

**Group E: Admin Settings / Global Assumptions**

```yaml
admin_overrides:
  description: "Temporarily override global settings for this simulation"
  
  cpi_settings:
    - global_cpi_rate:
        type: percentage
        range: [0, 50]
        default: from admin settings
        description: "Annual CPI rate for salary adjustments"
    - historical_cpi_rates:
        per_year: [2023, 2024]
        type: percentage
        editable: false (locked actuals)
    - projected_cpi_rates:
        per_year: [2025-2052]
        type: percentage
        default: global_cpi_rate or custom per year
        
  financial_settings:
    - discount_rate:
        type: percentage
        range: [0, 50]
        default: from admin settings
        description: "For NPV calculations"
    - interest_rate:
        type: percentage
        range: [0, 50]
        default: from admin settings
        description: "For debt service (if applicable)"
        
  base_salaries:
    per_curriculum: [FR, IB]
    per_type: [teacher, non_teacher]
    - teacher_salary_fr:
        type: decimal (SAR)
        range: [0, 1000000]
        default: from admin settings
    - teacher_salary_ib:
        type: decimal (SAR)
        range: [0, 1000000]
        default: from admin settings
    - non_teacher_salary_fr:
        type: decimal (SAR)
        range: [0, 1000000]
        default: from admin settings
    - non_teacher_salary_ib:
        type: decimal (SAR)
        range: [0, 1000000]
        default: from admin settings
```

**Group F: Timeline & Period Overrides**

```yaml
timeline_overrides:
  description: "Override timeline behavior (advanced)"
  
  transition_years_behavior:
    years: [2025, 2026, 2027]
    default: "Clone rent from 2024A"
    override_option: "Use custom rent values instead of 2024A clone"
    
  historical_years_visibility:
    years: [2023, 2024]
    default: "Read-only (locked actuals)"
    note: "Cannot override in simulation (data integrity)"
```

---

### 17.4 Outputs & Analytics

**Live KPI Cards** (update instantly on parameter change)

```yaml
kpi_cards:
  layout: Grid (3 columns × 3 rows)
  
  financial_kpis:
    - total_revenue_30yr:
        calculation: Sum of revenue across 30 years
        format: SAR (millions)
        change_indicator: vs. base version (% and absolute)
        
    - total_rent_30yr:
        calculation: Sum of rent across 30 years
        format: SAR (millions)
        change_indicator: vs. base version
        
    - average_ebitda_margin:
        calculation: Average EBITDA margin % across 30 years
        format: percentage
        change_indicator: vs. base version
        color_coding: green if improved, red if worse
        
    - average_rent_load:
        calculation: Average (Rent / Revenue) % across 30 years
        format: percentage
        change_indicator: vs. base version
        threshold_indicator: warning if > 40%, critical if > 50%
        
    - npv_of_rent:
        calculation: NPV of all rent payments (using discount rate)
        format: SAR (millions)
        change_indicator: vs. base version
        
    - total_capex_30yr:
        calculation: Sum of capex across 30 years
        format: SAR (millions)
        change_indicator: vs. base version
        
    - total_staff_costs_30yr:
        calculation: Sum of staff costs across 30 years
        format: SAR (millions)
        change_indicator: vs. base version
        
    - final_cash_position:
        calculation: Cumulative cash flow at end of 2052
        format: SAR (millions)
        change_indicator: vs. base version
        color_coding: green if positive, red if negative
        
    - break_even_year:
        calculation: First year where cumulative cash flow > 0
        format: year (YYYY)
        change_indicator: vs. base version
```

**Interactive Charts** (update in real-time)

```yaml
charts:
  layout: Responsive grid (2-3 charts visible, scroll for more)
  
  chart_1_revenue_trend:
    type: Multi-line chart
    lines:
      - Total Revenue (simulated)
      - Total Revenue (base version) - dashed line for comparison
      - FR Revenue (simulated)
      - IB Revenue (simulated)
    x_axis: Years (2023-2052)
    y_axis: Revenue (SAR millions)
    interaction: Hover for exact values, click year to highlight
    
  chart_2_rent_vs_revenue:
    type: Dual-axis line chart
    primary_axis:
      - Revenue (simulated)
      - Revenue (base version) - dashed
    secondary_axis:
      - Rent (simulated)
      - Rent (base version) - dashed
    x_axis: Years (2023-2052)
    highlight: Transition years (2025-2027), Relocation start (2028)
    
  chart_3_ebitda_trend:
    type: Line + bar combo chart
    bars: EBITDA by year (simulated)
    line: EBITDA margin % (simulated)
    comparison: Base version EBITDA (dashed line)
    x_axis: Years (2023-2052)
    color_coding: Green bars for positive EBITDA, red for negative
    
  chart_4_cash_flow_waterfall:
    type: Waterfall chart
    starting_point: Initial cash position
    additions: Revenue streams
    deductions: Rent, Staff, Opex, Capex
    ending_point: Final cash position
    comparison: Base version final position (marker)
    
  chart_5_rent_load_percentage:
    type: Line chart with threshold bands
    line: Rent Load % by year (simulated)
    comparison: Base version Rent Load % (dashed)
    threshold_bands:
      - Green zone: 0-30% (healthy)
      - Yellow zone: 30-40% (caution)
      - Red zone: 40%+ (critical)
    x_axis: Years (2023-2052)
    
  chart_6_cost_breakdown:
    type: Stacked area chart
    areas:
      - Rent
      - Staff Costs
      - Opex
      - Capex
    x_axis: Years (2023-2052)
    y_axis: Costs (SAR millions)
    toggle: Absolute values vs. % of revenue
    
  chart_7_utilization_rate:
    type: Line chart (dual curriculum)
    lines:
      - FR Utilization % (students / capacity)
      - IB Utilization % (students / capacity)
      - Total Utilization %
    x_axis: Years (2023-2052)
    y_axis: Utilization %
    threshold_line: 80% optimal utilization
    
  chart_8_sensitivity_heatmap:
    type: Heatmap (advanced)
    x_axis: Parameter changed (Tuition, Rent, Capacity, etc.)
    y_axis: Impact metric (EBITDA, Rent Load %, Cash Flow)
    cell_color: Green (positive impact), Red (negative impact)
    cell_value: % change from base version
```

**Year-by-Year Tables** (years as columns, virtualized)

```yaml
tables:
  layout: Virtualized scrolling (TanStack Table)
  orientation: Years as columns (vertical scroll for metrics, horizontal scroll for years)
  
  table_1_financial_summary:
    rows:
      - Revenue (FR)
      - Revenue (IB)
      - Total Revenue
      - Rent
      - Rent Load %
      - Staff Costs (FR)
      - Staff Costs (IB)
      - Total Staff Costs
      - Opex
      - Capex
      - EBITDA
      - EBITDA Margin %
      - Cash Flow
      - Cumulative Cash Flow
    columns: Years (2023-2052)
    cell_formatting:
      - Currency: SAR format with commas
      - Percentages: 1 decimal place
      - Color coding: Changed cells highlighted (yellow if modified from base)
    comparison_mode: Toggle to show delta vs. base version
    
  table_2_curriculum_detail:
    rows_per_curriculum: [FR, IB]
    metrics:
      - Capacity
      - Students
      - Utilization %
      - Tuition
      - Revenue
      - Teachers (calculated from ratio)
      - Non-Teachers (calculated from ratio)
      - Staff Cost
    columns: Years (2023-2052)
    
  table_3_rent_breakdown:
    rows:
      - Rent Model (display only)
      - Base Rent / Revenue Share % / Yield % (model-specific)
      - Calculated Rent
      - Escalation Applied (if applicable)
      - NPV Contribution (per year)
    columns: Years (2023-2052)
    
  table_4_capex_schedule:
    rows:
      - Building Capex
      - FF&E Capex
      - IT Capex
      - Other Capex
      - Total Capex
      - Capex as % of Revenue
    columns: Years (2023-2052)
    highlight: Years with auto-reinvestment triggers
```

**Comparison Sidebar** (base vs. simulated)

```yaml
comparison_sidebar:
  position: Right panel (collapsible)
  content:
    - Base Version Name
    - Simulation Status (unsaved changes indicator)
    - Key Metrics Comparison (table):
        metrics: [Revenue, Rent, EBITDA, Cash Flow, Rent Load %]
        columns: [Base Version, Simulated, Delta, Delta %]
        color_coding: Green (improvement), Red (deterioration)
    - Change Summary (list):
        - "Tuition (FR) increased by 10%"
        - "Rent model changed from FixedEscalation to PartnerModel"
        - "Capex cycle (FF&E) changed from 7 to 5 years"
        - etc.
    - Actions:
        - "Reset All Changes" button
        - "Save as New Version" button (primary CTA)
        - "Export Simulation Report" button
```

---

### 17.5 Simulation Behavior & Governance

**Real-Time Calculation Engine**

```yaml
calculation_engine:
  performance_target: < 50 ms per parameter change
  approach:
    - Delta computation: Only recalculate affected years
    - Web Workers: Offload heavy calculations to background thread
    - Memoization: Cache unchanged calculations
    - Debouncing: 300ms debounce for continuous slider adjustments
    
  calculation_order:
    1. Curriculum-level calculations (Revenue, Staff Costs per FR/IB)
    2. Aggregated totals (Total Revenue, Total Staff Costs)
    3. Rent calculations (based on selected model)
    4. Opex calculations (% of revenue or absolute)
    5. Capex calculations (auto-reinvestment + overrides)
    6. EBITDA calculation (Revenue - all costs)
    7. Cash Flow calculation (EBITDA - Capex - Interest - Taxes)
    8. NPV calculations (rent, total costs)
    9. Derived metrics (Rent Load %, utilization %, margins)
    
  validation_on_change:
    - students <= capacity (per curriculum, per year)
    - opex sub-accounts sum to 100% (if using sub-accounts)
    - rent model parameters within valid ranges
    - tuition > 0
    - ratios > 0 and < 1
    - display validation errors inline (red border + message)
    - prevent save if critical validations fail
```

**Change Tracking & History**

```yaml
change_tracking:
  in_memory_state:
    - original_version_data: Immutable snapshot of base version
    - current_simulation_state: Mutable state with all changes
    - change_log: Array of {parameter, old_value, new_value, timestamp}
    
  undo_redo:
    - Undo button: Revert last change
    - Redo button: Reapply undone change
    - Stack depth: 50 changes
    - Keyboard shortcuts: Cmd+Z (undo), Cmd+Shift+Z (redo)
    
  reset_options:
    - Reset All: Restore to base version (confirmation dialog)
    - Reset Section: Reset only curriculum / rent / capex / opex
    - Reset Year: Reset all parameters for specific year
```

**Save & Version Creation**

```yaml
save_behavior:
  save_as_new_version:
    trigger: "Save as New Version" button
    modal_dialog:
      - Version Name: text input (required, suggest "V[base]b – [description]")
      - Description: textarea (optional, pre-fill with change summary)
      - Status: dropdown (Draft, Ready) - default Draft
      - Create button (primary CTA)
      - Cancel button
    process:
      1. Validate all simulation parameters
      2. Create new version record in database
      3. Clone all simulated data to new version (curriculum, rent, capex, opex)
      4. Set version status to Draft (or Ready if Admin)
      5. Redirect to new version detail page
      6. Show success toast: "Version [name] created successfully"
    
  auto_save_drafts:
    optional_feature: Auto-save simulation state to browser localStorage
    frequency: Every 30 seconds if changes detected
    restore_on_return: "You have unsaved simulation. Restore?" prompt
    
  validation_before_save:
    critical_validations:
      - All students <= capacity across all years
      - Rent model selected for relocation years (2028+)
      - Opex sub-accounts sum to 100% (if applicable)
      - No negative values where not allowed
    warnings_allowed:
      - Utilization > 100% in future years (warn but allow)
      - EBITDA negative in some years (warn but allow)
      - Rent Load > 50% (warn but allow)
```

**Governance & Permissions**

```yaml
governance:
  role_specific_behavior:
    ADMIN:
      - Can simulate any version (including Locked)
      - Can override admin settings (CPI, discount rate, salaries)
      - Can save simulation as Locked version (skip approval)
      - Can override historical years (2023-2024) in simulation only (not saved)
      
    PLANNER:
      - Can simulate Draft and Ready versions they created or have access to
      - Cannot simulate Locked versions (read-only)
      - Cannot override admin settings (greyed out)
      - Can save simulation as Draft version only
      - Cannot override historical years (2023-2024) even in simulation
      
    VIEWER:
      - Read-only access to Simulation page
      - Can view simulations created by others (if shared)
      - Cannot adjust parameters
      - Cannot save versions
      
  audit_logging:
    events_logged:
      - Simulation opened (version_id, user, timestamp)
      - Parameters changed (parameter, old_value, new_value, user, timestamp)
      - Simulation saved as new version (new_version_id, parent_version_id, user, timestamp)
      - Simulation discarded (user, timestamp)
    log_table: simulation_activity_log
```

**Collaboration & Sharing** (optional Phase 6 feature)

```yaml
collaboration:
  share_simulation_link:
    description: "Share live simulation with team members"
    generate_link: Unique URL with simulation state encoded
    permissions: View-only or Edit
    expiry: 7 days default
    
  real_time_collaboration:
    description: "Multiple users editing same simulation simultaneously"
    technology: Supabase Realtime
    conflict_resolution: Last write wins, with collision warning
    presence_indicators: Show who else is viewing/editing
```

---

### 17.6 UI Layout & Component Structure

**Page Layout**

```yaml
layout:
  structure: Three-panel layout
  
  left_panel:
    width: 30%
    content:
      - Version Selector (dropdown to switch base version)
      - Parameter Groups (collapsible accordions):
          - Curriculum Parameters (FR / IB tabs)
          - Rent Parameters (model selector + inputs)
          - Capex Parameters
          - Opex Parameters
          - Admin Overrides (ADMIN only)
          - Timeline Overrides (advanced, collapsed by default)
      - Change Log (collapsible, shows recent changes)
      - Actions:
          - "Reset All Changes" button
          - "Undo" / "Redo" buttons
    scrollable: Yes (sticky header with version selector)
    
  center_panel:
    width: 50%
    content:
      - KPI Cards Grid (top section, 3×3 grid)
      - Charts (scrollable section below KPIs)
      - Tables (tabbed interface):
          - Financial Summary
          - Curriculum Detail
          - Rent Breakdown
          - Capex Schedule
    scrollable: Yes
    
  right_panel:
    width: 20%
    collapsible: Yes
    content:
      - Comparison Sidebar (base vs. simulated)
      - Change Summary
      - Save Actions:
          - "Save as New Version" (primary CTA)
          - "Export Simulation Report" (secondary)
    sticky: Yes (follows scroll)
```

**Parameter Input Components**

```yaml
input_components:
  year_by_year_grid:
    component: Editable data grid (TanStack Table)
    features:
      - Inline editing (click cell to edit)
      - Bulk edit (select multiple cells, apply formula)
      - Copy-forward (copy year to all future years)
      - Keyboard navigation (arrow keys, Tab, Enter)
      - Undo/Redo per cell
    visual_cues:
      - Modified cells: Yellow background
      - Validation errors: Red border
      - Locked cells (historical): Grey background, disabled
      
  slider_with_input:
    component: Range slider + number input combo
    features:
      - Real-time adjustment (debounced calculation)
      - Min/max constraints displayed
      - % or absolute toggle (for tuition, opex)
      - Reset to base button (small icon)
    examples:
      - Tuition adjustment: -20% to +50%
      - Rent escalation rate: 0% to 20%
      - Capex cycle: 1 to 50 years
      
  model_selector:
    component: Segmented control or radio button group
    options: [FixedEscalation, RevenueShare, PartnerModel]
    behavior: Switch model → inputs dynamically change
    visual: Icons + labels for each model
    
  toggle_switches:
    examples:
      - Simple Opex vs. Sub-Accounts
      - Absolute values vs. % change (charts)
      - Show base version comparison (charts)
```

**Visual Feedback & Loading States**

```yaml
visual_feedback:
  parameter_change:
    immediate: Input value updates
    after_debounce: Spinner icon on calculating sections
    after_calculation: Smooth transition to new values
    animation: Number count-up for large changes (optional)
    
  validation_errors:
    inline: Red border + error message below input
    toast: Warning toast for non-critical issues
    modal: Error modal for critical validation failures
    
  save_success:
    toast: "Simulation saved as version [name]"
    redirect: Navigate to new version detail page
    confetti: Subtle celebration animation (optional)
```

---

### 17.7 Technical Implementation Notes

**State Management**

```yaml
state_architecture:
  approach: Zustand store + React Context
  
  simulation_store:
    base_version: Immutable snapshot of selected version
    simulation_state: Mutable state with all parameters
    change_history: Array of changes for undo/redo
    calculation_results: Cached calculation outputs
    is_calculating: Boolean loading state
    validation_errors: Array of validation issues
    
  actions:
    - loadVersion(versionId): Load base version into simulation
    - updateParameter(path, value): Update single parameter
    - bulkUpdateParameters(updates): Update multiple parameters
    - recalculate(): Trigger calculation engine
    - resetToBase(): Discard all changes
    - undo() / redo(): Navigate change history
    - saveAsNewVersion(name, description): Create new version
```

**Calculation Engine Architecture**

```yaml
calculation_engine:
  implementation: Web Worker for heavy calculations
  
  worker_responsibilities:
    - 30-year financial projections
    - NPV calculations
    - Aggregations and derived metrics
  
  main_thread_responsibilities:
    - UI updates and rendering
    - User input handling
    - State management
    
  communication:
    main_to_worker:
      - message: { type: 'CALCULATE', payload: simulation_state }
    worker_to_main:
      - message: { type: 'RESULTS', payload: calculation_results, duration_ms }
      
  performance_optimization:
    - Delta computation: Only recalculate changed years
    - Memoization: Cache unchanged calculations using useMemo
    - Debouncing: 300ms debounce for slider adjustments
    - Lazy loading: Load charts only when scrolled into view
    - Virtualization: Year-by-year tables use virtual scrolling
```

**API Endpoints**

```yaml
api_endpoints:
  GET /api/simulation/version/[id]:
    description: Load version data for simulation
    response: Full version data (curriculum, rent, capex, opex, admin settings)
    
  POST /api/simulation/calculate:
    description: Trigger server-side calculation (if needed for validation)
    body: simulation_state
    response: calculation_results
    
  POST /api/simulation/save:
    description: Save simulation as new version
    body: { base_version_id, simulation_state, new_version_name, description, status }
    response: { new_version_id, success }
    
  GET /api/simulation/share/[token]:
    description: Load shared simulation via link (Phase 6)
    response: simulation_state (read-only)
```

**Database Considerations**

```yaml
database:
  no_new_tables_required:
    reason: Simulation state is temporary (in-memory or localStorage)
    
  optional_table_for_auto_save:
    table: simulation_drafts
    columns:
      - id (uuid, PK)
      - user_id (FK → users)
      - base_version_id (FK → versions)
      - simulation_state (jsonb)
      - created_at (timestamp)
      - updated_at (timestamp)
    purpose: Auto-save simulation drafts for recovery
    ttl: 7 days (auto-delete old drafts)
    
  optional_table_for_sharing:
    table: simulation_shares
    columns:
      - id (uuid, PK)
      - token (string, unique, indexed)
      - simulation_state (jsonb)
      - created_by (FK → users)
      - expires_at (timestamp)
      - view_count (integer)
    purpose: Share simulation links with team members
```

**Testing Strategy**

```yaml
testing:
  unit_tests:
    - Calculation functions (revenue, rent, staff, opex, capex, EBITDA)
    - Validation logic (students <= capacity, etc.)
    - Change tracking (undo/redo)
    - NPV calculations
    
  integration_tests:
    - Load version → simulate → save flow
    - Parameter change → recalculation flow
    - Bulk edit operations
    - Model switching (FixedEscalation ↔ RevenueShare ↔ PartnerModel)
    
  performance_tests:
    - 30-year calculation < 50ms (benchmark)
    - UI remains responsive during calculation
    - Memory usage within acceptable limits
    - No memory leaks on repeated simulations
    
  e2e_tests:
    - Complete simulation workflow (load → edit → save)
    - Validation error handling
    - Undo/redo functionality
    - Save as new version
```

---

### 17.8 Acceptance Criteria

**Functional Requirements**

- [ ] User (ADMIN or PLANNER) can select any accessible version to simulate
- [ ] All parameter groups editable (curriculum, rent, capex, opex, admin overrides)
- [ ] Real-time recalculation on parameter change (<50ms)
- [ ] All KPI cards update correctly
- [ ] All charts update correctly (8 charts)
- [ ] All tables update correctly (year-by-year data)
- [ ] Comparison sidebar shows base vs. simulated delta
- [ ] Validation errors displayed inline
- [ ] Change tracking and undo/redo functional (50-step history)
- [ ] "Reset All Changes" restores to base version
- [ ] "Save as New Version" creates new version with simulated data
- [ ] Original version remains unchanged (non-destructive)

**Performance Requirements**

- [ ] Calculation response time < 50ms for single parameter change
- [ ] Full 30-year recalculation < 100ms
- [ ] UI remains responsive during calculation (no blocking)
- [ ] Charts render in < 200ms
- [ ] Tables virtualized (smooth scrolling with 1000+ rows)

**Governance Requirements**

- [ ] ADMIN can override admin settings in simulation
- [ ] PLANNER cannot override admin settings (inputs disabled)
- [ ] VIEWER has read-only access (cannot edit parameters)
- [ ] Historical years (2023-2024) locked for PLANNER
- [ ] All simulation activity logged in audit_log

**UX Requirements**

- [ ] Parameter inputs intuitive and easy to use
- [ ] Modified cells/inputs highlighted (yellow background)
- [ ] Validation errors clear and actionable
- [ ] Loading states for calculations (spinner icons)
- [ ] Success feedback on save (toast notification)
- [ ] Keyboard shortcuts functional (Cmd+Z, Cmd+Shift+Z)
- [ ] Responsive layout (works on desktop, tablet)

---

### 17.9 Comparison: Tuition Simulator vs. Simulation Page

| Feature | Tuition Simulator | Simulation Page (Full Sandbox) |
|---------|-------------------|--------------------------------|
| **Purpose** | Set base tuition + enrollment to view financial impact under a fixed rent scenario | Explore ANY parameter change including rent model switching |
| **Adjustable Parameters** | Base tuition (FR/IB), Students enrollment (FR/IB), CPI frequency - Rent is read-only | All parameters (curriculum, rent, capex, opex, admin) |
| **Target Users** | CFO, Finance Manager, Planner | Admin, Planner (power users) |
| **Use Case** | "Given this rent model, what's the financial impact of our tuition + enrollment strategy?" | "What if we change capacity, switch rent models, AND adjust tuition together?" |
| **Complexity** | Focused workflow (tuition + enrollment inputs) | Open-ended, exploratory (all parameters editable) |
| **Revenue Calculation** | **Automatic**: Revenue = Tuition × Students (per curriculum) | **Automatic**: Revenue = Tuition × Students (per curriculum) |
| **Tuition Growth** | **Automatic CPI-based** growth (frequency: 1, 2, or 3 years) | **Automatic CPI-based** growth (frequency: 1, 2, or 3 years) |
| **User Sets** | Base tuition, Students enrollment, CPI frequency | Base tuition, Students enrollment, CPI frequency (+ all other params) |
| **Rent Logic** | **Read-only context** - displays rent from base version | **Editable** - can switch rent models and adjust parameters |
| **Curriculum Ramp-Up** | Supports different ramp-up per curriculum (FR established, IB new) | Supports different ramp-up per curriculum (FR established, IB new) |
| **Outputs** | Revenue vs. Rent chart, EBITDA trend, Rent Load %, Utilization % per curriculum | Full 30-year projections, all 8+ charts, all tables |
| **Save Behavior** | Create scenario with tuition + enrollment (rent unchanged) | Save as new version with all changes (tuition + enrollment + rent + other) |
| **Performance** | <50ms for input changes and automatic recalculation | <50ms for any parameter change and automatic recalculation |
| **UI Layout** | 3-panel (left: rent context read-only, center: charts, right: tuition + enrollment controls) | 3-panel (left: all parameters editable, center: outputs, right: comparison) |

**When to Use Which:**

- **Tuition Simulator**: When rent model is decided and you want to explore **tuition + enrollment scenarios** (rent fixed)
- **Simulation Page**: When you want to explore **comprehensive scenarios** including rent model changes, capacity changes, tuition, and enrollment together

**CRITICAL CLARIFICATIONS:**
- **Revenue is calculated automatically**: Revenue = Tuition × Students (per curriculum, summed for total)
- **Tuition grows automatically via CPI** (frequency set by user: 1, 2, or 3 years)
- **Users set**: Base tuition, Students enrollment projections, CPI frequency
- **NO "required tuition" calculation** based on rent
- Rent is the **primary decision variable** (most important)
- Tuition + enrollment are set **independently** by the user based on rent model outcomes
- **Curriculum-specific ramp-up**: FR (established, starts high) vs. IB (new, starts from zero)

---

**Document Version:** 1.4  
**Last Updated:** November 13, 2025  
**Status:** Ready for Development  
**Approved By:** [Pending]

**Questions or Feedback?**  
Contact: [Your Email] or Schedule: [Calendar Link]



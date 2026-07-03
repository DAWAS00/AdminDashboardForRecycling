# Guidelines — Operations Enhancements (Smart Dispatch & Rider Directory)

This document outlines the design guidelines and technical implementation plan for enhancing the **Operations** section (comprising the **Dispatch** and **Users** screens) by applying advanced React, TypeScript, and Frontend engineering practices.

---

## 1. Smart Dispatch Matching System
An automated logistical matching algorithm will be introduced in the **Dispatch** screen. When an administrator selects an unassigned order:

*   **Proximity Score (40% weight):** Calculates the distance between the driver's current coordinates and the order's pickup location using the Haversine formula:
    $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
*   **Vehicle Capacity & Material Match (40% weight):**
    *   *Bulky/Heavy Waste:* Paper & Cardboard or Electronics orders prefer **Vans**. If a motorcycle is selected for an order > 20kg, a warning badge is shown, and its match score decreases.
    *   *Small/Liquid Waste:* Cooking Oil orders prefer drivers with **Oil Certification** (custom driver skill/tag) or **Motorcycles** for rapid collection in narrow streets.
*   **Urgency Match (20% weight):** If an order is flagged as `Urgent` (⚡), we boost the match score of nearby, fully idle drivers (idle for the longest duration).

---

## 2. Technical Stack & Coding Standards

### ⚛️ React Best Practices (React Skills)
*   **State Isolation:** Presentational components will consume data via custom React hooks (`useOrders`, `useRiders`, `useSuppliers`) to maintain a clean separation of concerns.
*   **Computational Optimization (`useMemo`):** The driver matching score and sorting calculations will be wrapped inside `useMemo` hooks dependencies:
    ```tsx
    const sortedRiders = useMemo(() => {
      if (!selectedOrder) return [];
      return riders
        .map(rider => ({
          ...rider,
          matchScore: calculateMatchScore(selectedOrder, rider)
        }))
        .sort((a, b) => b.matchScore - a.matchScore);
    }, [selectedOrder, riders]);
    ```
    This prevents running trigonometric distance calculations on every layout re-render (e.g. sidebar collapse toggles or clock ticks).
*   **Conditional Rendering:** Use strict boolean expressions (avoid `&&` with numbers like `0` which can print a literal `0` to the DOM). Prefer clean ternary operators or guard statements for loading/empty states.

### 🟦 TypeScript Type Safety (TypeScript Skills)
*   **Literal Types and Unions:** Avoid loose string typings. Drivers status and vehicle configurations must use strict literal type unions:
    ```typescript
    export type VehicleType = "Motorcycle" | "Van";
    export type RiderStatus = "delivering" | "picking_up" | "idle";
    ```
*   **Skills Configuration Mapping:** Define rider skills and material compatibility as typed records to ensure full compile-time validation:
    ```typescript
    export interface RiderSkill {
      id: string;
      label: string;
      icon: string;
      description: string;
    }
    ```
*   **Helper Signatures:** Ensure math helper functions (like the distance calculator) are fully typed:
    ```typescript
    function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number
    ```

### 🎨 Design & Accessibility (Frontend Skills)
*   **CSS Custom Properties:** Maintain visual design tokens defined in [globals.css](file:///e:/Dawer%20DashBorad/AdminDashboardForRecycling/src/styles/globals.css). Use `var(--color-brand-600)` for brand elements, `var(--radius-lg)` for card borders, and HSL gradients for premium recommendation highlights.
*   **Micro-Animations:** Use subtle transition states on list cards, driver detail panels, and select menus:
    ```css
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    ```
*   **Semantic HTML & Accessibility:**
    *   Interactive items must be semantic `<button>` elements with clear `aria-label` or description tags.
    *   Status badges must include readable textual descriptions for screen readers.
    *   Follow proper heading nesting levels (`h2` for section blocks, `h3` for inner cards).

---

## 3. UI Layouts & Component Modifications

### `DispatchView.tsx` (Operations Dispatch)
*   **Left Pane (Orders List):** Grouped tabs with clean, hoverable list cards showing order urgency, material icon badges, collection weights, and unassigned statuses.
*   **Right Pane (Smart Match Assignment Panel):** Displays details of the selected order and a vertical list of drivers ranked by match score.
*   **Visual Highlights:**
    *   A glowing badge indicating the **"Best Match"**.
    *   Progress bars/percentage indicators representing matching confidence.
    *   A capacity alert warning when assigning a bulky load to a motorcycle rider.

### `UsersView.tsx` (Directory Screen)
*   **Suppliers Tab:** A clean data grid filtered by contract tier (`Basic`, `Pro`, `Enterprise`) and status (`Active`, `Inactive`, `Pending`).
*   **Drivers Tab:** Dynamic profile cards detailing vehicle type, active order load progress bars (e.g. `1 / 3 assigned`), ratings, and **Operational Skills Badges** (e.g. `🛢️ Oil Handling`, `🚐 Heavy Cargo`).
*   **Skills Customizer Dialog:** A modal or expanding accordion allowing admins to manage driver certifications (toggling operational skills), which immediately updates the dispatch match scores.

---

## 4. Verification Plan

### Automated Verification
*   Confirm matching score function does not output NaN or overflow 100%.
*   Verify compilation and builds:
    ```bash
    npm run typecheck
    npm run build
    ```

### Manual Verification
1.  Navigate to **Dispatch** and select an unassigned Cooking Oil order. Check if the dispatch panel ranks drivers by match score and displays the recommended driver with a highlight badge.
2.  Assign a heavy cardboard order (>30kg) and check if the system flags motorcycle riders with a capacity warning.
3.  Go to the **Users** screen, click **Drivers**, and verify that driver profiles render their specialized skill badges, active workload progress bars, and vehicle configurations.

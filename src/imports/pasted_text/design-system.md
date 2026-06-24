
# Design System — Dawer

> Source of truth: `lib/core/constants/app_colors.dart` + `lib/core/theme/app_theme.dart`

---

## Color Tokens (`AppColors`)

### Brand Colors

| Token | Hex | Usage |
|---|---|---|
| `primaryGreen` | `#1E5C35` | Headers, active states, buttons, active nav icons |
| `primaryDark` | `#14401F` | Pressed states, gradient ends |
| `primaryLight` | `#2D8052` | Gradient midpoints (Supplier header) |
| `accentAmber` | `#C8860A` | Points badge, earnings, pending status text |
| `amberContainer` | `#FEF3C7` | Amber chip backgrounds, pending status bg |

### Neutral Colors

| Token | Hex | Usage |
|---|---|---|
| `background` | `#F4F6F5` | All screen backgrounds |
| `surface` | `#FFFFFF` | Cards, bottom sheets, dialogs |
| `mutedText` | `#64748B` | Subtitles, secondary labels, inactive nav |
| `border` | `#E2E8F0` | Input borders, dividers |

### Header Gradients (per role)

| Role | From | To |
|---|---|---|
| Driver header | `#06402B` | `#0A5E3E` |
| Supplier header | `#1E5C35` | `#2D8052` |
| Recycling Co header | `#14401F` | `#1E6B35` |
| Splash background | `#06402B` | `#002819` |
| Active trip banner (Driver) | `#1E40AF` | `#2563EB` |

### Status Colors

| Status | Arabic | Background | Text |
|---|---|---|---|
| `pending` | قيد الانتظار | `#FEF3C7` | `#C8860A` |
| `accepted` | تم القبول | `#D1FAE5` | `#1E5C35` |
| `inTransit` | في الطريق | `#DBEAFE` | `#1E40AF` |
| `completed` | مكتمل | `#DCFCE7` | `#166534` |
| `cancelled` | ملغي | `#FEE2E2` | `#991B1B` |

### Shamrock Scale (full green ramp, `#0D5B2E` → light variants)

Available in `AppColors` for use in charts, illustrations, and accent states.

---

## Typography

**Base font:** Cairo (Arabic) via `GoogleFonts.cairoTextTheme()` — applied as `MaterialApp.theme`

**Numeric / Latin font:** DM Sans — used inline for currency amounts, IDs, and Latin strings

| Use | Font | Weight | Size |
|---|---|---|---|
| App logo "دوّر" | Cairo | Bold | 48px |
| "DAWAR" subtitle | DM Sans | Regular | 20px |
| Screen titles | Cairo | Bold | via `titleLarge` |
| Body text | Cairo | Regular | 16px (default) |
| Buttons | Cairo | Bold | 17px |
| Tagline | Cairo | Regular | 14px |
| Currency amounts | DM Sans | Bold | contextual |
| OTP digits | DM Sans | Bold | 20px+ |

> Some AppBars use Manrope instead of Cairo — this is a known inconsistency to standardize.

---

## Component Specs

### GreenButton (`ui/common/green_button.dart`)

| Prop | Default | Notes |
|---|---|---|
| `text` | required | Cairo Bold 17px, white |
| `onPressed` | required | Null = disabled |
| `isLoading` | `false` | Shows `CircularProgressIndicator`, disables tap |
| `height` | `60.0` | |
| `borderRadius` | `14.0` | |
| `leadingIcon` | `null` | Optional icon before text |
| `trailingIcon` | `null` | Optional icon after text (right-aligned in RTL) |

Background: `AppColors.primaryGreen`. Full-width by default.

---

### OrderCard (`home/shared/order_card.dart`)

5 display modes via `OrderCardMode` enum:

| Mode | Context | Action Button |
|---|---|---|
| `driverAvailable` | Driver available jobs feed | "اقبل الطلب" (filled green) |
| `driverActive` | Driver current trip | "عرض التفاصيل" (outlined) |
| `supplierActive` | Supplier active order list | "عرض التفاصيل" (outlined) |
| `companyIncoming` | Recycling Co incoming | None |
| `companyJob` | Recycling Co jobs | "عرض التفاصيل" (outlined) |

**Card anatomy:**
1. **Header row:** Status chip (color-coded) + Order ID + Type icon (↑ pickup / ↓ collection)
2. **Waste chips:** Wrapped row of `WasteType` labels
3. **Address row:** Pickup → dropoff with connecting vertical line
4. **Footer:** Meta badges (distance km, ETA min, weight kg) + Reward badge (JD, amber) + Action button

---

### OTP Input Boxes (`verification_view.dart`)

- 6 individual `TextEditingController` + `FocusNode` pairs
- Box: `52px height`, `12px radius`
- Inactive: background `#E1E3E1`
- Active/focused: white background, `2px` border `#06402B`
- Auto-advance on digit entry; backspace via `onKeyEvent` moves focus backward

---

### Waste Category Chips

6 animated filter chips on Supplier home:

| Enum | Arabic | Icon |
|---|---|---|
| `paper` | ورق | `newspaper_rounded` |
| `plastic` | بلاستيك | `local_drink_rounded` |
| `metal` | معادن | `hardware_rounded` |
| `glass` | زجاج | `wine_bar_rounded` |
| `electronics` | إلكترونيات | `devices_rounded` |
| `organic` | عضوي | `eco_rounded` |

---

### Bottom Sheets

Both `_NewRequestSheet` (Supplier) and `_PostJobSheet` (Recycling Co) use standard `showModalBottomSheet` with:
- White surface background
- Waste type multi-select chips
- `GreenButton` CTA (enabled only when required fields filled)
- Supplier sheet: notes text field (3 lines, optional)
- Recycling Co sheet: area input (required) + notes (optional)

---

## Asset Constants (`AppAssets`)

All sourced via Figma MCP URLs:

| Constant | Description |
|---|---|
| `imgEnvironmentalMinistry` | Ministry of Environment logo |
| `imgGovernmentSeal` | Government seal |
| `imgDawarIconDark` | Dawer logo for dark backgrounds |
| `imgDawarIconLight` | Dawer logo for light backgrounds |
| `iconRecycling` | Role icon — Recycling Company |
| `iconSupplier` | Role icon — Supplier |
| `iconDriver` | Role icon — Driver |
| `iconLock` | Lock icon (security contexts) |
| `iconArrowRight` | Navigation arrow |
| `iconFingerprint` | Biometric icon |

---

## Related

- [[Projects/Dawer/Architecture]]
- [[Design/Mobile Apps/Dawer/Screen Specs]]
- [[Design/Mobile Apps/Dawer/App Overview]]

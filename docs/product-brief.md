# FloraVision Product Brief

## Product Summary

FloraVision is a florist operating system. It is not just a checkout screen or catalog manager. It combines point of sale, customer history, delivery operations, employee accountability, marketing reminders, proposals, and inventory awareness in one product.

The source workflow assumption is critical: floral designers work freestyle. Software must support artistic decision-making and substitutions instead of forcing fixed recipes.

## Users

- Shop owner
- Manager/controller
- Floral designer
- Delivery driver
- Front counter staff
- Event/wedding coordinator

## Product Principles

- Search-first: every major action should be reachable through direct search
- Mobile-first: tablet and phone workflows matter as much as desktop
- Elegant UI: modern, classy, polished, lightly whimsical
- Low-friction operations: reduce clicks, dropdown depth, and duplicate entry
- Accountability without clutter: clock-in, scan, photo, and delivery proof should be obvious
- Assist creativity: suggest, track, and highlight inventory without boxing designers in

## Core Problem Areas

### 1. Navigation friction

Legacy floral POS systems bury actions under nested menus. Users either memorize structure or waste time hunting.

Desired outcome:

- global search / command palette
- direct jump to records, reports, settings, and workflows

### 2. Inventory truth gap

Shops struggle to reconcile:

- what was ordered
- what was used
- what spoiled
- what was substituted
- what is physically in the cooler

Desired outcome:

- flexible inventory movements
- quick adjustments
- waste logging
- substitution tracking
- eventual computer vision support

### 3. Delivery accountability

Floral deliveries often include multiple non-floral components and special handoff conditions.

Desired outcome:

- scan-and-confirm loading
- item-specific reminders
- route management
- delivery status options
- required photo proof

### 4. Staff accountability

Employees forget to clock in/out, creating payroll cleanup and weak operational visibility.

Desired outcome:

- prominent time clock
- geofence/network-aware reminders
- manager override with audit trail

## Main Product Areas

### Orders

- recent orders
- standing and recurring orders
- designer assignment
- payment tracking
- pickup/delivery confirmation
- barcode scanning
- multi-item checklists

### Customers

- fast customer search
- merge duplicate profiles
- invoices/statements
- balance and payment history
- order history with arrangement and delivery photos

### Marketing

- reminders for birthdays, anniversaries, holidays
- SMS/email/social campaigns
- employee notifications for overnight and priority orders

### Configuration

- delivery fee maps/zones
- product setup and shorthand codes
- price tiers
- user accounts and permissions
- web admin controls

### Proposals

- weddings, funerals, parties, corporate events
- itemized proposal builder
- elegant email-ready output
- printable backup version

### Procurement

- purchase orders
- receiving
- inventory transfers

### Reports

- daily cash
- analytics by day/week/month/year
- multi-year comparisons
- designer performance
- payroll and attendance

### Time Clock

- clock in/out
- reminder gating before work actions
- override tracking

### Delivery App

- route list
- scan on load
- delivery mode dropdown
- notes requirement for custom statuses
- proof-of-delivery photo

## Signature Differentiators

### Universal Search

Mac Spotlight style entry point for navigation and records.

Examples:

- `rose inventory`
- `today's deliveries`
- `designer payroll`
- `order 10428`

### Freestyle Design Logging

Inventory must allow designers to work from visual instinct and substitutions, not fixed BOM-only recipes.

Examples:

- quick tap stem logging
- voice capture in future iterations
- substitution-aware inventory adjustments

### Cooler Vision

Future-facing feature set:

- camera-assisted flower/color detection
- approximate counts
- freshness and urgency cues
- “prettiest in the cooler” recommendations

### Delivery Component Accountability

Orders that include flowers plus extras must explicitly list all required pieces during design and loading.

Example:

- `Bouquet`
- `Teddy Bear`
- `Chocolate Box`

### KPI Dashboard

Fast owner visibility into:

- sales by type
- sales by designer
- order volume
- late deliveries
- waste risk
- labor exceptions

## MVP Recommendation

Build the first version around five workflows:

1. Universal search and navigation
2. Order board with designer assignment and statuses
3. Customer history with photo timeline
4. Delivery loading/proof workflow
5. KPI dashboard with designer/shop rollups

## Post-MVP Phases

### Phase 2

- time clock and attendance exceptions
- proposals/events module
- procurement and receiving
- marketing reminders

### Phase 3

- inventory movement engine
- substitution tracking
- waste logging
- seasonal/holiday forecasting

### Phase 4

- cooler vision
- AI suggestions
- live inventory-aware web publishing

## Technical Direction

Suggested architecture once implementation moves beyond prototype:

- Frontend: React or Next.js web app with strong tablet/mobile support
- Backend: typed API with relational data model
- Database: PostgreSQL
- Auth: role-based access for owner, manager, designer, driver
- Storage: cloud object storage for arrangement and delivery photos
- Maps: route and zone services for deliveries
- Notifications: SMS, email, and push

## Success Criteria

The product is succeeding if a florist can:

- find any function without dropdown hunting
- see what matters today in under 10 seconds
- verify delivery contents before a driver leaves
- review customer photo history during a phone call
- catch labor and inventory issues without back-office cleanup

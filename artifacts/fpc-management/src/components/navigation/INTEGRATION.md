# FPC navigation integration

## Mount

```tsx
import { FpcNavigation } from "@/components/navigation";

<FpcNavigation
  role={role}
  currentPath={path}
  onNavigate={(route) => setPath(route)}
  username={user.name}
  initials={user.initials}
  offline={state.offline}
  onOfflineToggle={() => setState((value) => ({ ...value, offline: !value.offline }))}
  badges={{ approvals: 7 }}
  recordName={farmerName}
/>
```

`FpcNavigation` renders the responsive sidebar/drawer, page-context breadcrumbs,
keyboard command palette, and member-only bottom tabs/More sheet. The component
does not render or alter page content. It owns only its navigation preferences
and UI state. All storage access is guarded.

`NavigationSidebar` and `NavigationBreadcrumbs` are available independently for
shells that already render their own mobile toolbar or header. Use
`getActiveNavigationModule(role, path)` for the small module caption above a
page title. `getNavigationBreadcrumbs(role, path, recordName)` exposes the
same resolved breadcrumb model to custom headers.

## Route integration

Use the routes in `navigationConfig` as canonical navigation destinations.
`/farmers`, `/farmers/new`, `/farmers/deleted`, `/farmers/multi-fpc`, and
`/farmers/:id` are explicit. `detailRoute` represents a record-detail pattern,
not another menu item. Group headers without a `route` are disclosure controls,
never links. `onNavigate` is deliberately supplied by the host so the existing
Wouter router remains the sole navigation mechanism.

The host router must resolve these nested canonical paths to existing page
screens and retain redirects from any legacy paths it previously exposed.
This integration layer was not changed here, as requested. For record routes,
pass the record's display name in `recordName` to the breadcrumb component.

## Acceptance notes

- FPC Admin configuration has exactly 10 top-level modules and the requested
  child structure; farmer register/deleted/multi-FPC routes are grouped beneath
  Farmer Management.
- All 12 declared roles have their own tree. Children are filtered through the
  existing `can(role, module, "V")` and node role metadata; groups with no
  permitted children disappear.
- Route matching, active child/parent state, breadcrumbs, menu search and
  command results all consume the same filtered configuration.
- A fresh page load expands the current route's group. Open-group, multiple
  group and desktop-collapse preferences are per-role and localStorage-safe.
- Responsive desktop collapse, tablet/mobile drawer, Farmer/Shareholder bottom
  tabs and grouped More sheet are implemented.
- Legacy redirect behavior must be wired in the host router; this module does
  not edit `App.tsx` or any content page.

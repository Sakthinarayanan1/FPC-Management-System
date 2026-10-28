import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Command, Menu,
  Leaf, MoreHorizontal, Search, X,
} from "lucide-react";
import type { Role } from "@/lib/config";
import {
  getActiveNavigationModule, getNavigationBreadcrumbs, getRoleNavigation,
  type NavigationNode,
} from "./navConfig";
import "./navigation.css";

export type FpcNavigationProps = {
  role: Role;
  currentPath: string;
  onNavigate: (route: string) => void;
  username?: string;
  initials?: string;
  offline?: boolean;
  onOfflineToggle?: () => void;
  recordName?: string;
  badges?: Record<string, number>;
  fpcName?: string;
  className?: string;
  showBreadcrumbs?: boolean;
};

const safeRead = (key: string): string | null => {
  try { return window.localStorage.getItem(key); } catch { return null; }
};
const safeWrite = (key: string, value: string) => {
  try { window.localStorage.setItem(key, value); } catch { /* storage may be unavailable */ }
};
const keyForRole = (role: Role, suffix: string) => `fpc-nav:${encodeURIComponent(role)}:${suffix}`;
const cleanPath = (path: string) => {
  const p = decodeURIComponent(path.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  return p === "/fpc-profile/change-history" ? "/reports/change-history" : p;
};
const matches = (route: string | undefined, path: string) => {
  if (!route) return false;
  const a = cleanPath(route).split("/").filter(Boolean);
  const b = cleanPath(path).split("/").filter(Boolean);
  return a.length === b.length && a.every((part, i) => part.startsWith(":") || part === b[i]);
};
const flatten = (nodes: readonly NavigationNode[]): NavigationNode[] =>
  nodes.flatMap((node) => [node, ...(node.children ? flatten(node.children) : [])]);

function activeChildId(nodes: readonly NavigationNode[], path: string): string | undefined {
  for (const parent of nodes) {
    const children = parent.children ?? [];
    const direct = children.find((child) => child.route && !child.route.includes(":") && matches(child.route, path))
      ?? children.find((child) => child.route && matches(child.route, path));
    if (direct) return direct.id;
    const detail = children.find((child) => matches(child.detailRoute, path));
    if (detail) return detail.id;
    if (!parent.children && matches(parent.route, path)) return parent.id;
  }
  return undefined;
}

function parentForRoute(nodes: readonly NavigationNode[], path: string): string | undefined {
  for (const parent of nodes) {
    const children = parent.children ?? [];
    if (children.some((child) => child.route && !child.route.includes(":") && matches(child.route, path))) return parent.id;
    if (children.some((child) => matches(child.route, path) || matches(child.detailRoute, path))) return parent.id;
  }
  return nodes.find((node) => matches(node.route, path))?.id;
}

function Badge({ count, collapsed = false }: { count: number; collapsed?: boolean }) {
  if (!count) return null;
  return <span className={`fpc-nav-badge${collapsed ? " is-rollup" : ""}`} aria-label={`${count} pending`}>
    {count > 99 ? "99+" : count}
  </span>;
}

export function NavigationBreadcrumbs({
  role, currentPath, recordName, onNavigate, className = "",
}: Pick<FpcNavigationProps, "role" | "currentPath" | "recordName" | "onNavigate"> & { className?: string }) {
  const crumbs = getNavigationBreadcrumbs(role, currentPath, recordName);
  if (!crumbs.length) return null;
  const moduleLabel = crumbs[0].label;
  return <nav className={`fpc-breadcrumbs ${className}`} aria-label="Breadcrumb" data-testid="navigation-breadcrumbs">
    <span className="fpc-breadcrumb-module">{moduleLabel}</span>
    <div className="fpc-breadcrumb-path">
      {crumbs.map((crumb, index) => <span className="fpc-crumb-piece" key={`${crumb.id}-${index}`}>
        {index > 0 && <ChevronRight size={13} aria-hidden="true" />}
        {crumb.current
          ? <span className="fpc-crumb-current" aria-current="page" data-testid={`breadcrumb-${crumb.id}`}>{crumb.label}</span>
          : <button type="button" onClick={() => onNavigate(crumb.route)} data-testid={`breadcrumb-${crumb.id}`}>{crumb.label}</button>}
      </span>)}
    </div>
  </nav>;
}

type TreeProps = {
  currentPath: string;
  nodes: NavigationNode[];
  onNavigate: (route: string) => void;
  collapsed: boolean;
  openGroups: string[];
  allowMultiple: boolean;
  onToggleGroup: (id: string) => void;
  badges: Record<string, number>;
  search: string;
  onAfterNavigate: () => void;
  flyoutId: string | null;
  flyoutTop: number;
  setFlyoutId: (id: string | null) => void;
  setFlyoutTop: (top: number) => void;
  showPreferences: boolean;
  onToggleMultiple: () => void;
}

function NavigationTree({
  currentPath, nodes, onNavigate, collapsed, openGroups, allowMultiple,
  onToggleGroup, badges, search, onAfterNavigate, flyoutId, flyoutTop, setFlyoutId,
  setFlyoutTop, showPreferences, onToggleMultiple,
}: TreeProps) {
  const currentId = activeChildId(nodes, currentPath);
  const query = search.trim().toLocaleLowerCase();
  const visibleNodes = nodes.flatMap((parent) => {
    if (!query) return [parent];
    const children = (parent.children ?? []).filter((child) =>
      child.label.toLocaleLowerCase().includes(query) ||
      parent.label.toLocaleLowerCase().includes(query));
    if (children.length) return [{ ...parent, children }];
    if (!parent.children && parent.label.toLocaleLowerCase().includes(query)) return [parent];
    return [];
  });
  const buttonsRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const openFlyout = (id: string, top?: number) => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    setFlyoutId(id);
    if (top !== undefined) setFlyoutTop(Math.max(8, Math.min(top, window.innerHeight - 360)));
  };
  const closeFlyoutSoon = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setFlyoutId(null), 120);
  };
  const onKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && flyoutId) {
      event.preventDefault();
      setFlyoutId(null);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const elements = Array.from(buttonsRef.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), a[href]",
    ) ?? []).filter((element) => !element.closest("[aria-hidden='true']"));
    const current = elements.indexOf(document.activeElement as HTMLElement);
    if (current < 0 || !elements.length) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? elements.length - 1
      : (current + (event.key === "ArrowDown" ? 1 : -1) + elements.length) % elements.length;
    elements[next]?.focus();
  };

  const renderLeaf = (item: NavigationNode, child = false) => {
    const active = currentId === item.id;
    const count = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;
    return <button
      type="button"
      key={item.id}
      className={`fpc-nav-item${child ? " is-child" : ""}${active ? " is-active" : ""}`}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      onClick={() => { if (item.route) onNavigate(item.route); onAfterNavigate(); }}
      data-testid={`nav-link-${item.id}`}
    >
      {child && <span className="fpc-child-marker" aria-hidden="true" />}
      {!child && <item.icon className="fpc-nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" />}
      <span className="fpc-nav-label">{item.label}</span>
      <Badge count={count} />
    </button>;
  };

  return <div className="fpc-nav-middle" ref={buttonsRef} onKeyDown={onKeyboard} data-testid="navigation-menu">
    {visibleNodes.map((parent) => {
      const hasChildren = Boolean(parent.children?.length);
      const isOpen = Boolean(query) || openGroups.includes(parent.id);
      const containsActive = parent.children?.some((child) => child.id === currentId) ?? false;
      const parentCount = (parent.children ?? []).reduce((total, child) =>
        total + (child.badgeKey ? badges[child.badgeKey] ?? 0 : 0), 0);
      if (!hasChildren) return renderLeaf(parent);
      return <div
        className={`fpc-nav-group${isOpen ? " is-open" : ""}${containsActive ? " has-active" : ""}${flyoutId === parent.id ? " has-flyout" : ""}`}
        key={parent.id}
        onMouseEnter={(event) => collapsed && openFlyout(parent.id, event.currentTarget.getBoundingClientRect().top)}
        onMouseLeave={() => collapsed && closeFlyoutSoon()}
        data-testid={`nav-group-${parent.id}`}
      >
        <button
          type="button"
          className="fpc-nav-item fpc-nav-parent"
          title={collapsed ? parent.label : undefined}
          aria-expanded={collapsed ? flyoutId === parent.id : isOpen}
          aria-controls={`nav-children-${parent.id}`}
          onClick={(event) => collapsed
            ? openFlyout(parent.id, event.currentTarget.getBoundingClientRect().top)
            : onToggleGroup(parent.id)}
          data-testid={`nav-toggle-${parent.id}`}
        >
          <parent.icon className="fpc-nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" />
          <span className="fpc-nav-label">{parent.label}</span>
          {collapsed ? <Badge count={parentCount} collapsed /> : <>
            <Badge count={parentCount} collapsed={!isOpen} />
            <ChevronDown size={14} className="fpc-nav-chevron" aria-hidden="true" />
          </>}
          {containsActive && <span className="fpc-parent-dot" aria-label="Contains current page" />}
        </button>
        <div
          className={`fpc-nav-children${collapsed ? " is-flyout" : ""}`}
          id={`nav-children-${parent.id}`}
          aria-hidden={collapsed || !isOpen}
          inert={collapsed || !isOpen}
          role="group"
          aria-label={`${parent.label} menu`}
        >
          {parent.children?.map((child, index) => {
            const previousCaption = parent.children?.[index - 1]?.caption;
            return <span className="fpc-nav-child-wrap" key={child.id}>
              {child.caption && child.caption !== previousCaption && <span className="fpc-nav-caption">{child.caption}</span>}
              {renderLeaf(child, true)}
            </span>;
          })}
        </div>
      </div>;
    })}
    {!visibleNodes.length && <div className="fpc-nav-empty" role="status">No permitted menu items match.</div>}
    {showPreferences && !collapsed && <button
      type="button"
      className="fpc-nav-preference"
      aria-pressed={allowMultiple}
      onClick={onToggleMultiple}
      data-testid="toggle-multiple-groups"
    >
      <span>{allowMultiple ? "Multiple groups" : "One group at a time"}</span>
      <span className={`fpc-nav-switch${allowMultiple ? " is-on" : ""}`} aria-hidden="true"><i /></span>
    </button>}
    {collapsed && flyoutId && (() => {
      const parent = nodes.find((node) => node.id === flyoutId);
      if (!parent?.children?.length) return null;
      return <div className="fpc-nav-floating-flyout" role="group" aria-label={`${parent.label} menu`}
        onMouseEnter={() => openFlyout(parent.id)} onMouseLeave={closeFlyoutSoon}
        style={{ top: `${flyoutTop}px`, marginTop: 0 }}
        data-testid={`nav-flyout-${parent.id}`}>
        <h3><parent.icon size={16} />{parent.label}</h3>
        {parent.children.map((child, index) => <span className="fpc-nav-child-wrap" key={child.id}>
          {child.caption && child.caption !== parent.children?.[index - 1]?.caption && <span className="fpc-nav-caption">{child.caption}</span>}
          {renderLeaf(child, true)}
        </span>)}
      </div>;
    })()}
  </div>;
}

export function NavigationCommandPalette({
  role, currentPath, onNavigate, open, onClose, badges = {},
}: Pick<FpcNavigationProps, "role" | "currentPath" | "onNavigate" | "badges"> & {
  open: boolean; onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodes = useMemo(() => getRoleNavigation(role), [role]);
  const matchesList = useMemo(() => {
    const term = query.toLocaleLowerCase().trim();
    return nodes.flatMap((parent) => (parent.children ?? [parent]).map((node) => ({
      node, parent,
      label: `${parent.label} > ${node.label}`,
    }))).filter(({ label }) => !term || label.toLocaleLowerCase().includes(term));
  }, [nodes, query]);
  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);
  useEffect(() => setCursor((old) => Math.min(old, Math.max(matchesList.length - 1, 0))), [matchesList.length]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>(".fpc-command");
        const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>(
          "input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ) ?? []);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (event.key === "ArrowDown") { event.preventDefault(); setCursor((old) => Math.min(old + 1, matchesList.length - 1)); }
      if (event.key === "ArrowUp") { event.preventDefault(); setCursor((old) => Math.max(0, old - 1)); }
      if (event.key === "Enter" && matchesList[cursor]?.node.route) {
        event.preventDefault();
        onNavigate(matchesList[cursor].node.route!);
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, matchesList, cursor, onClose, onNavigate]);
  if (!open) return null;
  return <div className="fpc-command-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="fpc-command" role="dialog" aria-modal="true" aria-label="Search menu" data-testid="command-palette">
      <div className="fpc-command-input-wrap"><Search size={18} aria-hidden="true" />
        <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder="Search every permitted page…" aria-label="Search menu destinations" aria-controls="fpc-command-results"
          data-testid="input-command-search" />
        <kbd>ESC</kbd>
      </div>
      <div className="fpc-command-results" id="fpc-command-results" role="listbox" aria-label="Menu destinations">
        {matchesList.map(({ node, parent, label }, index) => {
          const active = matches(node.route, currentPath);
          const count = node.badgeKey ? badges[node.badgeKey] ?? 0 : 0;
          return <button type="button" role="option" aria-selected={cursor === index} aria-current={active ? "page" : undefined}
            className={`fpc-command-option${cursor === index ? " is-selected" : ""}`}
            key={node.id} onMouseEnter={() => setCursor(index)}
            onClick={() => { if (node.route) onNavigate(node.route); onClose(); }}
            data-testid={`command-result-${node.id}`}>
            <span><small>{parent.label}</small><b>{node.label}</b></span>
            {count > 0 && <Badge count={count} />}
            <span className="fpc-command-path">{label}</span>
          </button>;
        })}
        {!matchesList.length && <div className="fpc-command-empty">No matching pages in this workspace.</div>}
      </div>
      <footer className="fpc-command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span><span>Results respect your role permissions</span></footer>
    </section>
  </div>;
}

export function NavigationSidebar({
  role, currentPath, onNavigate, username = "Workspace User", initials = "WU",
  offline = false, onOfflineToggle, badges = {}, fpcName = "Green Valley FPC",
  className = "", mobileOpen = false, onClose, onOpenPalette,
}: FpcNavigationProps & {
  mobileOpen?: boolean;
  onClose?: () => void;
  onOpenPalette?: () => void;
}) {
  const nodes = useMemo(() => getRoleNavigation(role), [role]);
  const [collapsed, setCollapsed] = useState(() => safeRead(keyForRole(role, "collapsed")) === "true");
  const [allowMultiple, setAllowMultiple] = useState(() => safeRead(keyForRole(role, "multi")) === "true");
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    try {
      const value = safeRead(keyForRole(role, "open"));
      const parsed = value ? JSON.parse(value) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch { return []; }
  });
  const [search, setSearch] = useState("");
  const [flyoutId, setFlyoutId] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState(120);
  const activeParent = parentForRoute(nodes, currentPath);

  useEffect(() => {
    setCollapsed(safeRead(keyForRole(role, "collapsed")) === "true");
    setAllowMultiple(safeRead(keyForRole(role, "multi")) === "true");
    try {
      const value = safeRead(keyForRole(role, "open"));
      const parsed = value ? JSON.parse(value) : [];
      setOpenGroups(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
    } catch { setOpenGroups([]); }
    setSearch("");
    setFlyoutId(null);
  }, [role]);
  useEffect(() => {
    if (!activeParent || collapsed) return;
    setOpenGroups((old) => {
      const next = allowMultiple ? Array.from(new Set([...old, activeParent])) : [activeParent];
      safeWrite(keyForRole(role, "open"), JSON.stringify(next));
      return next;
    });
  }, [activeParent, allowMultiple, collapsed, role]);
  useEffect(() => safeWrite(keyForRole(role, "collapsed"), String(collapsed)), [collapsed, role]);
  useEffect(() => safeWrite(keyForRole(role, "multi"), String(allowMultiple)), [allowMultiple, role]);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((old) => {
      const next = old.includes(id) ? old.filter((item) => item !== id)
        : allowMultiple ? [...old, id] : [id];
      safeWrite(keyForRole(role, "open"), JSON.stringify(next));
      return next;
    });
  }, [allowMultiple, role]);
  const close = useCallback(() => { onClose?.(); setFlyoutId(null); }, [onClose]);
  const afterNavigate = useCallback(() => { close(); setSearch(""); }, [close]);
  const toggleMultiple = useCallback(() => {
    setAllowMultiple((value) => {
      const next = !value;
      if (!next && openGroups.length > 1) {
        const keep = activeParent && openGroups.includes(activeParent) ? activeParent : openGroups.at(-1)!;
        setOpenGroups([keep]);
        safeWrite(keyForRole(role, "open"), JSON.stringify([keep]));
      }
      return next;
    });
  }, [activeParent, openGroups, role]);

  const tree = <NavigationTree
    currentPath={currentPath} nodes={nodes} onNavigate={onNavigate}
    collapsed={collapsed && !mobileOpen} openGroups={openGroups} allowMultiple={allowMultiple}
    onToggleGroup={toggleGroup} badges={badges} search={search} onAfterNavigate={afterNavigate}
    flyoutId={flyoutId} setFlyoutId={setFlyoutId} showPreferences={!mobileOpen}
    flyoutTop={flyoutTop} setFlyoutTop={setFlyoutTop}
    onToggleMultiple={toggleMultiple}
  />;

  return <>
    <button type="button" className={`fpc-nav-backdrop${mobileOpen ? " is-visible" : ""}`}
      onClick={close} aria-label="Close navigation" tabIndex={mobileOpen ? 0 : -1} data-testid="button-close-navigation" />
    <aside className={`fpc-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""} ${className}`}
      aria-label="Primary navigation" data-testid="navigation-sidebar">
      <div className="fpc-sidebar-brand">
        <div className="fpc-brand-row">
          <span className="fpc-brand-mark" aria-hidden="true"><Leaf size={19} /></span>
          <span className="fpc-brand-name"><b>FPC Desk</b><small>{fpcName}</small></span>
          <button className="fpc-close-mobile" type="button" onClick={close} aria-label="Close menu" data-testid="button-navigation-close"><X size={18} /></button>
        </div>
        <div className="fpc-sidebar-top-actions">
          <label className="fpc-menu-search">
            <Search size={16} aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu"
              aria-label="Search menu" data-testid="input-menu-search" />
            <kbd>⌘K</kbd>
          </label>
          <button type="button" className="fpc-command-trigger" onClick={onOpenPalette}
            aria-label="Open command palette" title="Search menu (Ctrl+K)" data-testid="button-command-palette">
            <Command size={15} /><span>Search pages</span><kbd>Ctrl K</kbd>
          </button>
        </div>
      </div>
      {tree}
      <div className="fpc-sidebar-bottom">
        <div className={`fpc-sync-card${offline ? " is-offline" : ""}`} data-testid="status-sync">
          <span className={`fpc-sync-dot${offline ? " is-offline" : ""}`} />
          <span className="fpc-sync-copy"><b>{offline ? "Offline mode" : "Connected"}</b><small>{offline ? "Changes sync when online" : "All changes synced"}</small></span>
          {onOfflineToggle && <button type="button" onClick={onOfflineToggle} aria-label={`Turn ${offline ? "on" : "off"}line mode`}
            aria-pressed={offline} data-testid="button-offline-toggle"><span className={`fpc-nav-switch${offline ? " is-on" : ""}`}><i /></span></button>}
        </div>
        <div className="fpc-profile-card" data-testid="navigation-profile">
          <span className="fpc-user-avatar">{initials.slice(0, 2).toUpperCase()}</span>
          <span className="fpc-user-copy"><b>{username}</b><small>{role}</small></span>
          <button type="button" className="fpc-collapse-toggle" onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"} data-testid="button-collapse-navigation">
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>
      </div>
    </aside>
  </>;
}

function MemberBottomNavigation({
  role, currentPath, onNavigate, onOpenMore,
}: Pick<FpcNavigationProps, "role" | "currentPath" | "onNavigate"> & { onOpenMore: () => void }) {
  const all = getRoleNavigation(role);
  const allItems = flatten(all).filter((node) => node.route);
  const preferredLabels = role === "Farmer"
    ? ["Home", "Sell Produce", "Buy Inputs", "Wallet"]
    : ["Home", "My Shares", "FPC", "Meetings"];
  const tabs = preferredLabels.map((label) => allItems.find((node) => node.label === label)).filter((node): node is NavigationNode => Boolean(node));
  return <nav className="fpc-member-tabs" aria-label="Member shortcuts" data-testid="member-bottom-tabs">
    {tabs.map((node) => {
      const active = matches(node.route, currentPath);
      return <button type="button" key={node.id} onClick={() => node.route && onNavigate(node.route)}
        aria-current={active ? "page" : undefined} data-testid={`member-tab-${node.id}`}>
        <node.icon size={19} strokeWidth={1.8} /><span>{node.label}</span>
      </button>;
    })}
    <button type="button" onClick={onOpenMore} data-testid="button-member-more"><MoreHorizontal size={19} /><span>More</span></button>
  </nav>;
}

export function MemberMoreSheet({
  role, currentPath, onNavigate, open, onClose,
}: Pick<FpcNavigationProps, "role" | "currentPath" | "onNavigate"> & { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const nodes = getRoleNavigation(role);
  return <div className="fpc-more-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="fpc-more-sheet" role="dialog" aria-modal="true" aria-label="More menu" data-testid="member-more-sheet">
      <header><span><small>WORKSPACE MENU</small><b>More from your FPC</b></span>
        <button type="button" onClick={onClose} aria-label="Close more menu" data-testid="button-close-more"><X size={19} /></button></header>
      <div className="fpc-more-scroll">
        {nodes.map((parent) => <section className="fpc-more-group" key={parent.id}>
          <h3><parent.icon size={16} />{parent.label}</h3>
          {(parent.children ?? [parent]).map((child) => <button type="button" key={child.id}
            aria-current={matches(child.route, currentPath) ? "page" : undefined}
            onClick={() => { if (child.route) onNavigate(child.route); onClose(); }}
            data-testid={`more-link-${child.id}`}>{child.label}<ChevronRight size={15} /></button>)}
        </section>)}
      </div>
    </section>
  </div>;
}

export function FpcNavigation(props: FpcNavigationProps) {
  const {
    role, currentPath, onNavigate, showBreadcrumbs = true, badges = {},
  } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const memberRole = role === "Farmer" || role === "Shareholder";
  const paletteButtonRef = useRef<HTMLButtonElement>(null);
  const paletteWasOpen = useRef(false);
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
        setMoreOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  useEffect(() => {
    if (paletteOpen) {
      paletteWasOpen.current = true;
    } else if (paletteWasOpen.current) {
      paletteWasOpen.current = false;
      if (window.matchMedia("(max-width: 960px)").matches) paletteButtonRef.current?.focus();
      else document.querySelector<HTMLButtonElement>(".fpc-command-trigger")?.focus();
    }
  }, [paletteOpen]);
  const handleNavigate = useCallback((route: string) => {
    onNavigate(route);
    setMobileOpen(false);
    setMoreOpen(false);
  }, [onNavigate]);
  const moduleLabel = getActiveNavigationModule(role, currentPath);

  return <div className={`fpc-navigation ${memberRole ? "is-member" : ""}`} data-testid="fpc-navigation">
    <div className="fpc-mobile-toolbar">
      <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation menu"
        aria-expanded={mobileOpen} data-testid="button-open-navigation"><Menu size={20} /></button>
      <span className="fpc-mobile-brand"><Leaf size={16} /> FPC Desk</span>
      <button ref={paletteButtonRef} type="button" onClick={() => setPaletteOpen(true)}
        aria-label="Search menu" data-testid="button-mobile-search"><Search size={18} /></button>
    </div>
    <NavigationSidebar {...props} onNavigate={handleNavigate} mobileOpen={mobileOpen}
      onClose={() => setMobileOpen(false)} onOpenPalette={() => setPaletteOpen(true)} />
    {showBreadcrumbs && <div className="fpc-navigation-context" data-module={moduleLabel}>
      <NavigationBreadcrumbs role={role} currentPath={currentPath} recordName={props.recordName} onNavigate={handleNavigate} />
    </div>}
    {memberRole && <MemberBottomNavigation role={role} currentPath={currentPath} onNavigate={handleNavigate}
      onOpenMore={() => setMoreOpen(true)} />}
    {memberRole && <MemberMoreSheet role={role} currentPath={currentPath} onNavigate={handleNavigate}
      open={moreOpen} onClose={() => setMoreOpen(false)} />}
    <NavigationCommandPalette role={role} currentPath={currentPath} onNavigate={handleNavigate}
      open={paletteOpen} onClose={() => setPaletteOpen(false)} badges={badges} />
  </div>;
}

export const Navigation = FpcNavigation;
export default FpcNavigation;

"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, DataTable, Select, StatTile, Tabs, TextField, type Column } from "@/design-system";
import { CURRENT_USER, generateExceptions, type ExceptionType, type Severity, type ShipmentException } from "@/lib/data";
import { severityRank, severityTone, slaLabel, slaTone, statusTone } from "@/lib/format";
import { ExceptionPanel } from "./ExceptionPanel";
import { TypeChart } from "./TypeChart";

type View = "mine" | "unassigned" | "open" | "resolved";
type Demo = "live" | "loading" | "error" | "empty";

const SEVERITIES = [
  { value: "all", label: "All severities" },
  ...(["Critical", "High", "Medium", "Low"] as Severity[]).map((s) => ({ value: s, label: s })),
];

export function Console() {
  const [items, setItems] = useState<ShipmentException[]>(() => generateExceptions());
  const [demo, setDemo] = useState<Demo>("live");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("open");
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  const [type, setType] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: ShipmentException } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Demo states can be opened directly with ?demo=loading|error|empty, so reviewers can see them.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("demo") as Demo | null;
    if (param && ["loading", "error", "empty"].includes(param)) setDemo(param);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const source = demo === "empty" ? [] : items;
  const open = source.filter((e) => e.status !== "Resolved");

  const byView: Record<View, ShipmentException[]> = {
    mine: open.filter((e) => e.assignee === CURRENT_USER),
    unassigned: open.filter((e) => !e.assignee),
    open,
    resolved: source.filter((e) => e.status === "Resolved"),
  };

  const q = query.trim().toLowerCase();
  const filtered = byView[view].filter(
    (e) =>
      (severity === "all" || e.severity === severity) &&
      (type === "all" || e.type === type) &&
      (!q || [e.id, e.customer, e.contents, e.carrier, e.type].some((f) => f.toLowerCase().includes(q)))
  );

  const filtersOn = query !== "" || severity !== "all" || type !== "all";
  const clearFilters = () => {
    setQuery("");
    setSeverity("all");
    setType("all");
  };

  // Every change keeps a copy of the record so it can be undone from the toast.
  const update = useCallback(
    (id: string, change: (e: ShipmentException) => ShipmentException, text: string) => {
      const before = items.find((e) => e.id === id);
      setItems((prev) => prev.map((e) => (e.id === id ? change(e) : e)));
      setToast({ text, undo: before });
    },
    [items]
  );

  const undo = () => {
    if (!toast?.undo) return;
    const original = toast.undo;
    setItems((prev) => prev.map((e) => (e.id === original.id ? original : e)));
    setToast({ text: `Undone. ${original.id} is back to ${original.status}.` });
  };

  const selected = items.find((e) => e.id === selectedId) ?? null;
  const breached = open.filter((e) => e.slaMinutes < 0).length;
  const dueSoon = open.filter((e) => e.slaMinutes >= 0 && e.slaMinutes <= 60);
  const unassignedDueSoon = dueSoon.filter((e) => !e.assignee).length;

  const columns: Column<ShipmentException>[] = [
    {
      key: "sla",
      header: "SLA",
      sortValue: (e) => e.slaMinutes,
      render: (e) => (e.status === "Resolved" ? <span className="oc-muted">Met</span> : <Badge tone={slaTone(e.slaMinutes)}>{slaLabel(e.slaMinutes)}</Badge>),
    },
    {
      key: "severity",
      header: "Severity",
      sortValue: (e) => severityRank[e.severity],
      render: (e) => <Badge tone={severityTone[e.severity]} dot>{e.severity}</Badge>,
    },
    {
      key: "type",
      header: "Exception",
      sortValue: (e) => e.type,
      render: (e) => (
        <div>
          <div className="oc-strong">{e.type}</div>
          <div className="oc-muted oc-mono">{e.id}</div>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (e) => e.customer,
      render: (e) => (
        <div>
          <div>{e.customer}</div>
          <div className="oc-muted">{e.contents}</div>
        </div>
      ),
    },
    { key: "facility", header: "Facility", sortValue: (e) => e.facility },
    {
      key: "assignee",
      header: "Owner",
      sortValue: (e) => e.assignee ?? "~",
      render: (e) => (e.assignee ? (e.assignee === CURRENT_USER ? "You" : e.assignee) : <span className="oc-muted">Unassigned</span>),
    },
    { key: "status", header: "Status", render: (e) => <Badge tone={statusTone[e.status]}>{e.status}</Badge> },
  ];

  const isLoading = loading || demo === "loading";

  const queue = (
    <div className="oc-stack">
      <div className="oc-filters" role="search" aria-label="Filter exceptions">
        <TextField label="Search" placeholder="Shipment ID, customer, carrier" value={query} onChange={(e) => setQuery(e.target.value)} type="search" />
        <Select label="Severity" options={SEVERITIES} value={severity} onChange={(e) => setSeverity(e.target.value)} />
        <Select
          label="Type"
          options={[{ value: "all", label: "All types" }, ...[...new Set(items.map((e) => e.type))].sort().map((t) => ({ value: t, label: t }))]}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <div className="oc-filters__actions">
          <Button variant="ghost" onClick={clearFilters} disabled={!filtersOn}>Clear filters</Button>
        </div>
      </div>
      <p className="oc-muted" aria-live="polite">
        {isLoading ? "Loading exceptions…" : `Showing ${filtered.length} of ${byView[view].length}`}
      </p>
      <DataTable
        caption="Exception queue"
        hideCaption
        columns={columns}
        rows={filtered}
        rowKey={(e) => e.id}
        loading={isLoading}
        onRowClick={(e) => setSelectedId(e.id)}
        selectedKey={selectedId}
        initialSort={{ key: "sla", direction: "ascending" }}
        emptyState={
          byView[view].length === 0 ? (
            <div className="oc-empty">
              <strong>Nothing here right now</strong>
              <span>{view === "mine" ? "You have no open exceptions. Check Unassigned to pick one up." : "New exceptions will show up here as carriers report them."}</span>
            </div>
          ) : (
            <div className="oc-empty">
              <strong>No exceptions match these filters</strong>
              <span>Try a different severity or type, or clear filters to see all {byView[view].length}.</span>
              <Button size="sm" variant="secondary" onClick={clearFilters}>Clear filters</Button>
            </div>
          )
        }
      />
    </div>
  );

  return (
    <div className="rds-root oc-app">
      <header className="oc-header">
        <div className="oc-brand">
          <span className="oc-logo" aria-hidden="true">R</span>
          <span>Relay Ops</span>
          <Badge tone="neutral">Prototype</Badge>
        </div>
        <nav aria-label="Demo controls" className="oc-row">
          <Select
            label="Demo state"
            hideLabel
            value={demo}
            onChange={(e) => setDemo(e.target.value as Demo)}
            options={[
              { value: "live", label: "Demo: normal" },
              { value: "loading", label: "Demo: loading" },
              { value: "error", label: "Demo: error" },
              { value: "empty", label: "Demo: empty queue" },
            ]}
          />
          <Button variant="secondary" size="sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-pressed={theme === "dark"}>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </Button>
        </nav>
      </header>

      <main className="oc-main">
        <div className="oc-title">
          <div>
            <h1 className="oc-h1">Shipment exceptions</h1>
            <p className="oc-muted oc-p">All facilities · Updated 9:45 AM</p>
          </div>
        </div>

        {demo === "error" ? (
          <Alert
            tone="danger"
            title="Couldn't load the exception queue"
            action={<Button size="sm" variant="secondary" onClick={() => setDemo("live")}>Try again</Button>}
          >
            Your filters are saved. If this keeps happening, check the carrier feed status page.
          </Alert>
        ) : (
          <>
            {!isLoading && (breached > 0 || unassignedDueSoon > 0) && (
              <Alert tone="warning" title={`${breached} past SLA, ${dueSoon.length} due within the hour`}>
                {unassignedDueSoon > 0 ? `${unassignedDueSoon} of those due soon have no owner. ` : ""}The queue is sorted by SLA so the most urgent are first.
              </Alert>
            )}

            <section aria-label="Summary" className="oc-stats">
              <StatTile label="Open exceptions" value={isLoading ? "–" : open.length} delta="+6 since 8 AM" trend="bad" />
              <StatTile label="Due within 1 hour" value={isLoading ? "–" : dueSoon.length} delta={`${unassignedDueSoon} unassigned`} emphasis={dueSoon.length ? "warning" : "none"} />
              <StatTile label="Past SLA" value={isLoading ? "–" : breached} delta="Needs action now" emphasis={breached ? "danger" : "none"} />
              <StatTile label="Resolved today" value={isLoading ? "–" : byView.resolved.length} delta="+3 vs. yesterday" trend="good" />
            </section>

            <div className="oc-grid">
              <section className="oc-card oc-queue" aria-labelledby="queue-title">
                <h2 id="queue-title" className="oc-h2">Queue</h2>
                <Tabs
                  label="Queue views"
                  value={view}
                  onChange={(v) => setView(v as View)}
                  items={[
                    { id: "mine", label: "Assigned to me", count: byView.mine.length, content: view === "mine" && queue },
                    { id: "unassigned", label: "Unassigned", count: byView.unassigned.length, content: view === "unassigned" && queue },
                    { id: "open", label: "All open", count: byView.open.length, content: view === "open" && queue },
                    { id: "resolved", label: "Resolved", count: byView.resolved.length, content: view === "resolved" && queue },
                  ]}
                />
              </section>
              {!isLoading && source.length > 0 && (
                <TypeChart
                  items={source}
                  onSelectType={(t: ExceptionType) => {
                    setType(t);
                    setView("open");
                  }}
                />
              )}
            </div>
          </>
        )}
      </main>

      <ExceptionPanel
        item={selected}
        onClose={() => setSelectedId(null)}
        onAssign={(id) =>
          update(
            id,
            (e) => ({ ...e, assignee: CURRENT_USER, status: e.status === "New" ? "In progress" : e.status, timeline: [...e.timeline, { at: 0, text: "Assigned to you" }] }),
            `${id} assigned to you.`
          )
        }
        onResolve={(id, reason, note) => {
          update(id, (e) => ({ ...e, status: "Resolved", timeline: [...e.timeline, { at: 0, text: `Resolved: ${reason}${note ? `. ${note}` : ""}` }] }), `${id} marked resolved.`);
          setSelectedId(null);
        }}
        onEscalate={(id, note) =>
          update(
            id,
            (e) => ({ ...e, status: "Escalated", assignee: e.assignee ?? CURRENT_USER, timeline: [...e.timeline, { at: 0, text: `Escalated: ${note}` }] }),
            `${id} escalated to the carrier account manager.`
          )
        }
      />

      {toast && (
        <div className="oc-toast" role="status">
          <span>{toast.text}</span>
          {toast.undo && (
            <button type="button" className="oc-toast__btn" onClick={undo}>Undo</button>
          )}
          <button type="button" className="oc-toast__btn" onClick={() => setToast(null)} aria-label="Dismiss message">✕</button>
        </div>
      )}
    </div>
  );
}

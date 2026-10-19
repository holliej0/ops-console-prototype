import { useState } from "react";
import { Alert, Badge, Button, Select, SidePanel, TextArea } from "@/design-system";
import { CURRENT_USER, recommendedStep, type ShipmentException } from "@/lib/data";
import { relativeTime, severityTone, slaLabel, slaTone, statusTone } from "@/lib/format";

type Mode = "view" | "resolve" | "escalate";

interface Props {
  item: ShipmentException | null;
  onClose: () => void;
  onAssign: (id: string) => void;
  onResolve: (id: string, reason: string, note: string) => void;
  onEscalate: (id: string, note: string) => void;
}

const REASONS = [
  { value: "", label: "Choose a reason" },
  { value: "carrier-fixed", label: "Carrier fixed the issue" },
  { value: "customer-confirmed", label: "Customer confirmed it's fine" },
  { value: "reshipped", label: "Replacement shipped" },
  { value: "quality-released", label: "Quality released the product" },
  { value: "other", label: "Other (explain in note)" },
];

export function ExceptionPanel({ item, onClose, onAssign, onResolve, onEscalate }: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; note?: string }>({});

  const reset = () => {
    setMode("view");
    setReason("");
    setNote("");
    setErrors({});
  };
  const close = () => {
    reset();
    onClose();
  };

  if (!item) return null;
  const rec = recommendedStep(item);
  const resolved = item.status === "Resolved";
  const mine = item.assignee === CURRENT_USER;

  const submitResolve = () => {
    const next = {
      reason: reason ? undefined : "Choose why this is resolved.",
      note: reason === "other" && !note.trim() ? "Add a note so the next person knows what happened." : undefined,
    };
    setErrors(next);
    if (next.reason || next.note) return;
    onResolve(item.id, REASONS.find((r) => r.value === reason)!.label, note.trim());
    reset();
  };

  const submitEscalate = () => {
    if (!note.trim()) {
      setErrors({ note: "Say who needs to act and by when." });
      return;
    }
    onEscalate(item.id, note.trim());
    reset();
  };

  const footer = resolved ? (
    <Button variant="secondary" onClick={close}>Close</Button>
  ) : mode === "resolve" ? (
    <>
      <Button variant="ghost" onClick={reset}>Back</Button>
      <Button onClick={submitResolve}>Mark resolved</Button>
    </>
  ) : mode === "escalate" ? (
    <>
      <Button variant="ghost" onClick={reset}>Back</Button>
      <Button onClick={submitEscalate}>Send escalation</Button>
    </>
  ) : (
    <>
      <Button variant="secondary" onClick={() => setMode("escalate")}>Escalate</Button>
      <Button variant="secondary" onClick={() => setMode("resolve")}>Resolve</Button>
      {!mine && <Button onClick={() => onAssign(item.id)}>Assign to me</Button>}
    </>
  );

  return (
    <SidePanel
      open
      onClose={close}
      title={item.type}
      subtitle={
        <div className="oc-row">
          <span className="oc-mono">{item.id}</span>
          <Badge tone={severityTone[item.severity]} dot>{item.severity}</Badge>
          <Badge tone={statusTone[item.status]}>{item.status}</Badge>
        </div>
      }
      footer={footer}
    >
      {!resolved && (
        <Alert tone={slaTone(item.slaMinutes) === "danger" ? "danger" : slaTone(item.slaMinutes) === "warning" ? "warning" : "info"} title={`SLA: ${slaLabel(item.slaMinutes)}`}>
          {item.assignee ? `Owner: ${item.assignee === CURRENT_USER ? "you" : item.assignee}.` : "No owner yet."}
        </Alert>
      )}

      <section aria-labelledby="what-happened">
        <h3 id="what-happened" className="oc-h3">What happened</h3>
        <p className="oc-p">{item.detail}</p>
      </section>

      {mode === "view" && !resolved && (
        <section aria-labelledby="next-step" className="oc-callout">
          <h3 id="next-step" className="oc-h3">Suggested next step</h3>
          <p className="oc-p">{rec.step}</p>
          <p className="oc-p oc-muted">Why: {rec.why}</p>
        </section>
      )}

      {mode === "resolve" && (
        <section aria-labelledby="resolve-title" className="oc-form">
          <h3 id="resolve-title" className="oc-h3">Resolve this exception</h3>
          <Select label="Reason" required options={REASONS} value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason} />
          <TextArea
            label="Note"
            required={reason === "other"}
            hint={reason === "other" ? undefined : "Optional. Anything the next shift should know."}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            error={errors.note}
          />
        </section>
      )}

      {mode === "escalate" && (
        <section aria-labelledby="escalate-title" className="oc-form">
          <h3 id="escalate-title" className="oc-h3">Escalate to carrier account manager</h3>
          <TextArea label="Escalation note" required hint="Who needs to act, and by when?" value={note} onChange={(e) => setNote(e.target.value)} error={errors.note} />
        </section>
      )}

      <section aria-labelledby="details">
        <h3 id="details" className="oc-h3">Shipment</h3>
        <dl className="oc-dl">
          <dt>Customer</dt><dd>{item.customer}</dd>
          <dt>Contents</dt><dd>{item.contents}</dd>
          <dt>Facility</dt><dd>{item.facility}</dd>
          <dt>Carrier</dt><dd>{item.carrier}</dd>
        </dl>
      </section>

      <section aria-labelledby="activity">
        <h3 id="activity" className="oc-h3">Activity</h3>
        <ol className="oc-timeline">
          {[...item.timeline].reverse().map((t, i) => (
            <li key={i}>
              <span>{t.text}</span>
              <span className="oc-muted">{relativeTime(t.at)}</span>
            </li>
          ))}
        </ol>
      </section>
    </SidePanel>
  );
}

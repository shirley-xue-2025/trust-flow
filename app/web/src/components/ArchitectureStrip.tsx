/** One-line product architecture — boardroom-first framing on employee + governance layouts. */
export function ArchitectureStrip() {
  return (
    <div className="border-b bg-muted/40 py-2 text-center text-xs text-muted-foreground">
      <span className="font-semibold text-green-700">Agent boardroom negotiates</span>
      <span className="mx-1.5 text-muted-foreground/50">→</span>
      Compiler signs
      <span className="mx-1.5 text-muted-foreground/50">→</span>
      Humans approve
      <span className="mx-1.5 text-muted-foreground/50">→</span>
      Gateway enforces
    </div>
  );
}

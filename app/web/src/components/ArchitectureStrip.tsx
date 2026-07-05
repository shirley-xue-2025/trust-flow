/** One-line product architecture — employee + governance layouts (Track 3 visibility). */
export function ArchitectureStrip() {
  return (
    <div className="border-b bg-muted/40 py-2 text-center text-xs text-muted-foreground">
      <span className="font-semibold text-green-700">Agents propose</span>
      <span className="mx-1.5 text-muted-foreground/50">→</span>
      Compiler signs
      <span className="mx-1.5 text-muted-foreground/50">→</span>
      Humans approve
      <span className="mx-1.5 text-muted-foreground/50">→</span>
      Gateway enforces
    </div>
  );
}

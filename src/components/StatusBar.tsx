interface StatusBarProps {
  status: string;
}

export function StatusBar({ status }: StatusBarProps) {
  return (
    <div className="line">
      <span className="label">Status:</span>
      <span>{status || "—"}</span>
    </div>
  );
}

export function EmptyState({ message = "No data for this selection — try a different hall or day" }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 200,
        color: "var(--color-text-faint)",
        fontSize: 13,
        fontFamily: "var(--font-body)",
        textAlign: "center",
        padding: "0 24px",
      }}
    >
      {message}
    </div>
  );
}

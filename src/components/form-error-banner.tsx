export function FormErrorBanner({
  error,
  fieldErrors,
}: {
  error?: string;
  fieldErrors?: Record<string, string>;
}) {
  const messages = fieldErrors ? Object.values(fieldErrors) : [];
  if (!error && messages.length === 0) return null;

  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/10 text-destructive space-y-1 rounded-lg border p-3 text-sm"
    >
      {error ? <p className="font-medium">{error}</p> : null}
      {messages.length > 0 ? (
        <ul className="list-inside list-disc">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

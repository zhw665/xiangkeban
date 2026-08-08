export function FormStatus({ state }: { state: { type: "idle" | "loading" | "success" | "error"; text?: string } }) {
  if (state.type === "idle") return null;
  const color = state.type === "error" ? "text-red-700" : state.type === "success" ? "text-emerald-700" : "text-sky-700";
  return <p className={`text-sm ${color}`} role="status">{state.text}</p>;
}

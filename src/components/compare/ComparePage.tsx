import { useNavigate, useSearch } from "@tanstack/solid-router";
import { CompareView } from "~/components/compare/CompareView";
import { prefs } from "~/lib/state/prefs-store";

export function ComparePage() {
  const search = useSearch({ from: "/compare" });
  const navigate = useNavigate({ from: "/compare" });

  return (
    <CompareView
      search={search()}
      units={prefs.units}
      onSearch={(next) => {
        void navigate({ search: next, replace: true });
      }}
    />
  );
}

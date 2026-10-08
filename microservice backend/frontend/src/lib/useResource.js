import { useCallback, useEffect, useState } from "react";

export function useResource(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loader()
      .then((value) => {
        if (active) setData(value);
      })
      .catch((reason) => {
        if (active) setError(reason.message || "Unable to load this page.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Refreshes and caller-provided keys control when this loader runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, refreshKey]);

  return { data, loading, error, reload, setData };
}

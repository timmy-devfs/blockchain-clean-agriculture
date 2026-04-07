"use client";

import { useEffect, useState } from "react";

type HealthResult = {
  status?: string;
  [key: string]: unknown;
};

const DEFAULT_API_GATEWAY_URL = "http://localhost:8080";

export default function Page() {
  const [gatewayHealth, setGatewayHealth] = useState<HealthResult | null>(null);
  const [identityHealth, setIdentityHealth] = useState<HealthResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const apiGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? DEFAULT_API_GATEWAY_URL;

  const load = async () => {
    setErr(null);
    try {
      const [g, i] = await Promise.all([
        fetch(`${apiGatewayUrl}/actuator/health`, { cache: "no-store" }),
        fetch(`http://localhost:8081/actuator/health`, { cache: "no-store" })
      ]);

      const gj = (await g.json()) as HealthResult;
      const ij = (await i.json()) as HealthResult;

      setGatewayHealth(gj);
      setIdentityHealth(ij);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container">
      <h1>BICAP System (FE to BE Test)</h1>
      <p>
        This page calls backend services to verify your environment is working.
      </p>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Gateway health</div>
        <button onClick={() => void load()} disabled={false}>
          Reload health
        </button>
        <pre style={{ marginTop: 12 }}>
          {gatewayHealth ? JSON.stringify(gatewayHealth, null, 2) : "Loading..."}
        </pre>
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Identity health</div>
        <pre style={{ marginTop: 12 }}>
          {identityHealth ? JSON.stringify(identityHealth, null, 2) : "Loading..."}
        </pre>
      </div>

      {err ? (
        <div className="card" style={{ borderColor: "rgba(239,68,68,0.6)" }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Error</div>
          <pre>{err}</pre>
        </div>
      ) : null}
    </main>
  );
}


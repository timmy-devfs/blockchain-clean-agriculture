// Local copy for shipping module build isolation
// (kept in sync with frontend/shared/data.ts for demo UI)

export const DRIVERS: {
  name: string;
  code: string;
  color: string;
  route: string;
  pct: number;
  status: string;
  cargo: string;
}[] = [];

export const KAFKA_TOPICS: string[] = [];

export const KAFKA_MESSAGES: string[] = [];

export const TX_DATA: { hash: string; farm: string; type: string; cls: string }[] = [];


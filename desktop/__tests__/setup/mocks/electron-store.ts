/**
 * In-memory mock for electron-store.
 * Used by project-store.js tests.
 */
export class MockElectronStore {
  private data: Record<string, unknown>;
  private schema: Record<string, { default?: unknown }>;

  constructor(opts?: { schema?: Record<string, { default?: unknown }> }) {
    this.schema = opts?.schema || {};
    this.data = {};
    // Initialize defaults from schema
    for (const [key, def] of Object.entries(this.schema)) {
      if (def.default !== undefined) {
        this.data[key] = structuredClone(def.default);
      }
    }
  }

  get(key: string, defaultValue?: unknown): unknown {
    return key in this.data ? this.data[key] : defaultValue;
  }

  set(key: string, value: unknown): void {
    this.data[key] = value;
  }

  delete(key: string): void {
    delete this.data[key];
  }

  clear(): void {
    this.data = {};
    for (const [key, def] of Object.entries(this.schema)) {
      if (def.default !== undefined) {
        this.data[key] = structuredClone(def.default);
      }
    }
  }
}

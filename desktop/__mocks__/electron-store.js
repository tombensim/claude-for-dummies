// Manual mock for electron-store used by Vitest
// This replaces the real electron-store module for all tests

class InMemoryStore {
  constructor(opts) {
    this._schema = opts?.schema || {};
    this._data = {};
    for (const [key, def] of Object.entries(this._schema)) {
      if (def.default !== undefined) {
        this._data[key] = structuredClone(def.default);
      }
    }
    // Expose instance for test access
    InMemoryStore._lastInstance = this;
  }

  get(key, defaultValue) {
    return key in this._data ? this._data[key] : defaultValue;
  }

  set(key, value) {
    this._data[key] = value;
  }

  delete(key) {
    delete this._data[key];
  }
}

InMemoryStore._lastInstance = null;

export default InMemoryStore;

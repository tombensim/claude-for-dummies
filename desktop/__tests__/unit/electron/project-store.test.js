import { describe, it, expect, beforeEach } from "vitest";
import ElectronStore from "electron-store";

// electron-store is redirected to __mocks__/electron-store.js via resolve.alias
const store = await import("../../../electron/project-store.mjs");

beforeEach(() => {
  // Reset the in-memory store between tests
  const inst = ElectronStore._lastInstance;
  if (inst) {
    inst._data = {};
    for (const [key, def] of Object.entries(inst._schema)) {
      if (def.default !== undefined) {
        inst._data[key] = structuredClone(def.default);
      }
    }
  }
});

function makeMeta(overrides = {}) {
  return {
    id: `proj-${Date.now()}`,
    name: "test-project",
    displayName: "Test Project",
    path: "/tmp/test-project",
    createdAt: new Date().toISOString(),
    lastOpenedAt: new Date().toISOString(),
    sessionId: null,
    locale: "en",
    vibe: null,
    audience: null,
    priority: null,
    designRef: null,
    liveUrl: null,
    githubUrl: null,
    ...overrides,
  };
}

describe("project-store", () => {
  it("getProjects returns [] initially", () => {
    expect(store.getProjects()).toEqual([]);
  });

  it("addProject pushes and sets activeProjectId", () => {
    const meta = makeMeta({ id: "proj-1" });
    store.addProject(meta);

    expect(store.getProjects()).toHaveLength(1);
    expect(store.getActiveProject().id).toBe("proj-1");
  });

  it("getProject returns project by id", () => {
    store.addProject(makeMeta({ id: "proj-2" }));
    expect(store.getProject("proj-2")).toMatchObject({ id: "proj-2" });
  });

  it("getProject returns null for missing id", () => {
    expect(store.getProject("nonexistent")).toBeNull();
  });

  it("updateProject merges fields", () => {
    store.addProject(makeMeta({ id: "proj-3", name: "original" }));
    const updated = store.updateProject("proj-3", { name: "updated" });
    expect(updated.name).toBe("updated");
    expect(store.getProject("proj-3").name).toBe("updated");
  });

  it("updateProject returns null for missing id", () => {
    expect(store.updateProject("nope", { name: "x" })).toBeNull();
  });

  it("removeProject filters out the project", () => {
    store.addProject(makeMeta({ id: "proj-4" }));
    store.addProject(makeMeta({ id: "proj-5" }));
    store.removeProject("proj-4");
    expect(store.getProjects()).toHaveLength(1);
    expect(store.getProject("proj-4")).toBeNull();
  });

  it("removeProject clears activeProjectId if matched", () => {
    store.addProject(makeMeta({ id: "proj-6" }));
    store.removeProject("proj-6");
    expect(store.getActiveProject()).toBeNull();
  });

  it("removeProject preserves activeProjectId for other projects", () => {
    store.addProject(makeMeta({ id: "proj-7" }));
    store.addProject(makeMeta({ id: "proj-8" }));
    store.removeProject("proj-7");
    expect(store.getActiveProject()).toMatchObject({ id: "proj-8" });
  });

  it("getActiveProject returns null when none set", () => {
    expect(store.getActiveProject()).toBeNull();
  });

  it("setActiveProjectId sets the active project", () => {
    store.addProject(makeMeta({ id: "proj-9" }));
    store.addProject(makeMeta({ id: "proj-10" }));
    store.setActiveProjectId("proj-9");
    expect(store.getActiveProject()).toMatchObject({ id: "proj-9" });
  });

  it("addProject sets each new project as active", () => {
    store.addProject(makeMeta({ id: "first" }));
    expect(store.getActiveProject().id).toBe("first");
    store.addProject(makeMeta({ id: "second" }));
    expect(store.getActiveProject().id).toBe("second");
  });
});

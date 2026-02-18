import ElectronStore from "electron-store";

const schema = {
  projects: {
    type: "array",
    default: [],
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        displayName: { type: "string" },
        path: { type: "string" },
        createdAt: { type: "string" },
        lastOpenedAt: { type: "string" },
        sessionId: { type: ["string", "null"] },
        locale: { type: "string" },
        vibe: { type: ["string", "null"] },
        audience: { type: ["string", "null"] },
        priority: { type: ["string", "null"] },
        designRef: { type: ["string", "null"] },
        liveUrl: { type: ["string", "null"] },
        githubUrl: { type: ["string", "null"] },
      },
    },
  },
  activeProjectId: {
    type: ["string", "null"],
    default: null,
  },
};

const store = new ElectronStore({
  name: "cc4d-projects",
  schema,
});

export function getProjects() {
  return store.get("projects", []);
}

export function getProject(id) {
  const projects = getProjects();
  return projects.find((p) => p.id === id) || null;
}

export function addProject(meta) {
  const projects = getProjects();
  projects.push(meta);
  store.set("projects", projects);
  store.set("activeProjectId", meta.id);
}

export function updateProject(id, updates) {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates };
  store.set("projects", projects);
  return projects[idx];
}

export function removeProject(id) {
  const projects = getProjects();
  store.set(
    "projects",
    projects.filter((p) => p.id !== id)
  );
  const activeId = store.get("activeProjectId");
  if (activeId === id) {
    store.set("activeProjectId", null);
  }
}

export function getActiveProject() {
  const id = store.get("activeProjectId");
  if (!id) return null;
  return getProject(id);
}

export function setActiveProjectId(id) {
  store.set("activeProjectId", id);
}

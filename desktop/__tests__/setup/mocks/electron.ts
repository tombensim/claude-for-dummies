import { vi } from "vitest";

/**
 * Mock for the 'electron' module (used by runtime managers).
 */
export const app = {
  isPackaged: false,
  getAppPath: vi.fn(() => "/mock/app"),
  getPath: vi.fn((name: string) => `/mock/${name}`),
  getLocale: vi.fn(() => "en-US"),
};

export const ipcMain = {
  handle: vi.fn(),
  on: vi.fn(),
};

export const shell = {
  openExternal: vi.fn(),
  openPath: vi.fn(),
};

export const BrowserWindow = vi.fn();

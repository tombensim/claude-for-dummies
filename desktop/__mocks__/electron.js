// Manual mock for the 'electron' module (not available outside Electron)
// Used via resolve.alias in vitest.config.ts

export const app = {
  isPackaged: false,
  getAppPath: () => "/mock/app",
  getPath: (name) => `/mock/${name}`,
  getName: () => "claude-for-beginners",
  getLocale: () => "en-US",
  getVersion: () => "1.0.0",
};

export const ipcMain = {
  handle: () => {},
  on: () => {},
};

export const shell = {
  openExternal: () => {},
  openPath: () => {},
};

export const BrowserWindow = function () {};

export default { app, ipcMain, shell, BrowserWindow };

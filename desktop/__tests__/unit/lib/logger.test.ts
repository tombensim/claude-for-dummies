import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAppendFileSync, mockMkdirSync, mockReaddirSync, mockStatSync, mockUnlinkSync, mockRenameSync } = vi.hoisted(() => ({
  mockAppendFileSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockReaddirSync: vi.fn(() => []),
  mockStatSync: vi.fn(() => {
    throw new Error("ENOENT");
  }),
  mockUnlinkSync: vi.fn(),
  mockRenameSync: vi.fn(),
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal();
  const overrides = {
    appendFileSync: mockAppendFileSync,
    mkdirSync: mockMkdirSync,
    readdirSync: mockReaddirSync,
    statSync: mockStatSync,
    unlinkSync: mockUnlinkSync,
    renameSync: mockRenameSync,
  };
  return {
    ...actual,
    ...overrides,
    default: { ...(actual as Record<string, unknown>).default, ...overrides },
  };
});

vi.mock("os", async (importOriginal) => {
  const actual = await importOriginal();
  const overrides = { homedir: () => "/mock/home" };
  return {
    ...actual,
    ...overrides,
    default: { ...(actual as Record<string, unknown>).default, ...overrides },
  };
});

beforeEach(() => {
  mockAppendFileSync.mockClear();
  mockStatSync.mockReset().mockImplementation(() => {
    throw new Error("ENOENT");
  });
});

const { createLogger, LOG_DIR } = await import("@/lib/logger");

describe("createLogger", () => {
  it("returns an object with debug, info, warn, error methods", () => {
    const logger = createLogger("test");
    expect(logger.debug).toBeTypeOf("function");
    expect(logger.info).toBeTypeOf("function");
    expect(logger.warn).toBeTypeOf("function");
    expect(logger.error).toBeTypeOf("function");
  });

  it("writes log lines with correct format", () => {
    const logger = createLogger("mycat");
    logger.info("Hello world");

    expect(mockAppendFileSync).toHaveBeenCalled();
    const [filePath, line] = mockAppendFileSync.mock.calls[0];
    expect(filePath).toContain("mycat.log");
    expect(line).toMatch(/\[.*\] \[INFO\] Hello world\n/);
  });

  it("includes JSON data when provided", () => {
    const logger = createLogger("test2");
    logger.info("Event", { key: "value" });

    const [, line] = mockAppendFileSync.mock.calls[0];
    expect(line).toContain('{"key":"value"}');
  });

  it("writes all log levels when MIN_LEVEL is debug", () => {
    const logger = createLogger("test3");
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");

    expect(mockAppendFileSync).toHaveBeenCalledTimes(4);
  });
});

describe("LOG_DIR", () => {
  it("points to ~/.claude-for-beginners/logs/", () => {
    expect(LOG_DIR).toBe("/mock/home/.claude-for-beginners/logs");
  });
});

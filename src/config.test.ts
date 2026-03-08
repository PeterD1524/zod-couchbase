import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";

import { createModelConfig } from "./config.js";

describe("createModelConfig", () => {
  const schema = z.object({ name: z.string() });

  describe("defaults", () => {
    it("uses default field names", () => {
      const config = createModelConfig({ schema, type: "user" });

      expect(config.fields).toStrictEqual({
        id: { name: "id" },
        type: { name: "_type" },
        createdAt: { name: "createdAt" },
        updatedAt: { name: "updatedAt" },
      });
    });

    it("uses default key function: type::id", () => {
      const config = createModelConfig({ schema, type: "user" });

      expect(config.key("abc")).toBe("user::abc");
    });

    it("uses default now function returning ISO string", () => {
      const config = createModelConfig({ schema, type: "user" });

      const result = config.now();
      expect(typeof result).toBe("string");
      expect(new Date(result).toISOString()).toBe(result);
    });

    it("preserves schema and type", () => {
      const config = createModelConfig({ schema, type: "user" });

      expect(config.schema).toBe(schema);
      expect(config.type).toBe("user");
    });
  });

  describe("custom key function", () => {
    it("uses provided key function", () => {
      const config = createModelConfig({
        schema,
        type: "user",
        key: (id: number) => `user:${String(id)}`,
      });

      expect(config.key(42)).toBe("user:42");
    });

    it("supports async key function", async () => {
      const config = createModelConfig({
        schema,
        type: "user",
        key: (id: string) => Promise.resolve(`prefix-${id}`),
      });

      await expect(config.key("abc")).resolves.toBe("prefix-abc");
    });
  });

  describe("custom now function", () => {
    it("uses provided now function", () => {
      const config = createModelConfig({
        schema,
        type: "user",
        now: () => 1234567890,
      });

      expect(config.now()).toBe(1234567890);
    });

    it("supports async now function", async () => {
      const config = createModelConfig({
        schema,
        type: "user",
        now: () => Promise.resolve(new Date("2025-01-01T00:00:00Z")),
      });

      await expect(config.now()).resolves.toStrictEqual(
        new Date("2025-01-01T00:00:00Z"),
      );
    });
  });

  describe("custom field names", () => {
    it("uses provided field names", () => {
      const config = createModelConfig({
        schema,
        type: "user",
        fields: {
          id: { name: "userId" },
          type: { name: "docType" },
          createdAt: { name: "created" },
          updatedAt: { name: "modified" },
        },
      });

      expect(config.fields).toStrictEqual({
        id: { name: "userId" },
        type: { name: "docType" },
        createdAt: { name: "created" },
        updatedAt: { name: "modified" },
      });
    });

    it("allows undefined fields to disable metadata", () => {
      const config = createModelConfig({
        schema,
        type: "user",
        fields: {
          id: undefined,
          type: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        },
      });

      expect(config.fields.id).toBeUndefined();
      expect(config.fields.type).toBeUndefined();
      expect(config.fields.createdAt).toBeUndefined();
      expect(config.fields.updatedAt).toBeUndefined();
    });

    it("allows mixing defined and undefined fields", () => {
      const config = createModelConfig({
        schema,
        type: "user",
        fields: {
          id: { name: "userId" },
          type: undefined,
          createdAt: { name: "created" },
          updatedAt: undefined,
        },
      });

      expect(config.fields.id).toStrictEqual({ name: "userId" });
      expect(config.fields.type).toBeUndefined();
      expect(config.fields.createdAt).toStrictEqual({ name: "created" });
      expect(config.fields.updatedAt).toBeUndefined();
    });
  });

  describe("default key function with different types", () => {
    it("includes the type in the key", () => {
      const config = createModelConfig({ schema, type: "order" });

      expect(config.key("123")).toBe("order::123");
    });
  });

  describe("now function isolation", () => {
    it("returns different timestamps on successive calls", () => {
      const config = createModelConfig({ schema, type: "user" });

      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
      const t1 = config.now();

      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
      const t2 = config.now();

      vi.useRealTimers();

      expect(t1).not.toBe(t2);
      expect(t1).toBe("2025-01-01T00:00:00.000Z");
      expect(t2).toBe("2025-06-15T12:00:00.000Z");
    });
  });
});

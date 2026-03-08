import { describe, expect, it } from "vitest";
import * as z from "zod";
import { createModelConfig } from "./config.js";

describe("createModelConfig", () => {
  const schema = z.object({
    id: z.string(),
    _type: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  });

  it("uses default field names", () => {
    const config = createModelConfig({
      schema,
      type: "user",
    });

    expect(config.fields.id).toEqual({ name: "id" });
    expect(config.fields.type).toEqual({ name: "_type" });
    expect(config.fields.createdAt).toEqual({ name: "createdAt" });
    expect(config.fields.updatedAt).toEqual({ name: "updatedAt" });
  });

  it("uses default key generator", async () => {
    const config = createModelConfig({
      schema,
      type: "user",
    });

    const key = await config.key("123");
    expect(key).toBe("user::123");
  });

  it("uses default now function returning ISO string", async () => {
    const config = createModelConfig({
      schema,
      type: "user",
    });

    const now = await config.now();
    expect(() => new Date(now).toISOString()).not.toThrow();
  });

  it("accepts custom key generator", async () => {
    const config = createModelConfig({
      schema,
      type: "user",
      key: (id: string) => `custom:${id}`,
    });

    const key = await config.key("456");
    expect(key).toBe("custom:456");
  });

  it("accepts custom now function", async () => {
    const config = createModelConfig({
      schema,
      type: "user",
      now: () => 1234567890,
    });

    const now = await config.now();
    expect(now).toBe(1234567890);
  });

  it("accepts custom field names", () => {
    const customSchema = z.object({
      docId: z.string(),
      docType: z.string(),
      created: z.string(),
      modified: z.string(),
    });

    const config = createModelConfig({
      schema: customSchema,
      type: "document",
      fields: {
        id: { name: "docId" },
        type: { name: "docType" },
        createdAt: { name: "created" },
        updatedAt: { name: "modified" },
      },
    });

    expect(config.fields.id).toEqual({ name: "docId" });
    expect(config.fields.type).toEqual({ name: "docType" });
    expect(config.fields.createdAt).toEqual({ name: "created" });
    expect(config.fields.updatedAt).toEqual({ name: "modified" });
  });

  it("allows undefined field names to disable fields", () => {
    const config = createModelConfig({
      schema,
      type: "user",
      fields: {
        id: { name: "id" },
        type: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      },
    });

    expect(config.fields.id).toEqual({ name: "id" });
    expect(config.fields.type).toBeUndefined();
    expect(config.fields.createdAt).toBeUndefined();
    expect(config.fields.updatedAt).toBeUndefined();
  });
});

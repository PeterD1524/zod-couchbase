import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { createModelConfig } from "./config.js";
import { ZCDocumentExistsError, ZCDocumentNotFoundError } from "./error.js";
import { setupTestContext, type TestContext } from "./test-setup.js";

describe("CollectionModel integration", () => {
  let ctx: TestContext;

  const userSchema = z.object({
    id: z.string(),
    _type: z.string(),
    name: z.string(),
    email: z.email(),
    createdAt: z.string(),
    updatedAt: z.string(),
  });

  const userConfig = createModelConfig({
    schema: userSchema,
    type: "user",
  });

  beforeAll(async () => {
    ctx = await setupTestContext();
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it("inserts and gets a document", async () => {
    const model = ctx.zc.model(userConfig, {
      bucket: ctx.bucket,
      scope: ctx.scope,
      collection: ctx.collection,
    });

    const id = `test-user-${String(Date.now())}`;
    const insertResult = await model.insert(id, {
      name: "Test User",
      email: "test@example.com",
    });

    expect(insertResult.ok).toBe(true);
    if (!insertResult.ok) {
      return;
    }

    const doc = insertResult.value;
    const parsed = doc.parse();
    expect(parsed.id).toBe(id);
    expect(parsed._type).toBe("user");
    expect(parsed.name).toBe("Test User");
    expect(parsed.email).toBe("test@example.com");
    expect(parsed.createdAt).toBeDefined();
    expect(parsed.updatedAt).toBeDefined();
    expect(parsed.createdAt).toBe(parsed.updatedAt);

    const getResult = await model.get(id);
    expect(getResult.ok).toBe(true);
    if (!getResult.ok) {
      return;
    }

    const fetched = getResult.value.parse();
    expect(fetched.name).toBe("Test User");

    await model.remove(id);
  });

  it("returns error when getting non-existent document", async () => {
    const model = ctx.zc.model(userConfig, {
      bucket: ctx.bucket,
      scope: ctx.scope,
      collection: ctx.collection,
    });

    const result = await model.get("non-existent-id");
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error).toBeInstanceOf(ZCDocumentNotFoundError);
  });

  it("returns error when inserting duplicate key", async () => {
    const model = ctx.zc.model(userConfig, {
      bucket: ctx.bucket,
      scope: ctx.scope,
      collection: ctx.collection,
    });

    const id = `test-dup-${String(Date.now())}`;
    const first = await model.insert(id, {
      name: "First",
      email: "first@example.com",
    });
    expect(first.ok).toBe(true);

    const second = await model.insert(id, {
      name: "Second",
      email: "second@example.com",
    });
    expect(second.ok).toBe(false);
    if (second.ok) {
      return;
    }

    expect(second.error).toBeInstanceOf(ZCDocumentExistsError);

    await model.remove(id);
  });

  it("upserts a document", async () => {
    const model = ctx.zc.model(userConfig, {
      bucket: ctx.bucket,
      scope: ctx.scope,
      collection: ctx.collection,
    });

    const id = `test-upsert-${String(Date.now())}`;

    const first = await model.upsert(id, {
      name: "Original",
      email: "original@example.com",
    });
    expect(first.ok).toBe(true);

    const second = await model.upsert(id, {
      name: "Updated",
      email: "updated@example.com",
    });
    expect(second.ok).toBe(true);

    const getResult = await model.get(id);
    expect(getResult.ok).toBe(true);
    if (!getResult.ok) {
      return;
    }

    const fetched = getResult.value.parse();
    expect(fetched.name).toBe("Updated");
    expect(fetched.email).toBe("updated@example.com");

    await model.remove(id);
  });

  it("replaces a document", async () => {
    const model = ctx.zc.model(userConfig, {
      bucket: ctx.bucket,
      scope: ctx.scope,
      collection: ctx.collection,
    });

    const id = `test-replace-${String(Date.now())}`;

    await model.insert(id, {
      name: "Original",
      email: "original@example.com",
    });

    const replaceResult = await model.replace(id, {
      name: "Replaced",
      email: "replaced@example.com",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    expect(replaceResult.ok).toBe(true);

    const getResult = await model.get(id);
    expect(getResult.ok).toBe(true);
    if (!getResult.ok) {
      return;
    }

    const fetched = getResult.value.parse();
    expect(fetched.name).toBe("Replaced");
    expect(fetched.createdAt).toBe("2024-01-01T00:00:00.000Z");

    await model.remove(id);
  });

  it("removes a document", async () => {
    const model = ctx.zc.model(userConfig, {
      bucket: ctx.bucket,
      scope: ctx.scope,
      collection: ctx.collection,
    });

    const id = `test-remove-${String(Date.now())}`;

    await model.insert(id, {
      name: "To Remove",
      email: "remove@example.com",
    });

    const removeResult = await model.remove(id);
    expect(removeResult.ok).toBe(true);

    const getResult = await model.get(id);
    expect(getResult.ok).toBe(false);
    if (getResult.ok) {
      return;
    }

    expect(getResult.error).toBeInstanceOf(ZCDocumentNotFoundError);
  });
});

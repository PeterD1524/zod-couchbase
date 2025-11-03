import type { CasInput } from "couchbase";
import { Result } from "typescript-result";
import * as z4 from "zod/v4/core";
import type { ModelConfig } from "./config.js";
import type { ZCCollection, ZCTransactionAttemptContext } from "./couchbase.js";
import { CollectionDocument, TransactionDocument } from "./document.js";
import type { ModelReplaceOutput, Output } from "./util.js";

export class CollectionModel<
  T extends z4.$ZodType,
  Id,
  Type extends string,
  Timestamp,
  const IdField extends { name: string } | undefined,
  const TypeField extends { name: string } | undefined,
  const CreatedAtField extends { name: string } | undefined,
  const UpdatedAtField extends { name: string } | undefined,
> {
  constructor(
    readonly config: ModelConfig<
      T,
      Id,
      Type,
      Timestamp,
      IdField,
      TypeField,
      CreatedAtField,
      UpdatedAtField
    >,
    readonly collection: ZCCollection,
  ) {}

  async get(id: Id) {
    const key = await this.config.key(id);
    const result = await this.collection.get(key);
    if (!result.ok) {
      return result;
    }
    return Result.ok(
      new CollectionDocument(
        {
          type: "get",
          id,
          key,
          content: result.value.content,
          result: result.value,
        },
        this.config,
        this.collection,
      ),
    );
  }

  async insert(
    id: Id,
    value: Output<T, IdField, TypeField, CreatedAtField, UpdatedAtField>,
    options?: { expiry?: number | Date | undefined },
  ) {
    const key = await this.config.key(id);
    const v: unknown = value;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      if (this.config.fields.id !== undefined) {
        Object.defineProperty(v, this.config.fields.id.name, {
          configurable: true,
          enumerable: true,
          value: id,
          writable: true,
        });
      }
      if (this.config.fields.type !== undefined) {
        Object.defineProperty(v, this.config.fields.type.name, {
          configurable: true,
          enumerable: true,
          value: this.config.type,
          writable: true,
        });
      }
      let createdAt: unknown = undefined;
      if (this.config.fields.createdAt !== undefined) {
        createdAt = (
          v as Record<typeof this.config.fields.createdAt.name, unknown>
        )[this.config.fields.createdAt.name];
        if (createdAt === undefined) {
          createdAt = await this.config.now();
          Object.defineProperty(v, this.config.fields.createdAt.name, {
            configurable: true,
            enumerable: true,
            value: createdAt,
            writable: true,
          });
        }
      }
      if (this.config.fields.updatedAt !== undefined) {
        let updatedAt: unknown = (
          v as Record<typeof this.config.fields.updatedAt.name, unknown>
        )[this.config.fields.updatedAt.name];
        if (updatedAt === undefined) {
          if (createdAt === undefined) {
            updatedAt = await this.config.now();
          } else {
            updatedAt = createdAt;
          }
          Object.defineProperty(v, this.config.fields.updatedAt.name, {
            configurable: true,
            enumerable: true,
            value: updatedAt,
            writable: true,
          });
        }
      }
    }
    const content = z4.encode(this.config.schema, v as z4.output<T>);
    const result = await this.collection.insert(key, content, options);
    if (!result.ok) {
      return result;
    }
    return Result.ok(
      new CollectionDocument(
        { type: "mutation", id, key, content, result: result.value },
        this.config,
        this.collection,
      ),
    );
  }

  async upsert(
    id: Id,
    value: Output<T, IdField, TypeField, CreatedAtField, UpdatedAtField>,
    options?: { expiry?: number | Date; preserveExpiry?: boolean },
  ) {
    const key = await this.config.key(id);
    const v: unknown = value;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      if (this.config.fields.id !== undefined) {
        Object.defineProperty(v, this.config.fields.id.name, {
          configurable: true,
          enumerable: true,
          value: id,
          writable: true,
        });
      }
      if (this.config.fields.type !== undefined) {
        Object.defineProperty(v, this.config.fields.type.name, {
          configurable: true,
          enumerable: true,
          value: this.config.type,
          writable: true,
        });
      }
      let createdAt: unknown = undefined;
      if (this.config.fields.createdAt !== undefined) {
        createdAt = (
          v as Record<typeof this.config.fields.createdAt.name, unknown>
        )[this.config.fields.createdAt.name];
        if (createdAt === undefined) {
          createdAt = await this.config.now();
          Object.defineProperty(v, this.config.fields.createdAt.name, {
            configurable: true,
            enumerable: true,
            value: createdAt,
            writable: true,
          });
        }
      }
      if (this.config.fields.updatedAt !== undefined) {
        let updatedAt: unknown = (
          v as Record<typeof this.config.fields.updatedAt.name, unknown>
        )[this.config.fields.updatedAt.name];
        if (updatedAt === undefined) {
          if (createdAt === undefined) {
            updatedAt = await this.config.now();
          } else {
            updatedAt = createdAt;
          }
          Object.defineProperty(v, this.config.fields.updatedAt.name, {
            configurable: true,
            enumerable: true,
            value: updatedAt,
            writable: true,
          });
        }
      }
    }
    const content = z4.encode(this.config.schema, v as z4.output<T>);
    const result = await this.collection.upsert(key, content, options);
    if (!result.ok) {
      return result;
    }
    return Result.ok(
      new CollectionDocument(
        { type: "mutation", id, key, content, result: result.value },
        this.config,
        this.collection,
      ),
    );
  }

  async replace(
    id: Id,
    value: ModelReplaceOutput<T, IdField, TypeField, UpdatedAtField>,
    options?: {
      expiry?: number | Date | undefined;
      preserveExpiry?: boolean | undefined;
      cas?: CasInput | undefined;
    },
  ) {
    const key = await this.config.key(id);
    const v: unknown = value;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      if (this.config.fields.id !== undefined) {
        Object.defineProperty(v, this.config.fields.id.name, {
          configurable: true,
          enumerable: true,
          value: id,
          writable: true,
        });
      }
      if (this.config.fields.type !== undefined) {
        Object.defineProperty(v, this.config.fields.type.name, {
          configurable: true,
          enumerable: true,
          value: this.config.type,
          writable: true,
        });
      }
      if (this.config.fields.updatedAt !== undefined) {
        const updatedAt = (
          v as Record<typeof this.config.fields.updatedAt.name, unknown>
        )[this.config.fields.updatedAt.name];
        if (updatedAt === undefined) {
          Object.defineProperty(v, this.config.fields.updatedAt.name, {
            configurable: true,
            enumerable: true,
            value: await this.config.now(),
            writable: true,
          });
        }
      }
    }
    const content = z4.encode(this.config.schema, v as z4.output<T>);
    const result = await this.collection.replace(key, content, options);
    if (!result.ok) {
      return result;
    }
    return Result.ok(
      new CollectionDocument(
        { type: "mutation", id, key, content, result: result.value },
        this.config,
        this.collection,
      ),
    );
  }

  async remove(id: Id, options?: { cas?: CasInput | undefined }) {
    const key = await this.config.key(id);
    const result = await this.collection.remove(key, options);
    if (!result.ok) {
      return result;
    }
    return Result.ok();
  }

  async getAndTouch(id: Id, expiry: number | Date) {
    const key = await this.config.key(id);
    const result = await this.collection.getAndTouch(key, expiry);
    if (!result.ok) {
      return result;
    }
    return Result.ok(
      new CollectionDocument(
        {
          type: "get",
          id,
          key,
          content: result.value.content,
          result: result.value,
        },
        this.config,
        this.collection,
      ),
    );
  }

  async touch(id: Id, expiry: number | Date) {
    const key = await this.config.key(id);
    const result = await this.collection.touch(key, expiry);
    if (!result.ok) {
      return result;
    }
    return Result.ok();
  }
}

export type InferCollectionModel<Config> =
  Config extends ModelConfig<
    infer T,
    infer Id,
    infer Type,
    infer Timestamp,
    infer IdField,
    infer TypeField,
    infer CreatedAtField,
    infer UpdatedAtField
  >
    ? CollectionModel<
        T,
        Id,
        Type,
        Timestamp,
        IdField,
        TypeField,
        CreatedAtField,
        UpdatedAtField
      >
    : never;

export class TransactionModel<
  T extends z4.$ZodType,
  Id,
  const Type extends string,
  Timestamp,
  const IdField extends { name: string } | undefined,
  const TypeField extends { name: string } | undefined,
  const CreatedAtField extends { name: string } | undefined,
  const UpdatedAtField extends { name: string } | undefined,
> {
  constructor(
    private readonly config: ModelConfig<
      T,
      Id,
      Type,
      Timestamp,
      IdField,
      TypeField,
      CreatedAtField,
      UpdatedAtField
    >,
    private readonly collection: ZCCollection,
    private readonly attempt: ZCTransactionAttemptContext,
  ) {}

  async get(id: Id) {
    const key = await this.config.key(id);
    const result = await this.attempt.get(this.collection, key);
    if (!result.ok) {
      return result;
    }
    return Result.ok(
      new TransactionDocument(
        {
          type: "transaction_get",
          id,
          key,
          content: result.value.content,
          result: result.value,
        },
        this.config,
        this.attempt,
      ),
    );
  }

  async insert(
    id: Id,
    content: Output<T, IdField, TypeField, CreatedAtField, UpdatedAtField>,
  ) {
    const key = await this.config.key(id);
    const result = await this.attempt.insert(this.collection, key, content);
    if (!result.ok) {
      return result;
    }
    return Result.ok(
      new TransactionDocument(
        { type: "transaction_get", id, key, content, result: result.value },
        this.config,
        this.attempt,
      ),
    );
  }
}

export type InferTransactionModel<Config> =
  Config extends ModelConfig<
    infer T,
    infer Id,
    infer Type,
    infer Timestamp,
    infer IdField,
    infer TypeField,
    infer CreatedAtField,
    infer UpdatedAtField
  >
    ? TransactionModel<
        T,
        Id,
        Type,
        Timestamp,
        IdField,
        TypeField,
        CreatedAtField,
        UpdatedAtField
      >
    : never;

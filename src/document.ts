import type {
  GetResult,
  MutationResult,
  TransactionGetResult,
} from "couchbase";
import { Result } from "typescript-result";
import * as z4 from "zod/v4/core";
import type { ModelConfig } from "./config.js";
import type { ZCCollection, ZCTransactionAttemptContext } from "./couchbase.js";
import type { Output } from "./util.js";

interface BaseInner<Id> {
  id: Id;
  key: string;
  content: unknown;
}

interface GetInner<Id> extends BaseInner<Id> {
  type: "get";
  result: GetResult;
}

interface MutationInner<Id> extends BaseInner<Id> {
  type: "mutation";
  result: MutationResult;
}

interface TransactionGetInner<Id> extends BaseInner<Id> {
  type: "transaction_get";
  result: TransactionGetResult;
}

export class CollectionDocument<
  T extends z4.$ZodType,
  Id,
  Type extends string,
  Timestamp,
  const IdField extends { name: string } | undefined,
  const TypeField extends { name: string } | undefined,
  const CreatedAtField extends { name: string } | undefined,
  const UpdatedAtField extends { name: string } | undefined,
> {
  private fields:
    | {
        id: { value: unknown } | undefined;
        type: { value: unknown } | undefined;
        createdAt: { value: unknown } | undefined;
        updatedAt: { value: unknown } | undefined;
      }
    | undefined = undefined;

  constructor(
    private inner: GetInner<Id> | MutationInner<Id>,
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
  ) {}

  parse() {
    const result = this.safeParse();
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  safeParse() {
    const result = z4.safeParse(this.config.schema, this.inner.content);
    if (result.success) {
      const data: unknown = result.data;
      this.fields = {
        id: undefined,
        type: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
      if (typeof data === "object" && data !== null && !Array.isArray(data)) {
        if (
          this.config.fields.id !== undefined &&
          Object.hasOwn(data, this.config.fields.id.name)
        ) {
          if (this.config.fields.id.name in data) {
            this.fields.id = {
              value: (
                data as Record<typeof this.config.fields.id.name, unknown>
              )[this.config.fields.id.name],
            };
          }
        }
        if (
          this.config.fields.type !== undefined &&
          Object.hasOwn(data, this.config.fields.type.name)
        ) {
          this.fields.type = {
            value: (
              data as Record<typeof this.config.fields.type.name, unknown>
            )[this.config.fields.type.name],
          };
        }
        if (
          this.config.fields.createdAt !== undefined &&
          Object.hasOwn(data, this.config.fields.createdAt.name)
        ) {
          this.fields.createdAt = {
            value: (
              data as Record<typeof this.config.fields.createdAt.name, unknown>
            )[this.config.fields.createdAt.name],
          };
        }
        if (
          this.config.fields.updatedAt !== undefined &&
          Object.hasOwn(data, this.config.fields.updatedAt.name)
        ) {
          this.fields.updatedAt = {
            value: (
              data as Record<typeof this.config.fields.updatedAt.name, unknown>
            )[this.config.fields.updatedAt.name],
          };
        }
      }
    }
    return result;
  }

  async replace(
    value: Output<T, IdField, TypeField, CreatedAtField, UpdatedAtField>,
    options?: {
      updatedAt?: Timestamp | undefined;
      preserveUpdatedAt?: boolean | undefined;
      expiry?: number | Date | undefined;
      preserveExpiry?: boolean | undefined;
    },
  ) {
    if (
      this.config.fields.updatedAt === undefined &&
      (options?.updatedAt !== undefined ||
        options?.preserveUpdatedAt !== undefined)
    ) {
      throw new Error("updatedAt field is not configured");
    }
    if (options?.updatedAt !== undefined && options.preserveUpdatedAt) {
      throw new Error("updatedAt is set but preserveUpdatedAt is true");
    }
    const v: unknown = value;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      if (this.fields === undefined) {
        this.parse();
      }
      if (
        this.config.fields.id !== undefined &&
        this.fields?.id !== undefined
      ) {
        Object.defineProperty(v, this.config.fields.id.name, {
          configurable: true,
          enumerable: true,
          value: this.fields.id.value,
          writable: true,
        });
      }
      if (
        this.config.fields.type !== undefined &&
        this.fields?.type !== undefined
      ) {
        Object.defineProperty(v, this.config.fields.type.name, {
          configurable: true,
          enumerable: true,
          value: this.fields.type.value,
          writable: true,
        });
      }
      if (
        this.config.fields.createdAt !== undefined &&
        this.fields?.createdAt !== undefined
      ) {
        Object.defineProperty(v, this.config.fields.createdAt.name, {
          configurable: true,
          enumerable: true,
          value: this.fields.createdAt.value,
          writable: true,
        });
      }
      if (this.config.fields.updatedAt !== undefined) {
        if (options?.updatedAt !== undefined) {
          Object.defineProperty(v, this.config.fields.updatedAt.name, {
            configurable: true,
            enumerable: true,
            value: options.updatedAt,
            writable: true,
          });
        } else if (options?.preserveUpdatedAt) {
          if (this.fields?.updatedAt !== undefined) {
            Object.defineProperty(v, this.config.fields.updatedAt.name, {
              configurable: true,
              enumerable: true,
              value: this.fields.updatedAt.value,
              writable: true,
            });
          }
        } else {
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
    this.fields = undefined;
    const result = await this.collection.replace(this.inner.key, content, {
      expiry: options?.expiry,
      preserveExpiry: options?.preserveExpiry,
      cas: this.inner.result.cas,
    });
    if (!result.ok) {
      return result;
    }
    this.inner = {
      type: "mutation",
      id: this.inner.id,
      key: this.inner.key,
      content,
      result: result.value,
    };
    return Result.ok();
  }

  async remove() {
    this.fields = undefined;
    const result = await this.collection.remove(this.inner.key, {
      cas: this.inner.result.cas,
    });
    if (!result.ok) {
      return result;
    }
    // TODO: Mark as removed?
    this.inner = {
      type: "mutation",
      id: this.inner.id,
      key: this.inner.key,
      content: this.inner.content,
      result: result.value,
    };
    return Result.ok();
  }
}

export class TransactionDocument<
  T extends z4.$ZodType,
  Id,
  Type extends string,
  Timestamp,
  const IdField extends { name: string } | undefined,
  const TypeField extends { name: string } | undefined,
  const CreatedAtField extends { name: string } | undefined,
  const UpdatedAtField extends { name: string } | undefined,
> {
  private fields:
    | {
        id: { value: unknown } | undefined;
        type: { value: unknown } | undefined;
        createdAt: { value: unknown } | undefined;
        updatedAt: { value: unknown } | undefined;
      }
    | undefined = undefined;

  constructor(
    private inner: TransactionGetInner<Id>,
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
    private readonly attempt: ZCTransactionAttemptContext,
  ) {}

  parse() {
    const result = this.safeParse();
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  safeParse() {
    const result = z4.safeParse(this.config.schema, this.inner.content);
    if (result.success) {
      const data: unknown = result.data;
      this.fields = {
        id: undefined,
        type: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
      if (typeof data === "object" && data !== null && !Array.isArray(data)) {
        if (
          this.config.fields.id !== undefined &&
          Object.hasOwn(data, this.config.fields.id.name)
        ) {
          if (this.config.fields.id.name in data) {
            this.fields.id = {
              value: (
                data as Record<typeof this.config.fields.id.name, unknown>
              )[this.config.fields.id.name],
            };
          }
        }
        if (
          this.config.fields.type !== undefined &&
          Object.hasOwn(data, this.config.fields.type.name)
        ) {
          this.fields.type = {
            value: (
              data as Record<typeof this.config.fields.type.name, unknown>
            )[this.config.fields.type.name],
          };
        }
        if (
          this.config.fields.createdAt !== undefined &&
          Object.hasOwn(data, this.config.fields.createdAt.name)
        ) {
          this.fields.createdAt = {
            value: (
              data as Record<typeof this.config.fields.createdAt.name, unknown>
            )[this.config.fields.createdAt.name],
          };
        }
        if (
          this.config.fields.updatedAt !== undefined &&
          Object.hasOwn(data, this.config.fields.updatedAt.name)
        ) {
          this.fields.updatedAt = {
            value: (
              data as Record<typeof this.config.fields.updatedAt.name, unknown>
            )[this.config.fields.updatedAt.name],
          };
        }
      }
    }
    return result;
  }

  async replace(
    value: Output<T, IdField, TypeField, CreatedAtField, UpdatedAtField>,
    options?: {
      updatedAt?: Timestamp | undefined;
      preserveUpdatedAt?: boolean | undefined;
      expiry?: number | Date | undefined;
      preserveExpiry?: boolean | undefined;
    },
  ) {
    if (
      this.config.fields.updatedAt === undefined &&
      (options?.updatedAt !== undefined ||
        options?.preserveUpdatedAt !== undefined)
    ) {
      throw new Error("updatedAt field is not configured");
    }
    if (options?.updatedAt !== undefined && options.preserveUpdatedAt) {
      throw new Error("updatedAt is set when preserveUpdatedAt is true");
    }
    const v: unknown = value;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      if (this.fields === undefined) {
        this.parse();
      }
      if (
        this.config.fields.id !== undefined &&
        this.fields?.id !== undefined
      ) {
        Object.defineProperty(v, this.config.fields.id.name, {
          configurable: true,
          enumerable: true,
          value: this.fields.id.value,
          writable: true,
        });
      }
      if (
        this.config.fields.type !== undefined &&
        this.fields?.type !== undefined
      ) {
        Object.defineProperty(v, this.config.fields.type.name, {
          configurable: true,
          enumerable: true,
          value: this.fields.type.value,
          writable: true,
        });
      }
      if (
        this.config.fields.createdAt !== undefined &&
        this.fields?.createdAt !== undefined
      ) {
        Object.defineProperty(v, this.config.fields.createdAt.name, {
          configurable: true,
          enumerable: true,
          value: this.fields.createdAt.value,
          writable: true,
        });
      }
      if (this.config.fields.updatedAt !== undefined) {
        if (options?.updatedAt !== undefined) {
          Object.defineProperty(v, this.config.fields.updatedAt.name, {
            configurable: true,
            enumerable: true,
            value: options.updatedAt,
            writable: true,
          });
        } else if (options?.preserveUpdatedAt) {
          if (this.fields?.updatedAt !== undefined) {
            Object.defineProperty(v, this.config.fields.updatedAt.name, {
              configurable: true,
              enumerable: true,
              value: this.fields.updatedAt.value,
              writable: true,
            });
          }
        } else {
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
    this.fields = undefined;
    const result = await this.attempt.replace(this.inner.result, content);
    if (!result.ok) {
      return result;
    }
    this.inner = {
      type: "transaction_get",
      id: this.inner.id,
      key: this.inner.key,
      content,
      result: result.value,
    };
    return Result.ok();
  }

  async remove() {
    this.fields = undefined;
    const result = await this.attempt.remove(this.inner.result);
    if (!result.ok) {
      return result;
    }
    // TODO: Mark as removed?
    return Result.ok();
  }
}

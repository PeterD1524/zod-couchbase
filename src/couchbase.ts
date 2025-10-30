import {
  Bucket,
  CasMismatchError,
  CouchbaseError,
  DocumentExistsError,
  DocumentNotFoundError,
  Scope,
  TransactionAttemptContext,
  TransactionFailedError,
  TransactionResult,
  type CasInput,
  type Cluster,
  type Collection,
  type GetResult,
  type InsertOptions,
  type MutationResult,
  type QueryOptions,
  type QueryResult,
  type RemoveOptions,
  type ReplaceOptions,
  type TransactionGetResult,
  type TransactionQueryOptions,
  type TransactionQueryResult,
  type Transactions,
  type UpsertOptions,
} from "couchbase";
import { Result } from "typescript-result";
import {
  ZCCasMismatchError,
  ZCDocumentExistsError,
  ZCDocumentNotFoundError,
  ZCTransactionFailedError,
  ZCUnspecifiedCouchbaseError,
} from "./error.js";

export class ZCCollection {
  constructor(readonly inner: Collection) {}

  async get(key: string) {
    let result: GetResult;
    try {
      result = await this.inner.get(key);
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        return Result.error(new ZCDocumentNotFoundError(error));
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }

  async insert(
    key: string,
    value: unknown,
    options?: { expiry?: number | Date | undefined },
  ) {
    let o: InsertOptions | undefined = undefined;
    if (options?.expiry !== undefined) {
      o ??= {};
      o.expiry = options.expiry;
    }
    let result: MutationResult;
    try {
      result = await this.inner.insert(key, value, o);
    } catch (error) {
      if (error instanceof DocumentExistsError) {
        return Result.error(new ZCDocumentExistsError(error));
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }

  async upsert(
    key: string,
    value: unknown,
    options?: { expiry?: number | Date; preserveExpiry?: boolean },
  ) {
    let o: UpsertOptions | undefined = undefined;
    if (options?.expiry !== undefined) {
      o ??= {};
      o.expiry = options.expiry;
    }
    if (options?.preserveExpiry !== undefined) {
      o ??= {};
      o.preserveExpiry = options.preserveExpiry;
    }
    let result: MutationResult;
    try {
      result = await this.inner.upsert(key, value, o);
    } catch (error) {
      if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }

  async replace(
    key: string,
    value: unknown,
    options?: {
      expiry?: number | Date | undefined;
      preserveExpiry?: boolean | undefined;
      cas?: CasInput | undefined;
    },
  ) {
    let o: ReplaceOptions | undefined = undefined;
    if (options?.expiry !== undefined) {
      o ??= {};
      o.expiry = options.expiry;
    }
    if (options?.preserveExpiry !== undefined) {
      o ??= {};
      o.preserveExpiry = options.preserveExpiry;
    }
    if (options?.cas !== undefined) {
      o ??= {};
      o.cas = options.cas;
    }
    let result: MutationResult;
    try {
      result = await this.inner.replace(key, value, o);
    } catch (error) {
      if (error instanceof CasMismatchError) {
        return Result.error(new ZCCasMismatchError(error));
      } else if (error instanceof DocumentNotFoundError) {
        return Result.error(new ZCDocumentNotFoundError(error));
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }

  async remove(key: string, options?: { cas?: CasInput | undefined }) {
    let o: RemoveOptions | undefined = undefined;
    if (options?.cas !== undefined) {
      o ??= {};
      o.cas = options.cas;
    }
    let result: MutationResult;
    try {
      result = await this.inner.remove(key, o);
    } catch (error) {
      if (error instanceof CasMismatchError) {
        return Result.error(new ZCCasMismatchError(error));
      } else if (error instanceof DocumentNotFoundError) {
        return Result.error(new ZCDocumentNotFoundError(error));
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }

  async getAndTouch(key: string, expiry: number | Date) {
    let result: GetResult;
    try {
      result = await this.inner.getAndTouch(key, expiry);
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        return Result.error(new ZCDocumentNotFoundError(error));
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }

  async touch(key: string, expiry: number | Date) {
    let result: MutationResult;
    try {
      result = await this.inner.touch(key, expiry);
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        return Result.error(new ZCDocumentNotFoundError(error));
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }
}

class ZCScope {
  constructor(private readonly inner: Scope) {}

  collection(collectionName: string) {
    return new ZCCollection(this.inner.collection(collectionName));
  }
}

class ZCBucket {
  constructor(private readonly inner: Bucket) {}

  scope(scopeName: string) {
    return new ZCScope(this.inner.scope(scopeName));
  }
}

class FailTransaction extends Error {}

export class ZCTransactionResult<Value> {
  constructor(
    private readonly inner: TransactionResult,
    readonly content: Value,
  ) {
    void this.inner;
  }
}

export class ZCTransactionAttemptContext {
  constructor(private readonly inner: TransactionAttemptContext) {}

  async get(collection: ZCCollection, key: string) {
    let result: TransactionGetResult;
    try {
      result = await this.inner.get(collection.inner, key);
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        return Result.error(new ZCDocumentNotFoundError(error));
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }

  async insert(collection: ZCCollection, key: string, content: unknown) {
    let result: TransactionGetResult;
    try {
      result = await this.inner.insert(collection.inner, key, content);
    } catch (error) {
      if (error instanceof DocumentExistsError) {
        return Result.error(new ZCDocumentExistsError(error));
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }

  async replace(doc: TransactionGetResult, content: unknown) {
    let result: TransactionGetResult;
    try {
      result = await this.inner.replace(doc, content);
    } catch (error) {
      if (error instanceof CasMismatchError) {
        return Result.error(new ZCCasMismatchError(error));
      } else if (error instanceof DocumentNotFoundError) {
        return Result.error(new ZCDocumentNotFoundError(error));
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }

  async remove(doc: TransactionGetResult) {
    try {
      await this.inner.remove(doc);
    } catch (error) {
      if (error instanceof CasMismatchError) {
        return Result.error(new ZCCasMismatchError(error));
      } else if (error instanceof DocumentNotFoundError) {
        return Result.error(new ZCDocumentNotFoundError(error));
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok();
  }

  async query(
    statement: string,
    options?: { parameters?: Record<string, unknown> | unknown[] | undefined },
  ) {
    let o: TransactionQueryOptions | undefined = undefined;
    if (options?.parameters !== undefined) {
      o ??= {};
      o.parameters = options.parameters;
    }
    let result: TransactionQueryResult<unknown>;
    try {
      result = await this.inner.query(statement, o);
    } catch (error) {
      if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }
}

export class ZCTransactions {
  constructor(private readonly inner: Transactions) {}

  async run<Value, Err, T extends Result<Value, Err>>(
    logicFn: (attempt: ZCTransactionAttemptContext) => Promise<T>,
  ) {
    let o: { result: T } | undefined;
    let transactionResult: TransactionResult | undefined = undefined;
    try {
      transactionResult = await this.inner.run(async (attempt) => {
        const result = await logicFn(new ZCTransactionAttemptContext(attempt));
        o = { result };
        if (!result.ok) {
          throw new FailTransaction();
        }
      });
    } catch (error) {
      if (error instanceof TransactionFailedError) {
        if (!(error.cause instanceof FailTransaction)) {
          return Result.error(new ZCTransactionFailedError(error));
        }
      } else if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      } else {
        throw error;
      }
    }
    if (o === undefined) {
      throw new Error("o === undefined");
    }
    let result:
      | Result.Ok<ZCTransactionResult<T["$inferValue"]>>
      | Result.Error<T["$inferError"]>
      | undefined;
    o.result.fold(
      (value) => {
        if (transactionResult === undefined) {
          throw new Error("transactionResult === undefined");
        }
        result = Result.ok(new ZCTransactionResult(transactionResult, value));
      },
      (error) => {
        result = Result.error(error);
      },
    );
    if (result === undefined) {
      throw new Error("result === undefined");
    }
    return Result.ok(result);
  }
}

export class ZCCluster {
  constructor(private readonly inner: Cluster) {}

  bucket(bucketName: string) {
    return new ZCBucket(this.inner.bucket(bucketName));
  }

  async query(
    statement: string,
    options?: { parameters?: Record<string, unknown> | unknown[] | undefined },
  ) {
    let o: QueryOptions | undefined = undefined;
    if (options?.parameters !== undefined) {
      o ??= {};
      o.parameters = options.parameters;
    }
    let result: QueryResult<unknown>;
    try {
      result = await this.inner.query(statement, o);
    } catch (error) {
      if (error instanceof CouchbaseError) {
        return Result.error(new ZCUnspecifiedCouchbaseError(error));
      }
      throw error;
    }
    return Result.ok(result);
  }

  transactions() {
    return new ZCTransactions(this.inner.transactions());
  }
}

import { connect, type ConnectOptions } from "couchbase";
import { Result } from "typescript-result";
import * as z4 from "zod/v4/core";
import { type ModelConfig } from "./config.js";
import { ZCCluster, type ZCCollection } from "./couchbase.js";
import { CollectionModel, TransactionModel } from "./model.js";

export class ZodCouchbase {
  constructor(private readonly cluster: ZCCluster) {}

  model<
    T extends z4.$ZodType,
    Id,
    Type extends string,
    Timestamp,
    IdField extends { name: string } | undefined,
    TypeField extends { name: string } | undefined,
    CreatedAtField extends { name: string } | undefined,
    UpdatedAtField extends { name: string } | undefined,
  >(
    config: ModelConfig<
      T,
      Id,
      Type,
      Timestamp,
      IdField,
      TypeField,
      CreatedAtField,
      UpdatedAtField
    >,
    keyspace: { bucket: string; scope: string; collection: string },
  ) {
    return new CollectionModel(
      config,
      this.cluster
        .bucket(keyspace.bucket)
        .scope(keyspace.scope)
        .collection(keyspace.collection),
    );
  }

  async query(
    statement: string,
    options?: { parameters?: Record<string, unknown> | unknown[] | undefined },
  ) {
    return await this.cluster.query(statement, options);
  }

  async transactions<
    T extends z4.$ZodType,
    Id,
    Type extends string,
    Timestamp,
    IdField extends { name: string } | undefined,
    TypeField extends { name: string } | undefined,
    CreatedAtField extends { name: string } | undefined,
    UpdatedAtField extends { name: string } | undefined,
    M extends {
      config: Omit<
        ModelConfig<
          T,
          Id,
          Type,
          Timestamp,
          IdField,
          TypeField,
          CreatedAtField,
          UpdatedAtField
        >,
        "key"
      > & { key: (id: never) => string | PromiseLike<string> };
      collection: ZCCollection;
    },
    Models extends Record<string, M>,
    Value,
    Err,
    R extends Result<Value, Err>,
  >(
    models: Models,
    logicFn: (context: {
      models: {
        [P in keyof Models]: TransactionModel<
          Models[P]["config"]["schema"],
          Parameters<Models[P]["config"]["key"]>[0],
          Models[P]["config"]["type"],
          Awaited<ReturnType<Models[P]["config"]["now"]>>,
          Models[P]["config"]["fields"]["id"],
          Models[P]["config"]["fields"]["type"],
          Models[P]["config"]["fields"]["createdAt"],
          Models[P]["config"]["fields"]["updatedAt"]
        >;
      };
    }) => Promise<R>,
  ) {
    return await this.cluster.transactions().run(async (attempt) => {
      return await logicFn({
        models: Object.fromEntries(
          Object.entries(models).map(([key, model]) => [
            key,
            new TransactionModel(
              {
                schema: model.config.schema,
                type: model.config.type,
                now: model.config.now.bind(model.config),
                key: model.config.key.bind(model.config),
                fields: {
                  id: model.config.fields.id,
                  type: model.config.fields.type,
                  createdAt: model.config.fields.createdAt,
                  updatedAt: model.config.fields.updatedAt,
                },
              },
              model.collection,
              attempt,
            ),
          ]),
        ) as {
          [P in keyof Models]: TransactionModel<
            Models[P]["config"]["schema"],
            Parameters<Models[P]["config"]["key"]>[0],
            Models[P]["config"]["type"],
            Awaited<ReturnType<Models[P]["config"]["now"]>>,
            Models[P]["config"]["fields"]["id"],
            Models[P]["config"]["fields"]["type"],
            Models[P]["config"]["fields"]["createdAt"],
            Models[P]["config"]["fields"]["updatedAt"]
          >;
        },
      });
    });
  }
}

export async function createZodCouchbase(
  connStr: string,
  options?: { username?: string | undefined; password?: string | undefined },
) {
  let o: ConnectOptions | undefined = undefined;
  if (options?.username !== undefined) {
    o ??= {};
    o.username = options.username;
  }
  if (options?.password !== undefined) {
    o ??= {};
    o.password = options.password;
  }
  return new ZodCouchbase(new ZCCluster(await connect(connStr, o)));
}

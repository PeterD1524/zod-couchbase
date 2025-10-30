import * as z4 from "zod/v4/core";

export interface ModelConfig<
  T extends z4.$ZodType,
  Id,
  Type extends string,
  Timestamp,
  IdField extends { name: string } | undefined,
  TypeField extends { name: string } | undefined,
  CreatedAtField extends { name: string } | undefined,
  UpdatedAtField extends { name: string } | undefined,
> {
  schema: T;
  type: Type;
  now: () => Timestamp | PromiseLike<Timestamp>;
  key: (id: Id) => string | PromiseLike<string>;
  fields: {
    id: IdField;
    type: TypeField;
    createdAt: CreatedAtField;
    updatedAt: UpdatedAtField;
  };
}

export function createModelConfig<
  const O extends {
    schema: z4.$ZodType;
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    now?: (() => any) | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    key?: ((id: any) => string | PromiseLike<string>) | undefined;
    fields?:
      | {
          id: { name: string } | undefined;
          type: { name: string } | undefined;
          createdAt: { name: string } | undefined;
          updatedAt: { name: string } | undefined;
        }
      | undefined;
  },
>(
  o: O,
): ModelConfig<
  O["schema"],
  O["key"] extends (id: never) => string | PromiseLike<string>
    ? Parameters<O["key"]>[0]
    : string,
  O["type"],
  O["now"] extends () => unknown ? Awaited<ReturnType<O["now"]>> : string,
  O["fields"] extends { id: { name: string } | undefined }
    ? O["fields"]["id"]
    : { name: "id" },
  O["fields"] extends { type: { name: string } | undefined }
    ? O["fields"]["type"]
    : { name: "_type" },
  O["fields"] extends { createdAt: { name: string } | undefined }
    ? O["fields"]["createdAt"]
    : { name: "createdAt" },
  O["fields"] extends { updatedAt: { name: string } | undefined }
    ? O["fields"]["updatedAt"]
    : { name: "updatedAt" }
> {
  return {
    schema: o.schema,
    type: o.type,
    now: o.now?.bind(o) ?? (() => new Date().toISOString()),
    key: o.key?.bind(o) ?? ((id: string) => `${o.type}::${id}`),
    fields: (o.fields ?? {
      id: { name: "id" },
      type: { name: "_type" },
      createdAt: { name: "createdAt" },
      updatedAt: { name: "updatedAt" },
    }) as {
      id: O["fields"] extends { id: { name: string } | undefined }
        ? O["fields"]["id"]
        : { name: "id" };
      type: O["fields"] extends { type: { name: string } | undefined }
        ? O["fields"]["type"]
        : { name: "_type" };
      createdAt: O["fields"] extends { createdAt: { name: string } | undefined }
        ? O["fields"]["createdAt"]
        : { name: "createdAt" };
      updatedAt: O["fields"] extends { updatedAt: { name: string } | undefined }
        ? O["fields"]["updatedAt"]
        : { name: "updatedAt" };
    },
  };
}

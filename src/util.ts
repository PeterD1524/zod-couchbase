import * as z4 from "zod/v4/core";

// https://github.com/colinhacks/zod/blob/8d336c4d15e1917d78b67b890f7182f26633b56f/packages/zod/src/v4/core/util.ts#L126-L127
type Identity<T> = T;
export type Flatten<T> = Identity<{ [k in keyof T]: T[k] }>;

export type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;

export interface Field<T extends z4.$ZodType> {
  name: keyof z4.output<T>;
}

export type FieldValue<F extends Field<T> | undefined, T extends z4.$ZodType> =
  F extends Field<T>
    ? z4.output<T> extends Record<F["name"], infer Value>
      ? Value
      : never
    : never;

type OptionalShape<F, T extends z4.$ZodType> =
  F extends Field<T>
    ? Partial<Record<F["name"], FieldValue<F, T> | undefined>>
    : unknown;

export type Output<
  T extends z4.$ZodType,
  IdField,
  TypeField,
  CreatedAtField,
  UpdatedAtField,
> = Flatten<
  DistributiveOmit<
    z4.output<T>,
    | (IdField extends Field<T> ? IdField["name"] : never)
    | (TypeField extends Field<T> ? TypeField["name"] : never)
    | (CreatedAtField extends Field<T> ? CreatedAtField["name"] : never)
    | (UpdatedAtField extends Field<T> ? UpdatedAtField["name"] : never)
  > &
    OptionalShape<IdField, T> &
    OptionalShape<TypeField, T> &
    OptionalShape<CreatedAtField, T> &
    OptionalShape<UpdatedAtField, T>
>;

export type ModelReplaceOutput<
  T extends z4.$ZodType,
  IdField,
  TypeField,
  UpdatedAtField,
> = Flatten<
  DistributiveOmit<
    z4.output<T>,
    | (IdField extends Field<T> ? IdField["name"] : never)
    | (TypeField extends Field<T> ? TypeField["name"] : never)
    | (UpdatedAtField extends Field<T> ? UpdatedAtField["name"] : never)
  > &
    OptionalShape<IdField, T> &
    OptionalShape<TypeField, T> &
    OptionalShape<UpdatedAtField, T>
>;

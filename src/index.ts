export { createModelConfig } from "./config.js";
export type { ModelConfig } from "./config.js";
export {
  ZCCasMismatchError,
  ZCDocumentExistsError,
  ZCDocumentNotFoundError,
  ZCError,
  ZCTransactionFailedError,
  ZCUnspecifiedCouchbaseError,
} from "./error.js";
export type { InferCollectionModel } from "./model.js";
export { createZodCouchbase, ZodCouchbase } from "./zod-couchbase.js";

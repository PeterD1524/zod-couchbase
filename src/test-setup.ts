import { connect } from "couchbase";
import { ZCCluster } from "./couchbase.js";
import { ZodCouchbase } from "./zod-couchbase.js";

const COUCHBASE_URL = process.env["COUCHBASE_URL"] ?? "couchbase://localhost";
const COUCHBASE_USERNAME = process.env["COUCHBASE_USERNAME"] ?? "Administrator";
const COUCHBASE_PASSWORD = process.env["COUCHBASE_PASSWORD"] ?? "password";
const COUCHBASE_BUCKET = process.env["COUCHBASE_BUCKET"] ?? "test";

export interface TestContext {
  zc: ZodCouchbase;
  bucket: string;
  scope: string;
  collection: string;
  cleanup: () => Promise<void>;
}

export async function setupTestContext(): Promise<TestContext> {
  const cluster = await connect(COUCHBASE_URL, {
    username: COUCHBASE_USERNAME,
    password: COUCHBASE_PASSWORD,
  });

  const zc = new ZodCouchbase(new ZCCluster(cluster));

  return {
    zc,
    bucket: COUCHBASE_BUCKET,
    scope: "_default",
    collection: "_default",
    cleanup: async () => {
      await cluster.close();
    },
  };
}

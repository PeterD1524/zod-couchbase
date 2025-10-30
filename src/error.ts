import type {
  CasMismatchError,
  CouchbaseError,
  DocumentExistsError,
  DocumentNotFoundError,
  TransactionFailedError,
} from "couchbase";

export class ZCError extends Error {}

export class ZCUnspecifiedCouchbaseError extends ZCError {
  readonly type = "zc_unspecified_couchbase_error";

  constructor(readonly inner: CouchbaseError) {
    super();
  }
}

export class ZCCasMismatchError extends ZCError {
  readonly type = "zc_cas_mismatch_error";

  constructor(readonly inner: CasMismatchError) {
    super();
  }
}

export class ZCDocumentNotFoundError extends ZCError {
  readonly type = "zc_document_not_found_error";

  constructor(readonly inner: DocumentNotFoundError) {
    super();
  }
}

export class ZCDocumentExistsError extends ZCError {
  readonly type = "zc_document_exists_error";

  constructor(readonly inner: DocumentExistsError) {
    super();
  }
}

export class ZCTransactionFailedError extends ZCError {
  readonly type = "zc_transaction_failed_error";

  constructor(readonly inner: TransactionFailedError) {
    super();
  }
}

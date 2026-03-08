import { describe, expect, it } from "vitest";
import {
  ZCCasMismatchError,
  ZCDocumentExistsError,
  ZCDocumentNotFoundError,
  ZCError,
} from "./error.js";

describe("ZCError classes", () => {
  it("extends Error", () => {
    const error = new ZCError();
    expect(error).toBeInstanceOf(Error);
  });

  it("ZCDocumentNotFoundError has correct type", () => {
    const inner = { name: "DocumentNotFoundError" } as never;
    const error = new ZCDocumentNotFoundError(inner);
    expect(error.type).toBe("zc_document_not_found_error");
    expect(error.inner).toBe(inner);
  });

  it("ZCDocumentExistsError has correct type", () => {
    const inner = { name: "DocumentExistsError" } as never;
    const error = new ZCDocumentExistsError(inner);
    expect(error.type).toBe("zc_document_exists_error");
  });

  it("ZCCasMismatchError has correct type", () => {
    const inner = { name: "CasMismatchError" } as never;
    const error = new ZCCasMismatchError(inner);
    expect(error.type).toBe("zc_cas_mismatch_error");
  });
});

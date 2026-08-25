import { v4 as uuidv4 } from "uuid";
import { isDevEnvironment } from "./misc";
import { TypeUZServerErrorType } from "@typeuz/contracts/util/api";
import { FirebaseError } from "firebase-admin";

type FirebaseErrorParent = {
  code: string;
  errorInfo: FirebaseError;
};

export function isFirebaseError(err: unknown): err is FirebaseErrorParent {
  return (
    err !== null &&
    typeof err === "object" &&
    "code" in err &&
    "errorInfo" in err &&
    "codePrefix" in err &&
    typeof err.errorInfo === "object" &&
    err.errorInfo !== null &&
    "code" in err.errorInfo &&
    "message" in err.errorInfo
  );
}

export function getErrorMessage(error: unknown): string | undefined {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    (typeof error.message === "string" || typeof error.message === "number")
  ) {
    message = `${error.message}`;
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "number") {
    message = `${error}`;
  }

  if (message === "") {
    return undefined;
  }

  return message;
}

class TypeUZError extends Error implements TypeUZServerErrorType {
  status: number;
  errorId: string;
  uid?: string;

  constructor(status: number, message?: string, stack?: string, uid?: string) {
    super(message);
    this.status = status ?? 500;
    this.errorId = uuidv4();
    if (stack) {
      this.stack = stack;
    }
    this.uid = uid;

    if (this.status === 403) {
      console.log(">>>>>>>> INSTANTIATED 403 ERROR:", message);
      console.trace();
    }

    if (isDevEnvironment()) {
      this.message =
        (this.stack ?? "")
          ? `${String(message)}\nStack: ${String(this.stack)}`
          : String(message);
    } else {
      if ((this.stack ?? "") && this.status >= 500) {
        this.message = `Internal Server Error ${this.errorId}`;
      } else {
        this.message = String(message);
      }
    }
  }
}

export default TypeUZError;

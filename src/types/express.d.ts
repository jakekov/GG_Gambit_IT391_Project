import { IncomingHttpHeaders } from "http";

declare module "http" {
  interface IncomingHttpHeaders {
    X_CSRF_TOKEN?: string;
  }
}

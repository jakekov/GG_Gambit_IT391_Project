import {IncomingHttpHeaders} from 'http';
import {Request} from 'express';

declare module 'http' {
  interface IncomingHttpHeaders {
    X_CSRF_TOKEN?: string;
  }
}
declare global {
  namespace Express {
    interface Request {
      auth_user?: AuthenticatedUser;
    }
  }
}
//if i extend request instead i can just use that in my headers
//so i dont have to check anymore i think as long as i unclude the auth middleware to add the prop to the request
export interface AuthenticatedUser {
  username: string;
  string_id: string;
  uuid: Buffer;
}

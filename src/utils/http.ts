import {Response} from 'express';
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  UNAUTHORIZED: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
} as const;

export function internalServerError(res: Response, msg?: string) {
  res
    .status(HTTP_STATUS.SERVER_ERROR)
    .json({error: msg || 'Internal Server Error'});
}
export function badRequest(res: Response, msg?: string) {
  res.status(HTTP_STATUS.BAD_REQUEST).json({error: msg || 'Bad Request'});
}
export function notAuthenticated(res: Response, msg?: string) {
  res.status(HTTP_STATUS.UNAUTHENTICATED).json({error: msg || 'Not Signed in'});
}

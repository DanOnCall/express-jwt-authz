import { Handler, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      [key: string]: unknown;
    }
  }
}

export type AuthzScopes = string[];

export interface AuthzOptions {
  failWithError?: boolean;
  customScopeKey?: string;
  customUserKey?: string;
  checkAllScopes?: boolean;
}

const DEFAULT_SCOPE_KEY = 'scope';
const DEFAULT_USER_KEY = 'user';

/**
 * Checks if a value is a plain object (has properties) and not null or an array.
 * @param value The value to check.
 * @returns True if the value is likely a plain object, false otherwise.
 */
function isObjectWithProperties(
  value: unknown,
): value is Record<string | number | symbol, unknown> {
  if (value === null) {
    return false;
  }

  if (typeof value !== 'object') {
    return false;
  }

  return !Array.isArray(value);
}

/**
 * Creates and returns an Express middleware function that verifies a user's JWT scope
 * claim against a set of expected scopes.
 *
 * @param expectedScopes An array of scope strings required for access.
 * @param options Configuration options for the middleware's behavior.
 * @returns An Express middleware function (express.Handler).
 */
export const jwtAuthz = (
  expectedScopes: AuthzScopes,
  options?: AuthzOptions,
): Handler => {
  if (!Array.isArray(expectedScopes)) {
    throw new Error(
      'Parameter expectedScopes must be an array of strings representing the scopes for the endpoint(s)',
    );
  }

  return (req, res, next) => {
    const error = (res: Response) => {
      const errMessage = 'Insufficient scope';

      if (options && options.failWithError) {
        return next({
          statusCode: 403,
          error: 'Forbidden',
          message: errMessage,
        });
      }

      res.append(
        'WWW-Authenticate',
        `Bearer scope="${expectedScopes.join(' ')}", error="${errMessage}"`,
      );
      res.status(403).send(errMessage);
    };

    if (expectedScopes.length === 0) {
      return next();
    }

    let scopeKey = DEFAULT_SCOPE_KEY;
    let userKey = DEFAULT_USER_KEY;
    let userScopes: string[] = [];

    if (
      options &&
      options.customScopeKey != null &&
      typeof options.customScopeKey === 'string'
    ) {
      scopeKey = options.customScopeKey;
    }

    if (
      options &&
      options.customUserKey != null &&
      typeof options.customUserKey === 'string'
    ) {
      userKey = options.customUserKey;
    }

    const payload = req[userKey];

    if (!isObjectWithProperties(payload)) {
      return error(res);
    }

    const scopes = payload[scopeKey];

    const hasScopesAsString = typeof scopes === 'string';
    const hasScopesAsArray = Array.isArray(scopes);

    if (!(hasScopesAsString || hasScopesAsArray)) {
      return error(res);
    }

    if (hasScopesAsString) {
      userScopes = scopes.split(' ');
    }

    if (hasScopesAsArray) {
      userScopes = scopes;
    }

    let allowed =
      options && options.checkAllScopes
        ? expectedScopes.every((scope) => userScopes.includes(scope))
        : expectedScopes.some((scope) => userScopes.includes(scope));

    return allowed ? next() : error(res);
  };
};

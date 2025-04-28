# express-jwt-authz ![](https://travis-ci.org/auth0/express-jwt-authz.svg?branch=master)

Validate the `scope` claim of a JSON Web Token (JWT) to authorize access to an endpoint. Written in TypeScript.

## Installation

```bash
npm install express-jwt-authz
```

> **Note:** `express` version `^4.0.0` or `^5.0.0` is a peer dependency. Ensure a compatible version is installed in your project. Type definitions for `express-jwt-authz` are included in the package.

## API

### `jwtAuthz`

```typescript
jwtAuthz: (expectedScopes: AuthzScopes, options?: AuthzOptions) =>
  Express.Handler;
```

Creates and returns an Express middleware function for scope-based authorization.

#### Parameters

##### `expectedScopes`

```typescript
expectedScopes: string[];
```

**Required.** An array of scope strings representing the permissions required for accessing the endpoint.

##### `options`

```typescript
options?: {
  failWithError?: boolean;
  customScopeKey?: string;
  customUserKey?: string;
  checkAllScopes?: boolean;
};
```

Optional. Configuration options for the middleware's behavior.

- `checkAllScopes`: (`boolean`, default: `false`) If set to `true`, the user must have _all_ the scopes specified in the `scopes` array passed as the first argument. Otherwise, the user must have _at least one_ scope from that array.
- `customUserKey`: (`string`, default: `'user'`) The property name on the `req` object where the user payload (containing the scope information) can be found. Use `'auth'` for `express-jwt >= 6.0.0`.
- `customScopeKey`: (`string`, default: `'scope'`) The property name within the user payload object that holds the scope string or array.
- `failWithError`: (`boolean`, default: `false`) If set to `true`, authentication errors will be passed to the `next(err)` function instead of automatically ending the response with a 403 Forbidden status.

#### Returns

```typescript
Express.Handler;
```

An Express middleware function.

## Usage

Use this middleware together with [express-jwt](https://github.com/auth0/express-jwt) to first validate a JWT and then ensure it contains the necessary permissions (scopes) to access a specific endpoint.

> [!IMPORTANT]  
> `express-jwt` version `6.0.0` and later place the decoded JWT payload on `req.auth` by default (older versions used `req.user`). The examples below assume you are using `express-jwt >= 6.0.0`. Replace placeholder secrets/URIs with your actual values.

### Basic setup and single scope check

This example sets up an Express server that requires a valid JWT and the specific scope `read:messages` to access the `/api/messages` endpoint.

```typescript
import express from 'express';
import {
  expressjwt,
  Request as JWTRequest,
  GetVerificationKey,
} from 'express-jwt';
import { jwtAuthz } from 'express-jwt-authz';
import jwksRsa from 'jwks-rsa';

const app = express();
const port = 3000;

// Configure JWT validation using JWKS
const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `YOUR_JWKS_URI`, // e.g., https://your-tenant.auth0.com/.well-known/jwks.json
  }) as GetVerificationKey,
  audience: 'YOUR_API_IDENTIFIER', // e.g., https://api.example.com/
  issuer: `YOUR_ISSUER_BASE_URL`, // e.g., https://your-tenant.auth0.com/
  algorithms: ['RS256'],
});

// Require 'read:messages' scope
const checkReadMessagesScope = jwtAuthz(['read:messages'], {
  customUserKey: 'auth',
});

// Define the endpoint
app.get(
  '/api/messages',
  checkJwt, // 1. Validate JWT
  checkReadMessagesScope, // 2. Check for 'read:messages' scope
  (req: JWTRequest, res) => {
    // If we reach here, JWT validation and scope authorization succeeded.
    // req.auth contains the JWT payload with the required scope(s).
    res.json({ message: 'Access granted to messages.' });
  },
);

app.listen(port, () => {
  console.log(`Basic Example app listening at http://localhost:${port}`);
});
```

### Checking for some scopes

This example shows the default behavior where access is granted if the JWT contains _at least one_ of the listed scopes.

```typescript
import express from 'express';
import {
  expressjwt,
  Request as JWTRequest,
  GetVerificationKey,
} from 'express-jwt';
import { jwtAuthz } from 'express-jwt-authz';
import jwksRsa from 'jwks-rsa';

const app = express();
const port = 3001;

const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `YOUR_JWKS_URI`,
  }) as GetVerificationKey,
  audience: 'YOUR_API_IDENTIFIER',
  issuer: `YOUR_ISSUER_BASE_URL`,
  algorithms: ['RS256'],
});

// Require 'read:users' OR 'admin:users' scope
const checkUsersReadOrAdminScope = jwtAuthz(['read:users', 'admin:users'], {
  customUserKey: 'auth',
});

app.get(
  '/users',
  checkJwt,
  checkUsersReadOrAdminScope, // Check for either scope
  (req: JWTRequest, res) => {
    res.json({ message: 'Access granted to view users (read or admin).' });
  },
);

app.listen(port, () => {
  console.log(`OR Logic Example app listening at http://localhost:${port}`);
});
```

### Checking for all required scopes

This example uses `checkAllScopes: true` to require that _all_ specified scopes (`write:users` AND `approve:users`) are present in the JWT.

```typescript
import express from 'express';
import {
  expressjwt,
  Request as JWTRequest,
  GetVerificationKey,
} from 'express-jwt';
import { jwtAuthz } from 'express-jwt-authz';
import jwksRsa from 'jwks-rsa';

const app = express();
const port = 3002;

const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `YOUR_JWKS_URI`,
  }) as GetVerificationKey,
  audience: 'YOUR_API_IDENTIFIER',
  issuer: `YOUR_ISSUER_BASE_URL`,
  algorithms: ['RS256'],
});

// Require 'write:users' AND 'approve:users' scopes
const checkUsersWriteAndApproveScope = jwtAuthz(
  ['write:users', 'approve:users'],
  {
    customUserKey: 'auth',
    checkAllScopes: true, // Require BOTH scopes
  },
);

app.put(
  '/users/:id/approve',
  checkJwt,
  checkUsersWriteAndApproveScope, // Check for both scopes
  (req: JWTRequest, res) => {
    res.json({ message: `User ${req.params.id} approved.` });
  },
);

app.listen(port, () => {
  console.log(`AND Logic Example app listening at http://localhost:${port}`);
});
```

### Using custom keys

This example demonstrates using `customUserKey` and `customScopeKey` if your JWT payload is on `req.myUser` and the scopes are in `req.myUser.permissions`.

```typescript
import express from 'express';
import {
  expressjwt,
  Request as JWTRequest,
  GetVerificationKey,
} from 'express-jwt';
import { jwtAuthz } from 'express-jwt-authz';
import jwksRsa from 'jwks-rsa';

const app = express();
const port = 3003;

// Augment Request type for the custom property
declare global {
  namespace Express {
    interface Request {
      myUser?: {
        // Use the same name as customUserKey
        permissions?: string | string[]; // Use the same name as customScopeKey
        [key: string]: unknown; // Allow other properties
      };
    }
  }
}

// Configure JWT validation to use req.myUser
const checkJwtCustom = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `YOUR_JWKS_URI`,
  }) as GetVerificationKey,
  audience: 'YOUR_API_IDENTIFIER',
  issuer: `YOUR_ISSUER_BASE_URL`,
  algorithms: ['RS256'],
  requestProperty: 'myUser', // Tell express-jwt to use req.myUser
});

// Check scope 'read:reports' located in req.myUser.permissions
const checkCustomKeys = jwtAuthz(['read:reports'], {
  customUserKey: 'myUser',
  customScopeKey: 'permissions',
});

app.get(
  '/reports',
  checkJwtCustom, // Validate JWT (puts payload on req.myUser)
  checkCustomKeys, // Check scope within req.myUser.permissions
  (req, res) => {
    // req.myUser is now potentially available
    res.json({ message: 'Reports accessed.', userPayload: req.myUser });
  },
);

app.listen(port, () => {
  console.log(`Custom Keys Example app listening at http://localhost:${port}`);
});
```

### Scope claim format

The JWT must include a `scope` claim (configurable via `customScopeKey`). This claim must be either:

1. A string containing space-separated permissions:

```json
{
  "scope": "write:users read:users"
}
```

2. An array of string permissions:

```json
{
  "scope": ["write:users", "read:users"]
}
```

## Node.js Version Compatibility

The library targets ES2016 (`target` in `tsconfig.json`) and uses CommonJS modules (`module` in `tsconfig.json`). It requires a Node.js version compatible with this output (Node.js >= 6 is specified in `engines`, but using a modern LTS version like 18.x, 20.x, or later is strongly recommended).

## Contributing

Contributions are welcome! Please ensure you have TypeScript installed and run `npm install` to get all dependencies. Use `npm run build` to compile and `npm test` or `npm run coverage` to run tests. Please follow the existing code style (enforced by Prettier via pre-commit hook) and ensure tests pass before submitting a pull request.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## Author

[Auth0](https://auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

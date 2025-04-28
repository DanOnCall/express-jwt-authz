# express-jwt-authz ![](https://travis-ci.org/auth0/express-jwt-authz.svg?branch=master)

Validate the `scope` claim of a JSON Web Token (JWT) to authorize access to an endpoint.

## Installation

```bash
npm install express-jwt-authz
```

> **Note:** `express` version `^4.0.0` or `^5.0.0` is a peer dependency. Ensure a compatible version is installed in your project.

## API

### `auth(scopes, [options])`

Creates and returns an Express middleware function for scope-based authorization.

- **`scopes`** (`Array<string>`): **Required.** An array of scope strings representing the permissions required for accessing the endpoint.
- **`options`** (`Object`, Optional): Configuration options for the middleware:
  - `checkAllScopes`: (`boolean`, default: `false`) If set to `true`, the user must have _all_ the scopes specified in the `scopes` array passed as the first argument. Otherwise, the user must have _at least one_ scope from that array.
  - `customUserKey`: (`string`, default: `'user'`) The property name on the `req` object where the user payload (containing the scope information) can be found. Use `'auth'` for `express-jwt >= 6.0.0`.
  - `customScopeKey`: (`string`, default: `'scope'`) The property name within the user payload object that holds the scope string or array.
  - `failWithError`: (`boolean`, default: `false`) If set to `true`, authentication errors will be passed to the `next(err)` function instead of automatically ending the response with a 403 Forbidden status.
- **Returns:** `function(req, res, next)` - An Express middleware function.

## Usage

Use this middleware together with [express-jwt](https://github.com/auth0/express-jwt) to first validate a JWT and then ensure it contains the necessary permissions (scopes) to access a specific endpoint.

**Important:** `express-jwt` version 6.0.0 and later place the decoded JWT payload on `req.auth` by default (older versions used `req.user`). The examples below assume you are using `express-jwt >= 6.0.0` and therefore include the `customUserKey: 'auth'` option for `express-jwt-authz`.

```javascript
const { expressjwt: jwt } = require('express-jwt'); // CommonJS import
const { auth } = require('express-jwt-authz');

// Middleware to validate the JWT. If valid, payload is attached to req.auth
const checkJwt = jwt({
  secret: 'YOUR_SHARED_SECRET',
  audience: 'YOUR_API_IDENTIFIER',
  issuer: 'YOUR_ISSUER_BASE_URL',
  algorithms: ['HS256'], // Specify the algorithm(s) used
});

// Example: Check for 'read:users' scope
const checkReadUsersScope = auth(['read:users'], { customUserKey: 'auth' });

app.get('/users', checkJwt, checkReadUsersScope, function (req, res) {
  // Access granted
  res.json({ message: 'User list accessed.' });
});
```

If multiple scopes are provided in the array, the user must possess _at least one_ of the specified scopes to be granted access.

```javascript
// Example: Check for 'read:users' OR 'write:users' scope
const checkReadOrWriteUsersScope = auth(['read:users', 'write:users'], {
  customUserKey: 'auth',
});

// Assume 'checkJwt' middleware (defined in previous example) is also used here
app.post('/users', checkJwt, checkReadOrWriteUsersScope, function (req, res) {
  // Access granted if user has 'read:users' or 'write:users' (or both)
  res.json({ message: 'User created or read.' });
});

// Example User JWT payload that would be granted access:
// { ..., scope: 'read:users', ...}
```

To require that the user possesses _all_ provided scopes, use the `checkAllScopes: true` option:

```javascript
// Example: Check for 'read:users' AND 'write:users' scopes
const checkReadAllAndWriteUsersScope = auth(['read:users', 'write:users'], {
  checkAllScopes: true,
  customUserKey: 'auth',
});

// Assume 'checkJwt' middleware (defined in previous example) is also used here
app.post(
  '/admin/users',
  checkJwt,
  checkReadAllAndWriteUsersScope,
  function (req, res) {
    // Access granted only if user has BOTH 'read:users' and 'write:users'
    res.json({ message: 'User updated by admin.' });
  },
);

// Example User JWT payload that would be granted access:
// { ..., scope: 'read:users write:users', ...}

// Example User JWT payload that would NOT be granted access:
// { ..., scope: 'read:users', ...}
```

### Scope Claim Format

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

## Node.js Version

While the `package.json` specifies Node.js version 6 or higher, it is strongly recommended to use a modern, supported Node.js version (e.g., 18.x or later) for development and deployment.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## Author

[Auth0](https://auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

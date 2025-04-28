# 3.0.0

### BREAKING CHANGES

- **Export Method:** The library now uses a named export (`export const jwtAuthz`) instead of `module.exports`. CommonJS consumers must update their `require` statements from `const jwtAuthz = require('express-jwt-authz');` to `const { jwtAuthz } = require('express-jwt-authz');`. ES Module imports (`import { jwtAuthz } from ...`) remain unchanged.
- **Default User Key:** The default value for the `customUserKey` option has been changed from `'user'` to `'auth'`. This aligns with `express-jwt` `v6.0.0` and later. If you are using an older version of `express-jwt` or a different middleware that places the user payload on `req.user`, you must now explicitly pass `{ customUserKey: 'user' }` to `jwtAuthz`. Users of modern `express-jwt` no longer need to specify `{ customUserKey: 'auth' }`.

### Added

- **TypeScript:** Migrated entire codebase from JavaScript to TypeScript, providing first-class type definitions included in the package.
- **Express v5 Support:** Added official peer dependency support for Express `^5.0.0`.
- **Testing:** Introduced comprehensive unit tests with improved coverage reporting using `c8`.
- **Coverage:** Added test coverage reporting mechanism.

### Changed

- **Dependencies:** Updated various development dependencies.
- **Build Process:** Implemented TypeScript compilation using `tsc`.
- **Documentation:** Updated README with TypeScript examples, type information, setup instructions, and contribution guidelines.

### Removed

- Removed old JavaScript source files.

# 2.4.1

- Fixed TS export to model CommonJS

# 2.4.0

- Added support for a custom user key (`customUserKey`)
- Added TypeScript definitions

# 2.3.0

- Added support for a custom scope key (`customScopeKey`)

# 2.2.0

- Added support for array scopes
- Added option `checkAllScopes` to check that all the required scopes are allowed

# 2.1.1

- Add `WWW-Authenticate` header when authentication fails

# 2.1.0

- Added option `failWithError` to call next() when scope is insufficient

# 2.0.0

- Fix express deprecation of `res.send`
- Added `express@^4.0.0` as a peer dependency

# 1.0.0

- Initial Commit

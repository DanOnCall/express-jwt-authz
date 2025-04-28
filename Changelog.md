# 3.0.0 (2025-04-28)

### BREAKING CHANGES

- **Export Method:** The library now uses a named export (`export const jwtAuthz`) instead of `module.exports`. CommonJS consumers must update their `require` statements from `const jwtAuthz = require('express-jwt-authz');` to `const { jwtAuthz } = require('express-jwt-authz');`. ES Module imports (`import { jwtAuthz } from ...`) remain unchanged.

### Added

- **TypeScript:** Migrated entire codebase from JavaScript to TypeScript, providing first-class type definitions included in the package. (900f4ba)
- **Express v5 Support:** Added official peer dependency support for Express `^5.0.0`. (6252721)
- **Testing:** Introduced comprehensive unit tests with improved coverage reporting using `c8`. (900f4ba)
- **Coverage:** Added test coverage reporting mechanism. (900f4ba)

### Changed

- **Dependencies:** Updated various development dependencies, including migrating from `pretty-quick` v1 and old Husky to `lint-staged` and modern Husky for pre-commit hooks. (3564fa4, 2a1c6a2)
- **Build Process:** Implemented TypeScript compilation using `tsc`. (900f4ba)
- **Documentation:** Updated README with TypeScript examples, type information, setup instructions, and contribution guidelines. (900f4ba, 0dc7f51, 48ab220)

### Removed

- Removed old JavaScript source files. (Implied by 900f4ba)

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

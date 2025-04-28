import * as express from 'express';
import { expect } from 'chai';
import { jwtAuthz } from '../src';
import { MockResponse, createRequest, createResponse } from 'node-mocks-http';

function assertErrorResponseIs403InsufficientScope(
  res: MockResponse<express.Response>, // Use the specific mock type
  expectedScopes: string[],
) {
  expect(res.statusCode).to.equal(403);

  expect(res._getData()).to.equal('Insufficient scope');

  const header = res.getHeader('www-authenticate');
  if (typeof header !== 'string') {
    expect.fail(
      `Expected www-authenticate header to be a string, but got ${typeof header}`,
    );
  }

  expect(header.split('scope="')[1]?.split('"')[0]).to.equal(
    expectedScopes.join(' '),
  );
}

describe('should error', () => {
  it('when expectedScopes is missing', () => {
    expect(jwtAuthz).to.throw(
      Error,
      /^Parameter expectedScopes must be an array of strings representing the scopes for the endpoint\(s\)$/,
    );
  });

  it('when expectedScopes is not array', () => {
    const fn = () => {
      // @ts-expect-error - Intentionally passing incorrect type for runtime validation test
      jwtAuthz('test');
    };

    expect(fn).to.throw(
      Error,
      /^Parameter expectedScopes must be an array of strings representing the scopes for the endpoint\(s\)$/,
    );
  });
});

describe('should 403 and "Insufficient scope"', () => {
  it('when scope in user does not match expectedScopes', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: {
        scope: '',
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when scope in user does not match expectedScopes due to leading whitespace', () => {
    const expectedScopes = ['   read:user'];

    const mockRequest = createRequest({
      user: {
        scope: ['read:user'],
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when scope in user does not match expectedScopes due to trailing whitespace', () => {
    const expectedScopes = ['read:user   '];

    const mockRequest = createRequest({
      user: {
        scope: ['read:user'],
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when scope in user does not match expectedScopes due to case', () => {
    const expectedScopes = ['Read:user'];

    const mockRequest = createRequest({
      user: {
        scope: ['read:user'],
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('by calling the next() callback, when scope in user does not match expectedScopes and `options.failWithError` is `true`', (done) => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: {
        scope: '',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { failWithError: true })(
      mockRequest,
      mockResponse,
      (error) => {
        expect(error.statusCode).to.equal(403);
        expect(error.message).to.equal('Insufficient scope');
        expect(error.error).to.equal('Forbidden');
        done();
      },
    );
  });

  it('when user.scope does not exist and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: {},
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when using a customScopeKey and invalid scopes', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: {},
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes, { customScopeKey: 'permissions' })(
      mockRequest,
      mockResponse,
      mockNext,
    );

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when using a customUserKey and invalid scopes', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      myUser: {},
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes, { customUserKey: 'myUser' })(
      mockRequest,
      mockResponse,
      mockNext,
    );

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when using a customUserKey and customScopeKey and invalid scopes', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      myUser: {},
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes, {
      customUserKey: 'myUser',
      customScopeKey: 'permissions',
    })(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when user.scope is missing some of the expectedScopes and options.checkAllScopes is true', () => {
    const expectedScopes = ['read:user', 'write:user', 'delete:user'];

    const mockRequest = createRequest({
      user: {
        // This user is missing 'delete:user'
        scope: 'read:user write:user',
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes, {
      checkAllScopes: true,
    })(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when user does not exist and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({});
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when user.scope is an empty array and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: {
        scope: [],
      },
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when user.scope is undefined and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: {},
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when user is undefined and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: undefined,
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when user is null and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: null,
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when user is a string and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: 'read:user',
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });

  it('when user is an array and expectedScopes are not empty', () => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: [],
    });
    const mockResponse = createResponse();
    const mockNext = () => {};

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, mockNext);

    assertErrorResponseIs403InsufficientScope(mockResponse, expectedScopes);
  });
});

describe('should call next', () => {
  it('when expectedScopes is empty', (done) => {
    const expectedScopes: string[] = [];

    const mockRequest = createRequest();
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, done);
  });

  it('when user.scope is a string and contains the expectedScope', (done) => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: {
        scope: 'write:user read:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, done);
  });

  it('when user.scope is an array and contains the expectedScope', (done) => {
    const expectedScopes = ['read:user'];

    const mockRequest = createRequest({
      user: {
        scope: ['write:user', 'read:user'],
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, done);
  });

  it('when user.scope contains only one of the expectedScopes', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      user: {
        scope: 'write:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes)(mockRequest, mockResponse, done);
  });

  it('when user.scope has all the expectedScopes and options.checkAllScopes is `true`', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      user: {
        scope: ['read:user', 'write:user', 'delete:user'],
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { checkAllScopes: true })(
      mockRequest,
      mockResponse,
      done,
    );
  });

  it('when using a customScopeKey', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      user: {
        permissions: 'write:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { customScopeKey: 'permissions' })(
      mockRequest,
      mockResponse,
      done,
    );
  });

  it('when using a customUserKey', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      myUser: {
        scope: 'write:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, { customUserKey: 'myUser' })(
      mockRequest,
      mockResponse,
      done,
    );
  });

  it('when using a customUserKey and customScopeKey', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      myUser: {
        permissions: 'write:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, {
      customUserKey: 'myUser',
      customScopeKey: 'permissions',
    })(mockRequest, mockResponse, done);
  });

  it('when using a customScopeKey that is an array', (done) => {
    const expectedScopes = ['read:user', 'write:user'];

    const mockRequest = createRequest({
      user: {
        permissions: 'write:user',
      },
    });
    const mockResponse = createResponse();

    jwtAuthz(expectedScopes, {
      customScopeKey: 'permissions',
    })(mockRequest, mockResponse, done);
  });
});

// @flow
import { cleanup } from '@testing-library/react';

// ensuring that each test has at least one assertion
beforeEach(() => {
  expect.hasAssertions();
});

// unmount any components mounted with react-testing-library
afterEach(cleanup);

// @flow
import { cleanup } from 'react-testing-library';

// ensuring that each test has at least one assertion
beforeEach(() => {
  expect.hasAssertions();
});

// unmount any components mounted with react-testing-library
afterEach(cleanup);

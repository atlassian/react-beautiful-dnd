// @flow

// ensuring that each test has at least one assertion
beforeEach(expect.hasAssertions);

if (typeof document !== 'undefined') {
  // Simply importing this package will throw an error if document is not defined
  // eslint-disable-next-line global-require
  const { cleanup, fireEvent } = require('@testing-library/react');

  // unmount any components mounted with react-testing-library
  beforeAll(cleanup);
  afterEach(() => {
    cleanup();
    // lots of tests can leave a post-drop click blocker
    // this cleans it up before every test
    fireEvent.click(window);

    // Cleaning up any mocks

    if (window.getComputedStyle.mockRestore) {
      window.getComputedStyle.mockRestore();
    }

    if (Element.prototype.getBoundingClientRect.mockRestore) {
      Element.prototype.getBoundingClientRect.mockRestore();
    }
  });
}

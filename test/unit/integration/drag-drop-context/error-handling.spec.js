// @flow

describe('in react tree', () => {
  it('should abort any active drag (rbd error)', () => {});
  it('should abort any active drag (non-rbd error)', () => {});

  describe('recovery mode', () => {
    it('should recover from rbd errors', () => {});
    it('should not recover from non-rbd errors and rethrow them', () => {});
  });

  describe('abort mode', () => {
    it('should not recover from rbd errors', () => {});
    it('should not recover from non-rbd errors', () => {});
  });
});

describe('on window', () => {
  it('should abort any active drag (rbd error)', () => {});
  it('should abort any active drag (non-rbd error)', () => {});
});

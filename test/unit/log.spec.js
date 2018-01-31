// @flow
import * as log from '../../src/log';

describe('log', () => {
  // cache to help restore process.env
  const env = process.env;
  /* eslint-disable no-console */
  describe('log', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    afterEach(() => {
      console.log.mockRestore();
      process.env = { ...env };
    });
    it('calls console.log with passed params: single param', () => {
      log.log('log message');
      expect(console.log).toHaveBeenCalledWith('log message');
    });
    it('calls console.log with passed params: multiple param', () => {
      log.log('log message one', 'log message two');
      expect(console.log).toHaveBeenCalledWith(
        'log message one',
        'log message two'
      );
    });
    it('does not call console.log when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      log.log('log message one');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      console.warn.mockRestore();
      process.env = { ...env };
    });
    it('calls console.warn with passed params: single param', () => {
      log.warn('warn message');
      expect(console.warn).toHaveBeenCalledWith('warn message');
    });
    it('calls console.warn with passed params: multiple param', () => {
      log.warn('warn message one', 'warn message two');
      expect(console.warn).toHaveBeenCalledWith(
        'warn message one',
        'warn message two'
      );
    });
    it('does not call console.warn when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      log.warn('log message one');
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      console.error.mockRestore();
      process.env = { ...env };
    });
    it('calls console.error with passed params: single param', () => {
      log.error('error message');
      expect(console.error).toHaveBeenCalledWith('error message');
    });
    it('calls console.error with passed params: multiple param', () => {
      log.error('error message one', 'error message two');
      expect(console.error).toHaveBeenCalledWith(
        'error message one',
        'error message two'
      );
    });
    it('does not call console.error when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      log.error('log message one');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('group', () => {
    beforeEach(() => {
      // $FlowFixMe - Covariant property `groupEnd` incompatible with contravariant use in
      console.group = jest.fn();
    });
    afterEach(() => {
      console.group.mockRestore();
      process.env = { ...env };
    });
    it('calls console.group', () => {
      log.group('sample group name');
      expect(console.group).toHaveBeenCalledWith('sample group name');
    });
    it('does not call console.group when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      log.group('log message one');
      expect(console.group).not.toHaveBeenCalled();
    });
  });

  describe('groupEnd', () => {
    beforeEach(() => {
      // $FlowFixMe - Covariant property `groupEnd` incompatible with contravariant use in
      console.groupEnd = jest.fn();
    });
    afterEach(() => {
      console.groupEnd.mockRestore();
      process.env = { ...env };
    });
    it('calls console.groupEnd', () => {
      log.groupEnd();
      expect(console.groupEnd).toHaveBeenCalled();
    });
    it('does not call console.groupEnd when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      log.groupEnd();
      expect(console.groupEnd).not.toHaveBeenCalled();
    });
  });
  /* eslint-enable no-console */
});

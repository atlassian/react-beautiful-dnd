// @flow
import { warning } from '../../src/dev-warning';

jest.spyOn(console, 'warn').mockImplementation(() => {});

afterEach(() => {
  console.warn.mockClear();
});

it('should log a warning to the console', () => {
  warning('hey');

  expect(console.warn).toHaveBeenCalled();
});

it('should not log a warning if warnings are disabled', () => {
  window['__react-beautiful-dnd-disable-dev-warnings'] = true;

  warning('hey');
  warning('sup');
  warning('hi');

  expect(console.warn).not.toHaveBeenCalled();

  // re-enable

  window['__react-beautiful-dnd-disable-dev-warnings'] = false;

  warning('hey');

  expect(console.warn).toHaveBeenCalled();
});

// @flow
import { noop } from '../../src/empty';

function withConsole(type: string, fn: () => void, message?: string) {
  const mock = jest.spyOn(console, type).mockImplementation(noop);

  fn();

  expect(mock).toHaveBeenCalled();

  if (message) {
    expect(mock).toHaveBeenCalledWith(expect.stringContaining(message));
  }

  mock.mockReset();
}

export const withError = withConsole.bind(null, 'error');
export const withWarn = withConsole.bind(null, 'warn');

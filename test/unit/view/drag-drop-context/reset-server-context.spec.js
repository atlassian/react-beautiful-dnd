// @flow
import { resetServerContext } from '../../../../src';
import * as StyleMarshal from '../../../../src/view/style-marshal/style-marshal';

it('should reset the style marshal context', () => {
  const spy = jest.spyOn(StyleMarshal, 'resetStyleContext');
  expect(spy).not.toHaveBeenCalled();
  resetServerContext();
  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

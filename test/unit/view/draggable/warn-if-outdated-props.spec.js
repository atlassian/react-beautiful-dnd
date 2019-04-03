// @flow
import type { OwnProps } from '../../../../src/view/draggable/draggable-types';
import mount from './util/mount';
import { defaultOwnProps } from './util/get-props';

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.warn.mockReset();
});

it('should warn if using a shouldRespectForceTouch property', () => {
  [false, true].forEach((bool: boolean) => {
    console.warn.mockClear();

    const ownProps: OwnProps = {
      ...defaultOwnProps,
    };
    // $ExpectError
    ownProps.shouldRespectForceTouch = bool;

    const wrapper = mount({ ownProps });
    const value: string = console.warn.mock.calls[0][0];

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(
      value.includes(
        'shouldRespectForceTouch has been renamed to shouldRespectForcePress',
      ),
    ).toBe(true);

    wrapper.unmount();
  });
});

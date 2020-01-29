// @flow
import { vertical, horizontal } from '../../../../../../src/state/axis';
import type { Axis } from '../../../../../../src/types';
import { getPreset } from '../../../../../util/dimension';
import getSimpleStatePreset from '../../../../../util/get-simple-state-preset';

export type BlockFnArgs = {|
  axis: Axis,
  preset: Object,
  state: Object,
|};

type BlockFn = (args: BlockFnArgs) => void;

export default (block: BlockFn) => {
  [vertical, horizontal].forEach((axis: Axis) => {
    /* eslint-disable jest/valid-describe */
    // Eslint bug: https://github.com/jest-community/eslint-plugin-jest/issues/203
    describe(`on the ${axis.direction} axis`, () => {
      beforeEach(() => {
        requestAnimationFrame.reset();
        jest.useFakeTimers();
      });
      afterEach(() => {
        jest.useRealTimers();
      });

      afterAll(() => {
        requestAnimationFrame.reset();
      });

      const preset = getPreset(axis);
      const state = getSimpleStatePreset(axis);

      block({ axis, preset, state });
    });
  });
};

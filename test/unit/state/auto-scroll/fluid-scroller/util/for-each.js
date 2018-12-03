// @flow
import { vertical, horizontal } from '../../../../../../src/state/axis';
import fluidScroller, {
  type FluidScroller,
  type PublicArgs,
} from '../../../../../../src/state/auto-scroller/fluid-scroller';
import type { Axis } from '../../../../../../src/types';
import { getPreset } from '../../../../../utils/dimension';
import getSimpleStatePreset from '../../../../../utils/get-simple-state-preset';

export type BlockFnArgs = {|
  axis: Axis,
  preset: Object,
  state: Object,
|};

type BlockFn = (args: BlockFnArgs) => void;

export default (block: BlockFn) => {
  [vertical, horizontal].forEach((axis: Axis) => {
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

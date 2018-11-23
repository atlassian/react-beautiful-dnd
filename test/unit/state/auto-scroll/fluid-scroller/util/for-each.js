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
  scroller: FluidScroller,
  mocks: PublicArgs,
  preset: Object,
  state: Object,
|};

type BlockFn = (args: BlockFnArgs) => void;

export default (block: BlockFn) => {
  const mocks: PublicArgs = {
    scrollWindow: jest.fn(),
    scrollDroppable: jest.fn(),
  };
  const scroller: FluidScroller = fluidScroller(mocks);

  [vertical, horizontal].forEach((axis: Axis) => {
    describe(`on the ${axis.direction} axis`, () => {
      beforeEach(() => {
        requestAnimationFrame.reset();
      });
      afterAll(() => {
        requestAnimationFrame.reset();
      });

      const preset = getPreset(axis);
      const state = getSimpleStatePreset(axis);

      block({ axis, scroller, mocks, preset, state });
    });
  });
};

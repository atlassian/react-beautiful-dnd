// @flow
import fluidScroller, {
  type FluidScroller,
  type PublicArgs,
} from '../../../../../../src/state/auto-scroller/fluid-scroller';

const getStubs = (): PublicArgs => ({
  scrollWindow: jest.fn(),
  scrollDroppable: jest.fn(),
});

export default (args?: PublicArgs = getStubs()): FluidScroller =>
  fluidScroller(args);

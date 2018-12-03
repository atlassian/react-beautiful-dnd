// @flow
import forEach, { type BlockFnArgs } from './util/for-each';
import type { DraggingState } from '../../../../../src/types';
import getMocks from './util/get-args-mock';
import getScroller, {
  type FluidScroller,
} from '../../../../../src/state/auto-scroller/fluid-scroller';

forEach(({ axis, scroller, state, preset }: BlockFnArgs) => {
  it('should cancel any pending window scroll', () => {
    throw new Error('TODO');
  });

  it('should cancel any pending droppable scroll', () => {
    throw new Error('TODO');
  });
});

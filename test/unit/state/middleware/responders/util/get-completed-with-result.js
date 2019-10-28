// @flow
import type {
  DropResult,
  State,
  CompletedDrag,
} from '../../../../../../src/types';
import { invariant } from '../../../../../../src/invariant';

export default (result: DropResult, state: State): CompletedDrag => {
  invariant(
    state.phase === 'DRAGGING',
    `This is just a simple helper.
    Unsupported phase: ${state.phase}`,
  );

  return {
    afterCritical: state.afterCritical,
    critical: state.critical,
    result,
    impact: state.impact,
  };
};

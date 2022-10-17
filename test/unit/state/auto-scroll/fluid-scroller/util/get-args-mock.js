// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableId,
  FluidScrollerOptions,
} from '../../../../../../src/types';

// Similiar to PublicArgs
type Result = {|
  scrollWindow: JestMockFn<[Position], void>,
  scrollDroppable: JestMockFn<[DroppableId, Position], void>,
  fluidScrollerOptions?: FluidScrollerOptions,
|};

export default (): Result => {
  const scrollWindow: JestMockFn<[Position], void> = jest.fn();
  const scrollDroppable: JestMockFn<[DroppableId, Position], void> = jest.fn();

  return {
    scrollWindow,
    scrollDroppable,
  };
};

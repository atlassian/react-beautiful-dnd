// @flow
import type { Position } from 'css-box-model';
import type { DroppableId } from '../../../../../../src/types';

// Similiar to PublicArgs
type Result = {|
  scrollWindow: JestMockFn<[Position], void>,
  scrollDroppable: JestMockFn<[DroppableId, Position], void>,
|};

export default (): Result => {
  const scrollWindow: JestMockFn<[Position], void> = jest.fn();
  const scrollDroppable: JestMockFn<[DroppableId, Position], void> = jest.fn();

  return {
    scrollWindow,
    scrollDroppable,
  };
};

// @flow
import type { Handles } from '../../../../../../src/types';

export default (): Handles => ({
  onBeforeDragStart: jest.fn(),
  onDragStart: jest.fn(),
  onDragUpdate: jest.fn(),
  onDragEnd: jest.fn(),
});

// @flow
import type { Hooks } from '../../../../../../src/types';

export default (): Hooks => ({
  onBeforeDragStart: jest.fn(),
  onDragStart: jest.fn(),
  onDragUpdate: jest.fn(),
  onDragEnd: jest.fn(),
});

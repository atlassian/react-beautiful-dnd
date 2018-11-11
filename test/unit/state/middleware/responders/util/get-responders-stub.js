// @flow
import type { Responders } from '../../../../../../src/types';

export default (): Responders => ({
  onBeforeDragStart: jest.fn(),
  onDragStart: jest.fn(),
  onDragUpdate: jest.fn(),
  onDragEnd: jest.fn(),
});

// @flow
import type {
  OwnProps,
  MapProps,
  DispatchProps,
  Provided,
  Selector,
  StateSnapshot,
} from '../../../../../src/view/draggable/draggable-types';
import type {
  DraggableDescriptor,
  DroppableDescriptor,
  DraggingState,
} from '../../../../../src/types';
import { makeMapStateToProps } from '../../../../../src/view/draggable/connected-draggable';
import getSimpleStatePreset from '../../../../utils/get-simple-state-preset';

const state = getSimpleStatePreset();
const dragging: DraggingState = state.dragging();
export const draggable: DraggableDescriptor = dragging.critical.draggable;
export const droppable: DroppableDescriptor = dragging.critical.droppable;

export const defaultOwnProps: OwnProps = {
  draggableId: draggable.id,
  index: 0,
  isDragDisabled: false,
  disableInteractiveElementBlocking: false,
  // will be overwritten
  children: () => null,
};

const selector: Selector = makeMapStateToProps();

export const atRestMapProps: MapProps = selector(state.idle, defaultOwnProps);
export const whileDragging: MapProps = selector(dragging, defaultOwnProps);

export const getDispatchPropsStub = (): DispatchProps => ({
  lift: jest.fn(),
  move: jest.fn(),
  moveByWindowScroll: jest.fn(),
  moveUp: jest.fn(),
  moveDown: jest.fn(),
  moveRight: jest.fn(),
  moveLeft: jest.fn(),
  drop: jest.fn(),
  dropAnimationFinished: jest.fn(),
});

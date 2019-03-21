// @flow
import { getPreset } from '../../../../utils/dimension';
import type {
  MapProps,
  OwnProps,
  DispatchProps,
} from '../../../../../src/view/droppable/droppable-types';

export const preset = getPreset();

export const homeOwnProps: OwnProps = {
  droppableId: preset.home.descriptor.id,
  type: preset.home.descriptor.type,
  isDropDisabled: false,
  isCombineEnabled: false,
  direction: preset.home.axis.direction,
  ignoreContainerClipping: false,
  children: () => null,
};

export const foreignOwnProps: OwnProps = {
  ...homeOwnProps,
  droppableId: preset.foreign.descriptor.id,
  type: preset.foreign.descriptor.type,
  direction: preset.foreign.axis.direction,
};

export const homeAtRest: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  draggingFromThisWith: null,
  placeholder: null,
  shouldAnimatePlaceholder: false,
  snapshot: {
    isDraggingOver: false,
    draggingOverWith: null,
    draggingFromThisWith: null,
  },
};

export const isOverHome: MapProps = {
  isDraggingOver: true,
  draggingOverWith: preset.inHome1.descriptor.id,
  draggingFromThisWith: preset.inHome1.descriptor.id,
  placeholder: preset.inHome1.placeholder,
  // this can change during a drag
  shouldAnimatePlaceholder: false,
  snapshot: {
    isDraggingOver: true,
    draggingOverWith: preset.inHome1.descriptor.id,
    draggingFromThisWith: preset.inHome1.descriptor.id,
  },
};

export const isNotOverHome: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  draggingFromThisWith: preset.inHome1.descriptor.id,
  placeholder: preset.inHome1.placeholder,
  // this can change during a drag
  shouldAnimatePlaceholder: false,
  snapshot: {
    isDraggingOver: false,
    draggingOverWith: null,
    draggingFromThisWith: preset.inHome1.descriptor.id,
  },
};

export const homePostDropAnimation: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  draggingFromThisWith: null,
  placeholder: null,
  shouldAnimatePlaceholder: true,
  snapshot: {
    isDraggingOver: false,
    draggingOverWith: null,
    draggingFromThisWith: null,
  },
};

export const isOverForeign: MapProps = {
  isDraggingOver: true,
  draggingOverWith: preset.inHome1.descriptor.id,
  draggingFromThisWith: null,
  placeholder: preset.inHome1.placeholder,
  shouldAnimatePlaceholder: true,
  snapshot: {
    isDraggingOver: true,
    draggingOverWith: preset.inHome1.descriptor.id,
    draggingFromThisWith: null,
  },
};

export const isNotOverForeign: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  draggingFromThisWith: null,
  placeholder: null,
  shouldAnimatePlaceholder: false,
  snapshot: {
    isDraggingOver: false,
    draggingOverWith: null,
    draggingFromThisWith: null,
  },
};

export const dispatchProps: DispatchProps = {
  // $ExpectError
  updateViewportMaxScroll: () => {},
};

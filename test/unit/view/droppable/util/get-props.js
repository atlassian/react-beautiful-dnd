// @flow
import { getPreset } from '../../../../utils/dimension';
import type {
  MapProps,
  OwnProps,
} from '../../../../../src/view/droppable/droppable-types';

const preset = getPreset();

export const ownProps: OwnProps = {
  droppableId: preset.home.descriptor.id,
  type: preset.home.descriptor.type,
  isDropDisabled: false,
  isCombineEnabled: false,
  direction: preset.home.axis.direction,
  ignoreContainerClipping: false,
  children: () => null,
};

export const atRest: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  placeholder: null,
};
export const draggingOverHome: MapProps = {
  isDraggingOver: true,
  draggingOverWith: preset.inHome1.descriptor.id,
  placeholder: null,
};

export const isDraggingOverForeignMapProps: MapProps = {
  isDraggingOver: true,
  draggingOverWith: preset.inHome1.descriptor.id,
  placeholder: preset.inHome1.placeholder,
};

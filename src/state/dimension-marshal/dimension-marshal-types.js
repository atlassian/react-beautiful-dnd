// @flow
import type { Position } from 'css-box-model';
import type {
  UpdateDroppableScrollArgs,
  UpdateDroppableIsEnabledArgs,
  UpdateDroppableIsCombineEnabledArgs,
} from '../action-creators';
import type {
  DroppableId,
  Critical,
  DimensionMap,
  LiftRequest,
  Published,
  Viewport,
} from '../../types';

export type StartPublishingResult = {|
  critical: Critical,
  dimensions: DimensionMap,
  viewport: Viewport,
|};

export type DimensionMarshal = {|
  // it is possible for a droppable to change whether it is enabled during a drag
  updateDroppableIsEnabled: (id: DroppableId, isEnabled: boolean) => void,
  // it is also possible to update whether combining is enabled
  updateDroppableIsCombineEnabled: (
    id: DroppableId,
    isEnabled: boolean,
  ) => void,
  updateDroppableScroll: (id: DroppableId, newScroll: Position) => void,
  scrollDroppable: (id: DroppableId, change: Position) => void,
  // Entry
  startPublishing: (request: LiftRequest) => StartPublishingResult,
  stopPublishing: () => void,
|};

export type Callbacks = {|
  collectionStarting: () => mixed,
  publishWhileDragging: (args: Published) => mixed,
  updateDroppableScroll: (args: UpdateDroppableScrollArgs) => mixed,
  updateDroppableIsEnabled: (args: UpdateDroppableIsEnabledArgs) => mixed,
  updateDroppableIsCombineEnabled: (
    args: UpdateDroppableIsCombineEnabledArgs,
  ) => mixed,
|};

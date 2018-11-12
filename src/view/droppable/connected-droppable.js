// @flow
// eslint-disable-next-line
import { Component } from 'react';
import { connect } from 'react-redux';
import memoizeOne from 'memoize-one';
import { storeKey } from '../context-keys';
import Droppable from './droppable';
import isStrictEqual from '../is-strict-equal';
import shouldUsePlaceholder from '../../state/droppable/should-use-placeholder';
import whatIsDraggedOver from '../../state/droppable/what-is-dragged-over';
import type {
  State,
  DroppableId,
  DraggableId,
  DragImpact,
  DraggableDimension,
  Placeholder,
} from '../../types';
import type {
  MapProps,
  OwnProps,
  DefaultProps,
  Selector,
} from './droppable-types';

const defaultMapProps: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  placeholder: null,
};

// Returning a function to ensure each
// Droppable gets its own selector
export const makeMapStateToProps = (): Selector => {
  const getMapProps = memoizeOne(
    (
      isDraggingOver: boolean,
      draggingOverWith: ?DraggableId,
      placeholder: ?Placeholder,
    ): MapProps => ({
      isDraggingOver,
      draggingOverWith,
      placeholder,
    }),
  );

  const getDraggingOverProps = (
    id: DroppableId,
    draggable: DraggableDimension,
    impact: DragImpact,
  ) => {
    const isOver: boolean = whatIsDraggedOver(impact) === id;
    if (!isOver) {
      return defaultMapProps;
    }

    const usePlaceholder: boolean = shouldUsePlaceholder(
      draggable.descriptor,
      impact,
    );
    const placeholder: ?Placeholder = usePlaceholder
      ? draggable.placeholder
      : null;

    return getMapProps(true, draggable.descriptor.id, placeholder);
  };

  const selector = (state: State, ownProps: OwnProps): MapProps => {
    if (ownProps.isDropDisabled) {
      return defaultMapProps;
    }

    const id: DroppableId = ownProps.droppableId;

    if (state.isDragging) {
      const draggable: DraggableDimension =
        state.dimensions.draggables[state.critical.draggable.id];
      return getDraggingOverProps(id, draggable, state.impact);
    }

    if (state.phase === 'DROP_ANIMATING') {
      const draggable: DraggableDimension =
        state.dimensions.draggables[state.pending.result.draggableId];
      return getDraggingOverProps(id, draggable, state.pending.impact);
    }

    return defaultMapProps;
  };

  return selector;
};

const defaultProps = ({
  type: 'DEFAULT',
  direction: 'vertical',
  isDropDisabled: false,
  isCombineEnabled: false,
  ignoreContainerClipping: false,
}: DefaultProps);

// eslint-disable-next-line
/*::
class DroppableType extends React.Component<OwnProps> {
  static defaultProps = defaultProps;
}
*/

// Leaning heavily on the default shallow equality checking
// that `connect` provides.
// It avoids needing to do it own within `Droppable`
const ConnectedDroppable: typeof DroppableType = (connect(
  // returning a function so each component can do its own memoization
  makeMapStateToProps,
  // no dispatch props for droppable
  null,
  // mergeProps - using default
  null,
  {
    // Using our own store key.
    // This allows consumers to also use redux
    // Note: the default store key is 'store'
    storeKey,
    // pure: true is default value, but being really clear
    pure: true,
    // When pure, compares the result of mapStateToProps to its previous value.
    // Default value: shallowEqual
    // Switching to a strictEqual as we return a memoized object on changes
    areStatePropsEqual: isStrictEqual,
  },
): any)(Droppable);

ConnectedDroppable.defaultProps = defaultProps;

export default ConnectedDroppable;

// @flow
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import memoizeOne from 'memoize-one';
import { storeKey } from '../context-keys';
import { dragSelector, pendingDropSelector, phaseSelector } from '../../state/selectors';
import Droppable from './droppable';
import type {
  Phase,
  PendingDrop,
  DragState,
  State,
  DroppableId,
  DraggableLocation,
} from '../../types';
import type {
  OwnProps,
  MapProps,
} from './droppable-types';

export const makeSelector = () => {
  const idSelector = (state: State, ownProps: OwnProps) =>
    ownProps.droppableId;
  const isDropDisabledSelector = (state: State, ownProps: OwnProps) =>
    ownProps.isDropDisabled || false;

  const getIsDraggingOver = memoizeOne(
    (id: DroppableId, destination: ?DraggableLocation): boolean => {
      if (!destination) {
        return false;
      }
      return destination.droppableId === id;
    },
  );

  const getMapProps = memoizeOne((isDraggingOver: boolean): MapProps => ({
    isDraggingOver,
  }));

  return createSelector(
    [phaseSelector,
      dragSelector,
      pendingDropSelector,
      idSelector,
      isDropDisabledSelector,
    ],
    (phase: Phase,
      drag: ?DragState,
      pending: ?PendingDrop,
      id: DroppableId,
      isDropDisabled: boolean,
    ): MapProps => {
      if (isDropDisabled) {
        return getMapProps(false);
      }

      if (phase === 'DRAGGING') {
        if (!drag) {
          console.error('cannot determine dragging over as there is not drag');
          return getMapProps(false);
        }

        const isDraggingOver = getIsDraggingOver(id, drag.impact.destination);
        return getMapProps(isDraggingOver);
      }

      if (phase === 'DROP_ANIMATING') {
        if (!pending) {
          console.error('cannot determine dragging over as there is no pending result');
          return getMapProps(false);
        }

        const isDraggingOver = getIsDraggingOver(id, pending.last.impact.destination);
        return getMapProps(isDraggingOver);
      }

      return getMapProps(false);
    },
  );
};

const makeMapStateToProps = () => {
  const selector = makeSelector();
  return (state: State, props: OwnProps) => selector(state, props);
};

// Leaning heavily on the default shallow equality checking
// that `connect` provides.
// It avoids needing to do it own within `Droppable`
export default connect(
  makeMapStateToProps(),
  null,
  null,
  { storeKey },
)(Droppable);

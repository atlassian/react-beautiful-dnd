// @flow
import { connect } from 'react-redux';
import memoizeOne from 'memoize-one';
import { createSelector } from 'reselect';
import type { Selector } from 'reselect';
import type {
  State,
  TypeId,
} from '../../types';
import type { DispatchProps, MapProps, OwnProps } from './draggable-dimension-publisher-types';
import { storeKey } from '../context-keys';
import { publishDraggableDimension } from '../../state/action-creators';
import DraggableDimensionPublisher from './draggable-dimension-publisher';

const requestDimensionSelector =
  (state: State): ?TypeId => state.dimension.request;

const getOwnType = (state: State, props: OwnProps): TypeId => props.type;

export const makeSelector = (): Selector<State, OwnProps, MapProps> => {
  const getMapProps = memoizeOne(
    (shouldPublish: boolean): MapProps => ({
      shouldPublish,
    }),
  );

  return createSelector(
    [getOwnType, requestDimensionSelector],
    (ownType: TypeId, requestId: ?TypeId): MapProps =>
      getMapProps(ownType === requestId),
  );
};

const makeMapStateToProps = () => {
  const selector = makeSelector();
  return (state: State, props: OwnProps) => selector(state, props);
};

const mapDispatchToProps: DispatchProps = {
  publish: publishDraggableDimension,
};

export default connect(
  makeMapStateToProps,
  mapDispatchToProps,
  null,
  { storeKey },
)(DraggableDimensionPublisher);


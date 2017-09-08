// @flow
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import memoizeOne from 'memoize-one';
import type { State, TypeId } from '../../types';
import type {
  DispatchProps,
  MapProps,
  OwnProps,
  Selector,
} from './droppable-dimension-publisher-types';
import { storeKey } from '../context-keys';
import DroppableDimensionPublisher from './droppable-dimension-publisher';
import {
  publishDroppableDimension,
  updateDroppableIsEnabled,
  updateDroppableDimensionScroll,
} from '../../state/action-creators';

const requestDimensionSelector =
  (state: State): ?TypeId => state.dimension.request;

const getOwnType = (state: State, props: OwnProps): TypeId => props.type;

export const makeSelector = (): Selector => {
  const getMapProps = memoizeOne(
    (shouldPublish: boolean): MapProps => ({
      shouldPublish,
    })
  );

  return createSelector(
    [getOwnType, requestDimensionSelector],
    (ownType: TypeId, requested: ?TypeId): MapProps =>
      getMapProps(ownType === requested)
  );
};

const makeMapStateToProps = () => {
  const selector = makeSelector();
  return (state: State, props: OwnProps) => selector(state, props);
};

const mapDispatchToProps: DispatchProps = {
  publish: publishDroppableDimension,
  updateScroll: updateDroppableDimensionScroll,
  updateIsEnabled: updateDroppableIsEnabled,
};

export default connect(
  makeMapStateToProps,
  mapDispatchToProps,
  null,
  { storeKey }
)(DroppableDimensionPublisher);

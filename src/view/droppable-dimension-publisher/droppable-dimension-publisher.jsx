// @flow
import { Component } from 'react';
import type { Node } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import getWindowScrollPosition from '../get-window-scroll-position';
import getClientRect from '../../state/get-client-rect';
import { getDroppableDimension } from '../../state/dimension';
import getClosestScrollable from '../get-closest-scrollable';
import { dimensionMarshalKey } from '../context-keys';
import type { Marshal } from '../../state/dimension-marshal/dimension-marshal-types';
// eslint-disable-next-line no-duplicate-imports
import type {
  DroppableId,
  TypeId,
  DroppableDimension,
  DroppableDescriptor,
  Position,
  ClientRect,
  Spacing,
  Direction,
} from '../../types';

type Props = {|
  droppableId: DroppableId,
  type: TypeId,
  index: number,
  direction: Direction,
  isDropDisabled: boolean,
  ignoreContainerClipping: boolean,
  isDropDisabled: boolean,
  targetRef: ?HTMLElement,
  children: Node,
|}

type State = {|
  descriptor: DroppableDescriptor,
|}

const origin: Position = { x: 0, y: 0 };

const getScrollOffset = (closestScrollable: ?Element): Position => {
  if (!closestScrollable) {
    return origin;
  }

  const offset: Position = {
    x: closestScrollable.scrollLeft,
    y: closestScrollable.scrollTop,
  };

  return offset;
};

export default class DroppableDimensionPublisher extends Component<Props, State> {
  static contextTypes = {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  };

  constructor(props: Props, context: mixed) {
    super(props, context);

    this.state = {
      descriptor: this.getMemoizedDescriptor(
        this.props.droppableId,
        this.props.type,
        this.props.index
      ),
    };
  }

  componentDidMount() {
    const marshal: Marshal = this.context[dimensionMarshalKey];
    const descriptor: DroppableDescriptor = this.state.descriptor;

    marshal.registerDroppable(descriptor, this.getDimension);
  }

  componentWillReceiveProps(nextProps: Props) {
    const next: DroppableDescriptor = this.getMemoizedDescriptor(
      nextProps.droppableId,
      nextProps.type,
      nextProps.index
    );

    // TODO
    if (next !== this.state.descriptor) {
      console.warn('changing descriptor for Droppable while mounted');
      console.error('this is current not handled');
    }
  }

  componentWillUnmount() {
    const marshal: Marshal = this.context[dimensionMarshalKey];
    marshal.unregisterDroppable(this.props.droppableId);
  }

  getMemoizedDescriptor = memoizeOne(
    (id: DroppableId, type: TypeId, index: number): DroppableDescriptor => ({
      id,
      type,
      index,
    }));

  getDimension = (): DroppableDimension => {
    const {
      direction,
      ignoreContainerClipping,
      isDropDisabled,
      targetRef,
    } = this.props;
    const { descriptor } = this.state;
    if (!targetRef) {
      throw new Error('DimensionPublisher cannot calculate a dimension when not attached to the DOM');
    }

    const closestScrollable: ?Element = getClosestScrollable(targetRef);
    const scroll: Position = getScrollOffset(closestScrollable);
    const style: Object = window.getComputedStyle(targetRef);

    // keeping it simple and always using the margin of the droppable

    const margin: Spacing = {
      top: parseInt(style.marginTop, 10),
      right: parseInt(style.marginRight, 10),
      bottom: parseInt(style.marginBottom, 10),
      left: parseInt(style.marginLeft, 10),
    };
    const padding: Spacing = {
      top: parseInt(style.paddingTop, 10),
      right: parseInt(style.paddingRight, 10),
      bottom: parseInt(style.paddingBottom, 10),
      left: parseInt(style.paddingLeft, 10),
    };

    const clientRect: ClientRect = (targetRef.getBoundingClientRect(): any);

    // The droppable's own bounds should be treated as the
    // container bounds in the following situations:
    // 1. The consumer has opted in to ignoring container clipping
    // 2. There is no scroll container
    // 3. The droppable has internal scrolling
    const containerRect: ClientRect =
      ignoreContainerClipping ||
      !closestScrollable ||
      closestScrollable === targetRef ?
        clientRect : getClientRect(closestScrollable.getBoundingClientRect());

    const dimension: DroppableDimension = getDroppableDimension({
      descriptor,
      direction,
      clientRect,
      containerRect,
      margin,
      padding,
      windowScroll: getWindowScrollPosition(),
      scroll,
      isEnabled: !isDropDisabled,
    });

    return dimension;
  }

  render() {
    return this.props.children;
  }
}

// @flow
import { Component } from 'react';
import type { Node } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import rafSchedule from 'raf-schd';
import getWindowScrollPosition from '../get-window-scroll-position';
import getClientRect from '../../state/get-client-rect';
import { getDroppableDimension } from '../../state/dimension';
import getClosestScrollable from '../get-closest-scrollable';
import { dimensionMarshalKey } from '../context-keys';
import type { Marshal, DroppableCallbacks } from '../../state/dimension-marshal/dimension-marshal-types';
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
  updateScroll: (id: DroppableId, scroll: Position) => void,
  targetRef: ?HTMLElement,
  children: Node,
|}

type State = {|
  descriptor: DroppableDescriptor,
|}

const origin: Position = { x: 0, y: 0 };

export default class DroppableDimensionPublisher extends Component<Props, State> {
  /* eslint-disable react/sort-comp */
  closestScrollable: ?Element = null;
  isWatchingScroll: boolean = false;

  static contextTypes = {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  };

  getScrollOffset = (): Position => {
    if (!this.closestScrollable) {
      return origin;
    }

    const offset: Position = {
      x: this.closestScrollable.scrollLeft,
      y: this.closestScrollable.scrollTop,
    };

    return offset;
  }

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

  memoizedUpdateScroll = memoizeOne((x: number, y: number) => {
    const offset: Position = { x, y };
    this.props.updateScroll(this.props.droppableId, offset);
  });

  scheduleScrollUpdate = rafSchedule((offset: Position) => {
    // might no longer be listening for scroll changes by the time a frame comes back
    if (this.isWatchingScroll) {
      this.memoizedUpdateScroll(offset.x, offset.y);
    }
  });

  onClosestScroll = () => {
    this.scheduleScrollUpdate(this.getScrollOffset());
  }

  watchScroll = () => {
    console.info('requesting to watch scroll');
    if (!this.props.targetRef) {
      console.error('cannot watch droppable scroll if not in the dom');
      return;
    }

    // no closest parent
    if (this.closestScrollable == null) {
      return;
    }

    if (this.isWatchingScroll) {
      return;
    }

    this.isWatchingScroll = true;
    this.closestScrollable.addEventListener('scroll', this.onClosestScroll, { passive: true });
  };

  unwatchScroll = () => {
    if (!this.isWatchingScroll) {
      return;
    }

    this.isWatchingScroll = false;

    if (!this.closestScrollable) {
      console.error('cannot unbind event listener if element is null');
      return;
    }

    this.closestScrollable.removeEventListener('scroll', this.onClosestScroll);
  }

  componentDidMount() {
    const marshal: Marshal = this.context[dimensionMarshalKey];
    const descriptor: DroppableDescriptor = this.state.descriptor;

    const callbacks: DroppableCallbacks = {
      getDimension: this.getDimension,
      watchScroll: this.watchScroll,
      unwatchScroll: this.unwatchScroll,
    };

    marshal.registerDroppable(descriptor, callbacks);
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

    // side effect
    this.closestScrollable = getClosestScrollable(targetRef);
    const scroll: Position = this.getScrollOffset();
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
      !this.closestScrollable ||
      this.closestScrollable === targetRef ?
        clientRect : getClientRect(this.closestScrollable.getBoundingClientRect());

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

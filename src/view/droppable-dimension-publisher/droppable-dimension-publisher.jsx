// @flow
import { Component } from 'react';
import type { Node } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import rafSchedule from 'raf-schd';
import getWindowScroll from '../../window/get-window-scroll';
import getArea from '../../state/get-area';
import { getDroppableDimension } from '../../state/dimension';
import getClosestScrollable from '../get-closest-scrollable';
import { dimensionMarshalKey } from '../context-keys';
import { apply } from '../../state/position';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../state/dimension-marshal/dimension-marshal-types';
import type {
  DroppableId,
  TypeId,
  DroppableDimension,
  DroppableDescriptor,
  Position,
  Area,
  Spacing,
  Direction,
} from '../../types';

type Props = {|
  droppableId: DroppableId,
  type: TypeId,
  direction: Direction,
  isDropDisabled: boolean,
  ignoreContainerClipping: boolean,
  isDropDisabled: boolean,
  targetRef: ?HTMLElement,
  children: Node,
|}

const origin: Position = { x: 0, y: 0 };

export default class DroppableDimensionPublisher extends Component<Props> {
  /* eslint-disable react/sort-comp */
  closestScrollable: ?Element = null;
  isWatchingScroll: boolean = false;
  callbacks: DroppableCallbacks;
  publishedDescriptor: ?DroppableDescriptor = null;

  constructor(props: Props, context: mixed) {
    super(props, context);
    const callbacks: DroppableCallbacks = {
      getDimension: this.getDimension,
      watchScroll: this.watchScroll,
      unwatchScroll: this.unwatchScroll,
      scroll: this.scroll,
    };
    this.callbacks = callbacks;
  }

  static contextTypes = {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  };

  getClosestScroll = (): Position => {
    if (!this.closestScrollable) {
      return origin;
    }

    const offset: Position = {
      x: this.closestScrollable.scrollLeft,
      y: this.closestScrollable.scrollTop,
    };

    return offset;
  }

  memoizedUpdateScroll = memoizeOne((x: number, y: number) => {
    if (!this.publishedDescriptor) {
      console.error('Cannot update scroll on unpublished droppable');
      return;
    }

    const newScroll: Position = { x, y };
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.updateDroppableScroll(this.publishedDescriptor.id, newScroll);
  });

  scheduleScrollUpdate = rafSchedule(() => {
    // Capturing the scroll now so that it is the latest value
    const offset: Position = this.getClosestScroll();
    this.memoizedUpdateScroll(offset.x, offset.y);
  });
  // scheduleScrollUpdate = () => {
  //   // Capturing the scroll now so that it is the latest value
  //   const offset: Position = this.getClosestScroll();
  //   this.memoizedUpdateScroll(offset.x, offset.y);
  // };

  onClosestScroll = () => this.scheduleScrollUpdate();

  scroll = (change: Position) => {
    if (this.closestScrollable == null) {
      return;
    }

    if (!this.isWatchingScroll) {
      console.warn('Updating Droppable scroll while not watching for updates');
    }

    console.log('DroppableDimensionPublisher: now scrolling', change);

    this.closestScrollable.scrollTop += change.y;
    this.closestScrollable.scrollLeft += change.x;
  }

  watchScroll = () => {
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
    // it is possible for the dimension publisher to tell this component to unwatch scroll
    // when it was not listening to a scroll
    if (!this.isWatchingScroll) {
      return;
    }

    this.isWatchingScroll = false;
    this.scheduleScrollUpdate.cancel();

    if (!this.closestScrollable) {
      console.error('cannot unbind event listener if element is null');
      return;
    }

    this.closestScrollable.removeEventListener('scroll', this.onClosestScroll);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (!nextProps.targetRef) {
      console.error('Cannot update droppable dimension publisher without a target ref');
      return;
    }

    // 1. Update the descriptor
    // Note: not publishing it on componentDidMount as we do not have a ref at that point

    const { droppableId, type } = nextProps;
    const descriptor: DroppableDescriptor = this.getMemoizedDescriptor(
      droppableId, type,
    );

    this.publish(descriptor);

    // 2. Update is enabled

    if (this.props.isDropDisabled === nextProps.isDropDisabled) {
      return;
    }

    // the enabled state of the droppable is changing
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.updateDroppableIsEnabled(nextProps.droppableId, !nextProps.isDropDisabled);
  }

  componentWillUnmount() {
    if (this.isWatchingScroll) {
      console.warn('unmounting droppable while it was watching scroll');
      this.unwatchScroll();
    }

    this.unpublish();
  }

  getMemoizedDescriptor = memoizeOne(
    (id: DroppableId, type: TypeId): DroppableDescriptor => ({
      id,
      type,
    }));

  unpublish = () => {
    if (!this.publishedDescriptor) {
      console.error('cannot unpublish descriptor when none is published');
      return;
    }

    // Using the previously published id to unpublish. This is to guard
    // against the case where the id dynamically changes. This is not
    // supported during a drag - but it is good to guard against.
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.unregisterDroppable(this.publishedDescriptor);
    this.publishedDescriptor = null;
  }

  publish = (descriptor: DroppableDescriptor) => {
    if (descriptor === this.publishedDescriptor) {
      return;
    }

    if (this.publishedDescriptor) {
      this.unpublish();
    }

    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.registerDroppable(descriptor, this.callbacks);
    this.publishedDescriptor = descriptor;
  }

  getDimension = (): DroppableDimension => {
    const {
      direction,
      ignoreContainerClipping,
      isDropDisabled,
      targetRef,
    } = this.props;

    if (!targetRef) {
      throw new Error('DimensionPublisher cannot calculate a dimension when not attached to the DOM');
    }

    if (this.isWatchingScroll) {
      throw new Error('Attempting to recapture Droppable dimension while already watching scroll on previous capture');
    }

    const descriptor: ?DroppableDescriptor = this.publishedDescriptor;

    if (!descriptor) {
      throw new Error('Cannot get dimension for unpublished droppable');
    }

    // side effect - grabbing it for scroll listening so we know it is the same node
    this.closestScrollable = getClosestScrollable(targetRef);
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

    const client: Area = getArea(targetRef.getBoundingClientRect());

    // The droppable's own bounds should be treated as the
    // container bounds in the following situations:
    // 1. The consumer has opted in to ignoring container clipping
    // 2. There is no scroll container
    // 3. The droppable has internal scrolling

    const closest = (() => {
      const closestScrollable: ?Element = this.closestScrollable;

      if (!closestScrollable) {
        return null;
      }

      const frameClient: Area = getArea(closestScrollable.getBoundingClientRect());
      const scroll: Position = this.getClosestScroll();
      const scrollWidth: number = closestScrollable.scrollWidth;
      const scrollHeight: number = closestScrollable.scrollHeight;

      return {
        frameClient,
        scrollWidth,
        scrollHeight,
        scroll,
        shouldClipSubject: !ignoreContainerClipping,
      };
    })();

    const dimension: DroppableDimension = getDroppableDimension({
      descriptor,
      direction,
      client,
      closest,
      margin,
      padding,
      windowScroll: getWindowScroll(),
      isEnabled: !isDropDisabled,
    });

    return dimension;
  }

  render() {
    return this.props.children;
  }
}

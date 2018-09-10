// @flow
import React, { type Node } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import {
  getBox,
  withScroll,
  createBox,
  type BoxModel,
  type Position,
  type Spacing,
} from 'css-box-model';
import rafSchedule from 'raf-schd';
import getClosestScrollable from '../get-closest-scrollable';
import checkForNestedScrollContainers from './check-for-nested-scroll-container';
import { dimensionMarshalKey } from '../context-keys';
import { origin, subtract, isEqual } from '../../state/position';
import warmUpDimension from '../warm-up-dimension';
import {
  getDroppableDimension,
  type Closest,
} from '../../state/droppable-dimension';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../state/dimension-marshal/dimension-marshal-types';
import type {
  DroppableId,
  TypeId,
  DroppableDimension,
  DroppableDescriptor,
  Direction,
  ScrollOptions,
  ScrollSize,
} from '../../types';

type Props = {|
  droppableId: DroppableId,
  type: TypeId,
  direction: Direction,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  ignoreContainerClipping: boolean,
  isDropDisabled: boolean,
  getDroppableRef: () => ?HTMLElement,
  children: Node,
|};

const getScroll = (el: Element): Position => ({
  x: el.scrollLeft,
  y: el.scrollTop,
});

const getClient = (
  targetRef: HTMLElement,
  closestScrollable: ?Element,
): BoxModel => {
  const base: BoxModel = getBox(targetRef);

  // Droppable has no scroll parent
  if (!closestScrollable) {
    return base;
  }

  // Droppable is not the same as the closest scrollable
  if (targetRef !== closestScrollable) {
    return base;
  }

  // Droppable is scrollable

  // Element.getBoundingClient() returns:
  // When not scrollable: the full size of the element
  // When scrollable: the visible size of the element
  // (which is not the full width of its scrollable content)
  // So we recalculate the borderBox of a scrollable droppable to give
  // it its full dimensions. This will be cut to the correct size by the frame

  // Creating the paddingBox based on scrollWidth / scrollTop
  // scrollWidth / scrollHeight are based on the paddingBox of an element
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
  const top: number = base.paddingBox.top - closestScrollable.scrollTop;
  const left: number = base.paddingBox.left - closestScrollable.scrollLeft;
  const bottom: number = top + closestScrollable.scrollHeight;
  const right: number = left + closestScrollable.scrollWidth;

  const paddingBox: Spacing = {
    top,
    right,
    bottom,
    left,
  };

  // Creating the borderBox by adding the borders to the paddingBox
  const borderBox: Spacing = {
    top: paddingBox.top - base.border.top,
    right: paddingBox.right + base.border.right,
    bottom: paddingBox.bottom + base.border.bottom,
    left: paddingBox.left - base.border.left,
  };

  // We are not accounting for scrollbars
  // Adjusting for scrollbars is hard because:
  // - they are different between browsers
  // - scrollbars can be activated and removed during a drag
  // We instead account for this slightly in our auto scroller

  const client: BoxModel = createBox({
    borderBox,
    margin: base.margin,
    border: base.border,
    padding: base.padding,
  });
  return client;
};

type WatchingScroll = {|
  closestScrollable: Element,
  options: ScrollOptions,
|};

type GetDimensionResult = {|
  dimension: DroppableDimension,
  closestScrollable: ?Element,
|};

const listenerOptions = {
  passive: true,
};

export default class DroppableDimensionPublisher extends React.Component<
  Props,
> {
  /* eslint-disable react/sort-comp */
  watchingScroll: ?WatchingScroll = null;
  callbacks: DroppableCallbacks;
  publishedDescriptor: ?DroppableDescriptor = null;
  cancelWarmUp: () => void;

  constructor(props: Props, context: mixed) {
    super(props, context);
    const callbacks: DroppableCallbacks = {
      getDimensionAndWatchScroll: this.getDimensionAndWatchScroll,
      recollect: this.recollect,
      unwatchScroll: this.unwatchScroll,
      scroll: this.scroll,
    };
    this.callbacks = callbacks;
  }

  static contextTypes = {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  };

  getClosestScroll = (): Position => {
    if (!this.watchingScroll) {
      return origin;
    }

    return getScroll(this.watchingScroll.closestScrollable);
  };

  memoizedUpdateScroll = memoizeOne((x: number, y: number) => {
    invariant(
      this.publishedDescriptor,
      'Cannot update scroll on unpublished droppable',
    );

    const newScroll: Position = { x, y };
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.updateDroppableScroll(this.publishedDescriptor.id, newScroll);
  });

  updateScroll = () => {
    const offset: Position = this.getClosestScroll();
    this.memoizedUpdateScroll(offset.x, offset.y);
  };

  scheduleScrollUpdate = rafSchedule(this.updateScroll);

  onClosestScroll = () => {
    invariant(
      this.watchingScroll,
      'Could not find scroll options while scrolling',
    );
    const options: ScrollOptions = this.watchingScroll.options;
    if (options.shouldPublishImmediately) {
      this.updateScroll();
      return;
    }
    this.scheduleScrollUpdate();
  };

  scroll = (change: Position) => {
    invariant(
      this.watchingScroll,
      'Cannot scroll a droppable with no closest scrollable',
    );
    const { closestScrollable } = this.watchingScroll;
    console.log('forcing scroll change on el', change);
    const before: Position = this.getClosestScroll();
    closestScrollable.scrollTop += change.y;
    closestScrollable.scrollLeft += change.x;
    const after: Position = this.getClosestScroll();
    const actual: Position = subtract(after, before);
    if (!isEqual(actual, change)) {
      console.group('droppable scroll not applied correctly');
      console.log('requested', change);
      console.log('actual', actual);
      console.log('unaccounted for', subtract(change, actual));
      console.groupEnd();
    }
  };

  watchScroll = (closestScrollable: Element, options: ScrollOptions) => {
    invariant(
      !this.watchingScroll,
      'Droppable cannot watch scroll as it is already watching scroll',
    );

    if (!closestScrollable) {
      return;
    }

    this.watchingScroll = {
      options,
      closestScrollable,
    };

    closestScrollable.addEventListener(
      'scroll',
      this.onClosestScroll,
      listenerOptions,
    );
  };

  unwatchScroll = () => {
    // Was not previously watching scroll.
    // It is possible for a Droppable to be asked to unwatch a scroll
    // (Eg it has not been collected yet, and the drag ends)
    const watching: ?WatchingScroll = this.watchingScroll;

    if (!watching) {
      return;
    }

    this.scheduleScrollUpdate.cancel();
    watching.closestScrollable.removeEventListener(
      'scroll',
      this.onClosestScroll,
      listenerOptions,
    );
    this.watchingScroll = null;
  };

  componentDidMount() {
    this.publish();
    this.cancelWarmUp = warmUpDimension(this.getDimension);

    // Note: not calling `marshal.updateDroppableIsEnabled()`
    // If the dimension marshal needs to get the dimension immediately
    // then it will get the enabled state of the dimension at that point
  }

  componentDidUpdate(prevProps: Props) {
    // Update the descriptor if needed
    this.publish();

    // We now need to check if the disabled flag has changed
    if (this.props.isDropDisabled === prevProps.isDropDisabled) {
      return;
    }

    // The enabled state of the droppable is changing.
    // We need to let the marshal know incase a drag is currently occurring
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.updateDroppableIsEnabled(
      this.props.droppableId,
      !this.props.isDropDisabled,
    );
  }

  componentWillUnmount() {
    if (this.watchingScroll) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Unmounting droppable while it was watching scroll');
      }
      this.unwatchScroll();
    }

    this.unpublish();
    this.cancelWarmUp();
  }

  getMemoizedDescriptor = memoizeOne(
    (id: DroppableId, type: TypeId): DroppableDescriptor => ({
      id,
      type,
    }),
  );

  publish = () => {
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    const descriptor: DroppableDescriptor = this.getMemoizedDescriptor(
      this.props.droppableId,
      this.props.type,
    );

    if (!this.publishedDescriptor) {
      marshal.registerDroppable(descriptor, this.callbacks);
      this.publishedDescriptor = descriptor;
      return;
    }

    // already published - and no changes
    if (this.publishedDescriptor === descriptor) {
      return;
    }

    // already published and there has been changes
    marshal.updateDroppable(
      this.publishedDescriptor,
      descriptor,
      this.callbacks,
    );
    this.publishedDescriptor = descriptor;
  };

  unpublish = () => {
    invariant(
      this.publishedDescriptor,
      'Cannot unpublish descriptor when none is published',
    );

    // Using the previously published id to unpublish. This is to guard
    // against the case where the id dynamically changes. This is not
    // supported during a drag - but it is good to guard against.
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.unregisterDroppable(this.publishedDescriptor);
    this.publishedDescriptor = null;
  };

  // Used when Draggables are added or removed from a Droppable during a drag
  recollect = (): DroppableDimension => {
    const watching: ?WatchingScroll = this.watchingScroll;
    invariant(
      watching,
      'Can only recollect Droppable client for Droppables that have a scroll container',
    );

    const targetRef: ?HTMLElement = this.props.getDroppableRef();
    invariant(targetRef, 'Cannot recollect without a droppable ref');

    // TODO: needs to disable the placeholder for the collection
    // this.props.placeholder.hide();
    const { dimension } = this.getDimension();
    // this.props.placeholder.show();
    return dimension;
  };

  getDimension = (windowScroll?: Position = origin): GetDimensionResult => {
    const {
      direction,
      ignoreContainerClipping,
      isDropDisabled,
      isCombineEnabled,
      getDroppableRef,
    } = this.props;

    this.cancelWarmUp();
    const targetRef: ?HTMLElement = getDroppableRef();
    const descriptor: ?DroppableDescriptor = this.publishedDescriptor;

    invariant(
      targetRef,
      'Cannot calculate a dimension when not attached to the DOM',
    );
    invariant(descriptor, 'Cannot get dimension for unpublished droppable');

    const closestScrollable: ?Element = getClosestScrollable(targetRef);

    // print a debug warning if using an unsupported nested scroll container setup
    checkForNestedScrollContainers(closestScrollable);

    const client: BoxModel = getClient(targetRef, closestScrollable);
    const page: BoxModel = withScroll(client, windowScroll);

    const closest: ?Closest = (() => {
      if (!closestScrollable) {
        return null;
      }

      const frameClient: BoxModel = getBox(closestScrollable);
      const scrollSize: ScrollSize = {
        scrollHeight: closestScrollable.scrollHeight,
        scrollWidth: closestScrollable.scrollWidth,
      };

      return {
        client: frameClient,
        page: withScroll(frameClient),
        scroll: getScroll(closestScrollable),
        scrollSize,
        shouldClipSubject: !ignoreContainerClipping,
      };
    })();

    const dimension: DroppableDimension = getDroppableDimension({
      descriptor,
      isEnabled: !isDropDisabled,
      isCombineEnabled,
      direction,
      client,
      page,
      closest,
    });

    return { dimension, closestScrollable };
  };

  getDimensionAndWatchScroll = (
    windowScroll: Position,
    options: ScrollOptions,
  ): DroppableDimension => {
    const { dimension, closestScrollable } = this.getDimension(windowScroll);
    if (closestScrollable) {
      this.watchScroll(closestScrollable, options);
    }
    return dimension;
  };

  render() {
    return this.props.children;
  }
}

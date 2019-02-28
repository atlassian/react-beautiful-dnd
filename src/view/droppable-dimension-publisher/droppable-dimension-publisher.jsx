// @flow
import React, { type Node } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import rafSchedule from 'raf-schd';
import checkForNestedScrollContainers from './check-for-nested-scroll-container';
import { dimensionMarshalKey } from '../context-keys';
import { origin } from '../../state/position';
import getScroll from './get-scroll';
import type {
  DimensionMarshal,
  DroppableCallbacks,
} from '../../state/dimension-marshal/dimension-marshal-types';
import getEnv, { type Env } from './get-env';
import type {
  DroppableId,
  TypeId,
  DroppableDimension,
  DroppableDescriptor,
  Direction,
  ScrollOptions,
} from '../../types';
import getDimension from './get-dimension';
import { warning } from '../../dev-warning';

type Props = {|
  droppableId: DroppableId,
  type: TypeId,
  direction: Direction,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  isSortDisabled: boolean,
  ignoreContainerClipping: boolean,
  getPlaceholderRef: () => ?HTMLElement,
  getDroppableRef: () => ?HTMLElement,
  children: Node,
|};

type WhileDragging = {|
  ref: HTMLElement,
  descriptor: DroppableDescriptor,
  env: Env,
  scrollOptions: ScrollOptions,
|};

const getClosestScrollable = (dragging: ?WhileDragging): ?Element =>
  (dragging && dragging.env.closestScrollable) || null;

const immediate = {
  passive: false,
};
const delayed = {
  passive: true,
};

const getListenerOptions = (options: ScrollOptions) =>
  options.shouldPublishImmediately ? immediate : delayed;

const withoutPlaceholder = (
  placeholder: ?HTMLElement,
  fn: () => DroppableDimension,
): DroppableDimension => {
  if (!placeholder) {
    return fn();
  }

  const last: string = placeholder.style.display;
  placeholder.style.display = 'none';
  const result: DroppableDimension = fn();
  placeholder.style.display = last;

  return result;
};

export default class DroppableDimensionPublisher extends React.Component<Props> {
  /* eslint-disable react/sort-comp */
  dragging: ?WhileDragging;
  callbacks: DroppableCallbacks;
  publishedDescriptor: ?DroppableDescriptor = null;

  constructor(props: Props, context: mixed) {
    super(props, context);
    const callbacks: DroppableCallbacks = {
      getDimensionAndWatchScroll: this.getDimensionAndWatchScroll,
      recollect: this.recollect,
      dragStopped: this.dragStopped,
      scroll: this.scroll,
    };
    this.callbacks = callbacks;
  }

  static contextTypes = {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  };

  getClosestScroll = (): Position => {
    const dragging: ?WhileDragging = this.dragging;
    if (!dragging || !dragging.env.closestScrollable) {
      return origin;
    }

    return getScroll(dragging.env.closestScrollable);
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
    const scroll: Position = this.getClosestScroll();
    this.memoizedUpdateScroll(scroll.x, scroll.y);
  };

  scheduleScrollUpdate = rafSchedule(this.updateScroll);

  onClosestScroll = () => {
    const dragging: ?WhileDragging = this.dragging;
    const closest: ?Element = getClosestScrollable(this.dragging);

    invariant(
      dragging && closest,
      'Could not find scroll options while scrolling',
    );
    const options: ScrollOptions = dragging.scrollOptions;
    if (options.shouldPublishImmediately) {
      this.updateScroll();
      return;
    }
    this.scheduleScrollUpdate();
  };

  scroll = (change: Position) => {
    const closest: ?Element = getClosestScrollable(this.dragging);
    invariant(closest, 'Cannot scroll a droppable with no closest scrollable');
    closest.scrollTop += change.y;
    closest.scrollLeft += change.x;
  };

  dragStopped = () => {
    const dragging: ?WhileDragging = this.dragging;
    invariant(dragging, 'Cannot stop drag when no active drag');
    const closest: ?Element = getClosestScrollable(dragging);

    // goodbye old friend
    this.dragging = null;

    if (!closest) {
      return;
    }

    // unwatch scroll
    this.scheduleScrollUpdate.cancel();
    closest.removeEventListener(
      'scroll',
      this.onClosestScroll,
      getListenerOptions(dragging.scrollOptions),
    );
  };

  componentDidMount() {
    this.publish();

    // Note: not calling `marshal.updateDroppableIsEnabled()`
    // If the dimension marshal needs to get the dimension immediately
    // then it will get the enabled state of the dimension at that point
  }

  componentDidUpdate(prevProps: Props) {
    // Update the descriptor if needed
    this.publish();

    // Do not need to update the marshal if no drag is occurring
    if (!this.dragging) {
      return;
    }

    // Need to update the marshal if an enabled state is changing

    const isDisabledChanged: boolean =
      this.props.isDropDisabled !== prevProps.isDropDisabled;
    const isCombineChanged: boolean =
      this.props.isCombineEnabled !== prevProps.isCombineEnabled;
    const isSortChanged: boolean =
      this.props.isSortDiabled !== prevProps.isSortDisabled;

    if (!isDisabledChanged && !isCombineChanged) {
      return;
    }

    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];

    if (isDisabledChanged) {
      marshal.updateDroppableIsEnabled(
        this.props.droppableId,
        !this.props.isDropDisabled,
      );
    }

    if (isCombineChanged) {
      marshal.updateDroppableIsCombineEnabled(
        this.props.droppableId,
        this.props.isCombineEnabled,
      );
    }

    if (isSortChanged) {
      marshal.updateDroppableIsSortDisabled(
        this.props.droppableId,
        this.props.isSortDisabled,
      );
    }
  }

  componentWillUnmount() {
    if (this.dragging) {
      warning('unmounting droppable while a drag is occurring');
      this.dragStopped();
    }

    this.unpublish();
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
    const dragging: ?WhileDragging = this.dragging;
    const closest: ?Element = getClosestScrollable(dragging);
    invariant(
      dragging && closest,
      'Can only recollect Droppable client for Droppables that have a scroll container',
    );

    return withoutPlaceholder(this.props.getPlaceholderRef(), () =>
      getDimension({
        ref: dragging.ref,
        descriptor: dragging.descriptor,
        env: dragging.env,
        windowScroll: origin,
        direction: this.props.direction,
        isDropDisabled: this.props.isDropDisabled,
        isCombineEnabled: this.props.isCombineEnabled,
        isSortDisabled: this.props.isSortDisabled,
        shouldClipSubject: !this.props.ignoreContainerClipping,
      }),
    );
  };

  getDimensionAndWatchScroll = (
    windowScroll: Position,
    options: ScrollOptions,
  ): DroppableDimension => {
    invariant(
      !this.dragging,
      'Cannot collect a droppable while a drag is occurring',
    );
    const descriptor: ?DroppableDescriptor = this.publishedDescriptor;
    invariant(descriptor, 'Cannot get dimension for unpublished droppable');
    const ref: ?HTMLElement = this.props.getDroppableRef();
    invariant(ref, 'Cannot collect without a droppable ref');
    const env: Env = getEnv(ref);

    const dragging: WhileDragging = {
      ref,
      descriptor,
      env,
      scrollOptions: options,
    };
    this.dragging = dragging;

    const dimension: DroppableDimension = getDimension({
      ref,
      descriptor,
      env,
      windowScroll,
      direction: this.props.direction,
      isDropDisabled: this.props.isDropDisabled,
      isCombineEnabled: this.props.isCombineEnabled,
      isSortDisabled: this.props.isSortDisabled,
      shouldClipSubject: !this.props.ignoreContainerClipping,
    });

    if (env.closestScrollable) {
      // bind scroll listener

      env.closestScrollable.addEventListener(
        'scroll',
        this.onClosestScroll,
        getListenerOptions(dragging.scrollOptions),
      );
      // print a debug warning if using an unsupported nested scroll container setup
      if (process.env.NODE_ENV !== 'production') {
        checkForNestedScrollContainers(env.closestScrollable);
      }
    }

    return dimension;
  };

  render() {
    return this.props.children;
  }
}

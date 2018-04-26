// @flow
import { Component, type Node } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import { getBox, withScroll, type BoxModel } from 'css-box-model';
import rafSchedule from 'raf-schd';
import getClosestScrollable from '../get-closest-scrollable';
import { dimensionMarshalKey } from '../context-keys';
import { getDroppableDimension, type Closest } from '../../state/droppable-dimension';
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
  Direction,
  ScrollOptions,
} from '../../types';

type Props = {|
  droppableId: DroppableId,
  type: TypeId,
  direction: Direction,
  isDropDisabled: boolean,
  ignoreContainerClipping: boolean,
  isDropDisabled: boolean,
  getDroppableRef: () => ?HTMLElement,
  children: Node,
|}

const origin: Position = { x: 0, y: 0 };

const getScroll = (el: Element): Position => ({
  x: el.scrollLeft,
  y: el.scrollTop,
});

export default class DroppableDimensionPublisher extends Component<Props> {
  /* eslint-disable react/sort-comp */
  closestScrollable: ?Element = null;
  isWatchingScroll: boolean = false;
  scrollOptions: ?ScrollOptions = null;
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

    return getScroll(this.closestScrollable);
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

  updateScroll = () => {
    const offset: Position = this.getClosestScroll();
    this.memoizedUpdateScroll(offset.x, offset.y);
  }

  scheduleScrollUpdate = rafSchedule(this.updateScroll);

  onClosestScroll = () => {
    if (!this.scrollOptions) {
      console.error('Cannot find scroll options while scrolling');
      return;
    }
    if (this.scrollOptions.shouldPublishImmediately) {
      this.updateScroll();
      return;
    }
    this.scheduleScrollUpdate();
  }

  scroll = (change: Position) => {
    if (this.closestScrollable == null) {
      console.error('Cannot scroll a droppable with no closest scrollable');
      return;
    }

    if (!this.isWatchingScroll) {
      console.error('Updating Droppable scroll while not watching for updates');
      return;
    }

    this.closestScrollable.scrollTop += change.y;
    this.closestScrollable.scrollLeft += change.x;
  }

  watchScroll = (options: ScrollOptions) => {
    if (!this.props.getDroppableRef()) {
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
    this.scrollOptions = options;
    this.closestScrollable.addEventListener('scroll', this.onClosestScroll, { passive: true });
  };

  unwatchScroll = () => {
    // it is possible for the dimension publisher to tell this component to unwatch scroll
    // when it was not listening to a scroll
    if (!this.isWatchingScroll) {
      return;
    }

    this.isWatchingScroll = false;
    this.scrollOptions = null;
    this.scheduleScrollUpdate.cancel();

    if (!this.closestScrollable) {
      console.error('cannot unbind event listener if element is null');
      return;
    }

    this.closestScrollable.removeEventListener('scroll', this.onClosestScroll);
  }

  componentDidMount() {
    this.publish();

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
    marshal.updateDroppableIsEnabled(this.props.droppableId, !this.props.isDropDisabled);
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

  publish = () => {
    const descriptor: DroppableDescriptor = this.getMemoizedDescriptor(
      this.props.droppableId,
      this.props.type,
    );

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

  unpublish = () => {
    if (!this.publishedDescriptor) {
      console.error('Cannot unpublish descriptor when none is published');
      return;
    }

    // Using the previously published id to unpublish. This is to guard
    // against the case where the id dynamically changes. This is not
    // supported during a drag - but it is good to guard against.
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.unregisterDroppable(this.publishedDescriptor);
    this.publishedDescriptor = null;
  }

  getDimension = (): DroppableDimension => {
    const {
      direction,
      ignoreContainerClipping,
      isDropDisabled,
      getDroppableRef,
    } = this.props;

    const targetRef: ?HTMLElement = getDroppableRef();
    const descriptor: ?DroppableDescriptor = this.publishedDescriptor;

    invariant(targetRef, 'DimensionPublisher cannot calculate a dimension when not attached to the DOM');
    invariant(!this.isWatchingScroll, 'Attempting to recapture Droppable dimension while already watching scroll on previous capture');
    invariant(descriptor, 'Cannot get dimension for unpublished droppable');

    // Reading once and supplying to all functions

    const client: BoxModel = getBox(targetRef);
    const page: BoxModel = withScroll(client);
    const closestScrollable: ?Element = getClosestScrollable(targetRef);

    // side effect
    this.closestScrollable = closestScrollable;

    const closest: ?Closest = (() => {
      if (!closestScrollable) {
        return null;
      }

      const closestClient: BoxModel = getBox(closestScrollable);

      return {
        client: closestClient,
        page: withScroll(closestClient),
        scrollHeight: closestScrollable.scrollHeight,
        scrollWidth: closestScrollable.scrollWidth,
        scroll: getScroll(closestScrollable),
        shouldClipSubject: !ignoreContainerClipping,
      };
    })();

    return getDroppableDimension({
      descriptor,
      isEnabled: !isDropDisabled,
      direction,
      client,
      page,
      closest,
    });
  }

  render() {
    return this.props.children;
  }
}

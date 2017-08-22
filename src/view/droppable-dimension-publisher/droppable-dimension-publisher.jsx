// @flow
import { Component } from 'react';
import invariant from 'invariant';
import rafScheduler from 'raf-schd';
import memoizeOne from 'memoize-one';
import getWindowScrollPosition from '../get-window-scroll-position';
import { getDroppableDimension } from '../../state/dimension';
import getClosestScrollable from '../get-closest-scrollable';
// eslint-disable-next-line no-duplicate-imports
import type { Margin } from '../../state/dimension';
import type { DroppableDimension, Position, HTMLElement } from '../../types';
import type { Props } from './droppable-dimension-publisher-types';

const origin: Position = { x: 0, y: 0 };

export default class DroppableDimensionPublisher extends Component {
  /* eslint-disable react/sort-comp */
  props: Props;

  isWatchingScroll: boolean = false;
  closestScrollable: HTMLElement = null;

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

  getDimension = (): DroppableDimension => {
    const { droppableId, direction, targetRef } = this.props;
    invariant(targetRef, 'DimensionPublisher cannot calculate a dimension when not attached to the DOM');

    const style = window.getComputedStyle(targetRef);

    const margin: Margin = {
      top: parseInt(style.marginTop, 10),
      right: parseInt(style.marginRight, 10),
      bottom: parseInt(style.marginBottom, 10),
      left: parseInt(style.marginLeft, 10),
    };

    const dimension: DroppableDimension = getDroppableDimension({
      id: droppableId,
      direction,
      clientRect: targetRef.getBoundingClientRect(),
      margin,
      windowScroll: getWindowScrollPosition(),
      scroll: this.getScrollOffset(),
    });

    return dimension;
  }

  memoizedUpdateScroll = memoizeOne((x: number, y: number) => {
    const offset: Position = { x, y };
    this.props.updateScroll(this.props.droppableId, offset);
  });

  scheduleScrollUpdate = rafScheduler((offset: Position) => {
    // might no longer be listening for scroll changes by the time a frame comes back
    if (this.isWatchingScroll) {
      this.memoizedUpdateScroll(offset.x, offset.y);
    }
  });

  componentWillUnmount() {
    if (this.isWatchingScroll) {
      this.unwatchScroll();
    }
  }

  onClosestScroll = () => {
    this.scheduleScrollUpdate(this.getScrollOffset());
  }

  watchScroll = () => {
    invariant(this.props.targetRef, 'cannot watch scroll if not in the dom');

    // no closest parent
    if (this.closestScrollable == null) {
      return;
    }

    if (this.isWatchingScroll) {
      return;
    }

    this.isWatchingScroll = true;
    this.closestScrollable.addEventListener('scroll', this.onClosestScroll, { passive: true });
  }

  unwatchScroll = () => {
    if (!this.isWatchingScroll) {
      return;
    }

    this.isWatchingScroll = false;
    this.closestScrollable.removeEventListener('scroll', this.onClosestScroll);
  }

  // TODO: componentDidUpdate?
  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.targetRef !== this.props.targetRef) {
      if (this.isWatchingScroll) {
        console.warn('changing targetRef while watching scroll!');
        this.unwatchScroll();
      }
    }

    // Because the dimension publisher wraps children - it might render even when its props do
    // not change. We need to ensure that it does not publish when it should not.
    const shouldPublish = !this.props.shouldPublish && nextProps.shouldPublish;

    // should no longer watch for scrolling
    if (!nextProps.shouldPublish) {
      this.unwatchScroll();
      return;
    }

    if (!shouldPublish) {
      return;
    }

    // discovering the closest scrollable for a drag
    this.closestScrollable = getClosestScrollable(this.props.targetRef);
    this.props.publish(this.getDimension());
    this.watchScroll();
  }

  render() {
    return this.props.children;
  }
}

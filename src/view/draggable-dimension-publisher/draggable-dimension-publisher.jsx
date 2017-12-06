// @flow
import { Component } from 'react';
import invariant from 'invariant';
import getWindowScrollPosition from '../get-window-scroll-position';
import { getDraggableDimension } from '../../state/dimension';
import type { DraggableDimension, Spacing, ClientRect } from '../../types';

type Props = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
  targetRef: ?HTMLElement,
  children: Node,
|}

export default class DraggableDimensionPublisher extends Component<Props> {
  /* eslint-disable react/sort-comp */
  getDimension = (): DraggableDimension => {
    const {
      draggableId,
      droppableId,
      targetRef,
    } = this.props;

    invariant(targetRef, 'DraggableDimensionPublisher cannot calculate a dimension when not attached to the DOM');

    const descriptor: DraggableDescriptor = {
      id: draggableId,
      droppableId,
      index,
    };

    const style = window.getComputedStyle(targetRef);

    const margin: Spacing = {
      top: parseInt(style.marginTop, 10),
      right: parseInt(style.marginRight, 10),
      bottom: parseInt(style.marginBottom, 10),
      left: parseInt(style.marginLeft, 10),
    };

    // We do not need to worry about 'box-sizing' because getBoundingClientRect already
    // takes that into account
    const clientRect: ClientRect = (targetRef.getBoundingClientRect() : any);

    const dimension: DraggableDimension = getDraggableDimension({
      descriptor,
      clientRect,
      margin,
      windowScroll: getWindowScrollPosition(),
    });

    return dimension;
  }

  /* eslint-enable react/sort-comp */

  // TODO: componentDidUpdate?
  componentWillReceiveProps(nextProps: Props) {
    // Because the dimension publisher wraps children - it might render even when its props do
    // not change. We need to ensure that it does not publish when it should not.
    const shouldPublish = !this.props.shouldPublish && nextProps.shouldPublish;

    if (shouldPublish) {
      this.props.publish(this.getDimension());
    }
  }

  render() {
    return this.props.children;
  }
}


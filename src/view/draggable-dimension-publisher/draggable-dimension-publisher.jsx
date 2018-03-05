// @flow
import { Component } from 'react';
import type { Node } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import getWindowScroll from '../window/get-window-scroll';
import { getDraggableDimension } from '../../state/dimension';
import { dimensionMarshalKey } from '../context-keys';
import getArea from '../../state/get-area';
import type {
  DraggableDescriptor,
  DraggableDimension,
  Spacing,
  Area,
  DraggableId,
  DroppableId,
} from '../../types';
import type { DimensionMarshal } from '../../state/dimension-marshal/dimension-marshal-types';

type Props = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
  index: number,
  targetRef: ?HTMLElement,
  children: Node,
|}

export default class DraggableDimensionPublisher extends Component<Props> {
  /* eslint-disable react/sort-comp */
  static contextTypes = {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  };

  publishedDescriptor: ?DraggableDescriptor = null

  componentWillReceiveProps(nextProps: Props) {
    const { draggableId, droppableId, index, targetRef } = nextProps;

    if (!targetRef) {
      console.error('Updating draggable dimension handler without a targetRef');
      return;
    }

    // Note: not publishing it on componentDidMount as we do not have a ref at that point

    const descriptor: DraggableDescriptor = this.getMemoizedDescriptor(
      draggableId, droppableId, index
    );

    this.publish(descriptor);
  }

  componentWillUnmount() {
    this.unpublish();
  }

  getMemoizedDescriptor = memoizeOne(
    (id: DraggableId, droppableId: DroppableId, index: number): DraggableDescriptor => ({
      id,
      droppableId,
      index,
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
    marshal.unregisterDraggable(this.publishedDescriptor);
    this.publishedDescriptor = null;
  }

  publish = (descriptor: DraggableDescriptor) => {
    if (descriptor === this.publishedDescriptor) {
      return;
    }

    if (this.publishedDescriptor) {
      this.unpublish();
    }

    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.registerDraggable(descriptor, this.getDimension);
    this.publishedDescriptor = descriptor;
  }

  getDimension = (): DraggableDimension => {
    const targetRef: ?HTMLElement = this.props.targetRef;

    if (!targetRef) {
      throw new Error('DraggableDimensionPublisher cannot calculate a dimension when not attached to the DOM');
    }

    const descriptor: ?DraggableDescriptor = this.publishedDescriptor;

    if (!descriptor) {
      throw new Error('Cannot get dimension for unpublished draggable');
    }

    const style = window.getComputedStyle(targetRef);

    const margin: Spacing = {
      top: parseInt(style.marginTop, 10),
      right: parseInt(style.marginRight, 10),
      bottom: parseInt(style.marginBottom, 10),
      left: parseInt(style.marginLeft, 10),
    };

    // We do not need to worry about 'box-sizing' because getBoundingClientRect already
    // takes that into account
    const paddingBox: Area = getArea(targetRef.getBoundingClientRect());

    const dimension: DraggableDimension = getDraggableDimension({
      descriptor,
      paddingBox,
      margin,
      windowScroll: getWindowScroll(),
    });

    return dimension;
  }

  render() {
    return this.props.children;
  }
}


// @flow
import { Component } from 'react';
import type { Node } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import getWindowScrollPosition from '../get-window-scroll-position';
import { getDraggableDimension } from '../../state/dimension';
import { dimensionMarshalKey } from '../context-keys';
import type {
  DraggableDescriptor,
  DraggableDimension,
  Spacing,
  ClientRect,
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

  componentWillMount() {
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    const { draggableId, droppableId, index } = this.props;
    const descriptor: DraggableDescriptor = this.getMemoizedDescriptor(
      draggableId, droppableId, index
    );

    marshal.registerDraggable(descriptor, this.getDimension);
  }

  componentWillReceiveProps(nextProps: Props) {
    const { draggableId, droppableId, index } = nextProps;
    const descriptor: DraggableDescriptor = this.getMemoizedDescriptor(
      draggableId, droppableId, index
    );

    this.publishDescriptorChange(descriptor);
  }

  componentWillUnmount() {
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.unregisterDraggable(this.props.draggableId);
  }

  getMemoizedDescriptor = memoizeOne(
    (id: DraggableId, droppableId: DroppableId, index: number): DraggableDescriptor => ({
      id,
      droppableId,
      index,
    }));

  publishDescriptorChange = memoizeOne((descriptor: DraggableDescriptor) => {
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.unregisterDraggable(descriptor.id);
    marshal.registerDraggable(descriptor, this.getDimension);
  })

  getDimension = (): DraggableDimension => {
    const { targetRef, draggableId, droppableId, index } = this.props;
    if (!targetRef) {
      throw new Error('DraggableDimensionPublisher cannot calculate a dimension when not attached to the DOM');
    }

    const descriptor: DraggableDescriptor = this.getMemoizedDescriptor(
      draggableId, droppableId, index
    );

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

  render() {
    return this.props.children;
  }
}


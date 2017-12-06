// @flow
import { Component } from 'react';
import type { Node } from 'react';
import PropTypes from 'prop-types';
import invariant from 'invariant';
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
import type { Marshal } from '../../state/dimension-marshal/dimension-marshal-types';

type Props = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
  index: number,
  targetRef: ?HTMLElement,
  children: Node,
|}

type State = {|
  descriptor: DraggableDescriptor,
|}

export default class DraggableDimensionPublisher extends Component<Props, State> {
  static contextTypes = {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  };

  constructor(props: Props, context: mixed) {
    super(props, context);

    this.state = {
      descriptor: this.getMemoizedDescriptor(
        this.props.draggableId,
        this.props.droppableId,
        this.props.index
      ),
    };
  }

  componentDidMount() {
    const marshal: Marshal = this.context[dimensionMarshalKey];
    const descriptor: DraggableDescriptor = this.state.descriptor;

    marshal.registerDraggable(descriptor, this.getDimension);
  }

  componentWillReceiveProps(nextProps: Props) {
    const next: DraggableDescriptor = this.getMemoizedDescriptor(
      nextProps.draggableId,
      nextProps.droppableId,
      nextProps.index
    );

    // TODO
    if (next !== this.state.descriptor) {
      console.warn('changing descriptor for Draggable while mounted');
      console.error('this is current not handled');
    }
  }

  componentWillUnmount() {
    const marshal: Marshal = this.context.marshal;

    marshal.unregisterDraggable(this.props.draggableId);
  }

  getMemoizedDescriptor = memoizeOne(
    (id: DraggableId, droppableId: DroppableId, index: number): DraggableDescriptor => ({
      id,
      droppableId,
      index,
    }));

  getDimension = (): DraggableDimension => {
    const { targetRef } = this.props;
    const { descriptor } = this.state;

    invariant(targetRef, 'DraggableDimensionPublisher cannot calculate a dimension when not attached to the DOM');

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


// @flow
import { Component, type Node } from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import { calculateBox, withScroll, type BoxModel } from 'css-box-model';
import getWindowScroll from '../window/get-window-scroll';
import { dimensionMarshalKey } from '../context-keys';
import type {
  DraggableDescriptor,
  DraggableDimension,
  Placeholder,
  DraggableId,
  DroppableId,
} from '../../types';
import type { DimensionMarshal } from '../../state/dimension-marshal/dimension-marshal-types';

type Props = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
  index: number,
  getDraggableRef: () => ?HTMLElement,
  children: Node,
|}

export default class DraggableDimensionPublisher extends Component<Props> {
  /* eslint-disable react/sort-comp */
  static contextTypes = {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  };

  publishedDescriptor: ?DraggableDescriptor = null

  componentDidMount() {
    this.publish();
  }

  componentDidUpdate() {
    this.publish();
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

  publish = () => {
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    const descriptor: DraggableDescriptor = this.getMemoizedDescriptor(
      this.props.draggableId,
      this.props.droppableId,
      this.props.index
    );

    if (!this.publishedDescriptor) {
      marshal.registerDraggable(descriptor, this.getDimension);
      this.publishedDescriptor = descriptor;
      return;
    }

    // No changes to the descriptor
    if (descriptor === this.publishedDescriptor) {
      return;
    }

    marshal.updateDraggable(this.publishedDescriptor, descriptor, this.getDimension);
    this.publishedDescriptor = descriptor;
  }

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

  getDimension = (): DraggableDimension => {
    const targetRef: ?HTMLElement = this.props.getDraggableRef();
    const descriptor: ?DraggableDescriptor = this.publishedDescriptor;

    invariant(targetRef, 'DraggableDimensionPublisher cannot calculate a dimension when not attached to the DOM');
    invariant(descriptor, 'Cannot get dimension for unpublished draggable');

    const computedStyles: CSSStyleDeclaration = window.getComputedStyle(targetRef);

    // Capturing borderBox without transforms or top / left positioning
    // Fingers crossed that this does not cause any flashing
    // TODO: anyway to unwind just the ones we care about?
    const previous = {
      transform: computedStyles.transform,
      // transition: computedStyles.transition,
      // top: computedStyles.top,
      // left: computedStyles.left,
    };

    targetRef.style.transform = 'none';
    // targetRef.style.transition = 'none';
    // targetRef.style.top = '0px';
    // targetRef.style.left = '0px';
    const borderBox: ClientRect = targetRef.getBoundingClientRect();
    // targetRef.style.transition = previous.transition;
    targetRef.style.transform = previous.transform;
    targetRef.getBoundingClientRect();
    // targetRef.style.top = previous.top;
    // targetRef.style.left = previous.left;

    const client: BoxModel = calculateBox(borderBox, computedStyles);

    const page: BoxModel = withScroll(client, getWindowScroll());

    const placeholder: Placeholder = {
      client,
      tagName: targetRef.tagName.toLowerCase(),
      display: computedStyles.display,
    };

    const dimension: DraggableDimension = {
      descriptor,
      placeholder,
      client,
      page,
    };

    return dimension;
  }

  render() {
    return this.props.children;
  }
}


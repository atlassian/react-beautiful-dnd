// @flow
import { Component, type Node } from 'react';
import type { Position } from 'css-box-model';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import { calculateBox, withScroll, type BoxModel, getBox } from 'css-box-model';
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
  getPlaceholderRef: () => ?HTMLElement,
  children: Node,
|}

type PositionStyleToggle = {|
  capture: () => void,
  clear: () => void,
  restore: () => void,
|}

const style = document.createElement('style');
style.innerHTML = `
  .alex-test {
    /* shifted draggables */
    transform: none !important;
    /* dragging item */
    position: inherit !important;
    top: inherit !important;
    left: inherit !important;
  }
`;
const head = document.querySelector('head');
head.appendChild(style);

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

  getDimension = (windowScroll: Position): DraggableDimension => {
    const targetRef: ?HTMLElement = this.props.getDraggableRef();
    const placeholderRef: ?HTMLElement = this.props.getPlaceholderRef();
    const descriptor: ?DraggableDescriptor = this.publishedDescriptor;

    invariant(targetRef, 'DraggableDimensionPublisher cannot calculate a dimension when not attached to the DOM');
    invariant(descriptor, 'Cannot get dimension for unpublished draggable');

    const ref: HTMLElement = placeholderRef || targetRef;

    if (ref === placeholderRef) {
      console.log('using placeholder ref for', descriptor.id);
    }
    // TODO: rather than toggling these properties (yuck) - force offset with current offset

    const previous = {
      transition: ref.style.transition,
      transform: ref.style.transform,
    };
    ref.style.transition = 'none';
    ref.style.transform = 'none';

    const computedStyles: CSSStyleDeclaration = window.getComputedStyle(ref);
    const borderBox: ClientRect = ref.getBoundingClientRect();

    Object.assign(ref.style, previous);

    const client: BoxModel = calculateBox(borderBox, computedStyles);
    const page: BoxModel = withScroll(client, windowScroll);

    console.warn(descriptor.id, 'collected pageBorderBoxCenter', page.borderBox.center, 'height', client.borderBox.height);
    if (placeholderRef) {
      const box = getBox(targetRef);
      console.warn(descriptor.id, 'targetRef (not placeholder) pageBorderBoxCenter', box.borderBox.center, 'height', box.borderBox.height);
    }

    const placeholder: Placeholder = {
      client,
      tagName: ref.tagName.toLowerCase(),
      display: computedStyles.display,
      boxSizing: computedStyles.boxSizing,
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


// @flow
import { Component } from 'react';
import PropTypes from 'prop-types';
import invariant from 'invariant';
import getWindowScrollPosition from '../get-window-scroll-position';
import { getDraggableDimension } from '../../state/dimension';
import { dimensionMarshalKey } from '../context-keys';
import type { DraggableDescriptor, DraggableDimension, Spacing, ClientRect } from '../../types';
import type { Marshal } from '../../state/dimension-marshal/dimension-marshal-types';

type Props = {|
  descriptor: DraggableDescriptor,
  targetRef: ?HTMLElement,
  children: Node,
|}

export default class DraggableDimensionPublisher extends Component<Props> {
  static contextTypes = {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  };

  componentDidMount() {
    const marshal: Marshal = this.context.marshal;
    const descriptor: DraggableDescriptor = this.props.descriptor;

    marshal.registerDraggable(descriptor, this.getDimension);
  }

  componentWillUpdate(nextProps: Props) {
    // TODO: handle updates to an existing draggable
    if (this.props.descriptor !== nextProps.descriptor) {
      console.warn('descriptor changing on mounted draggable', nextProps.descriptor.id);
    }
  }

  componentWillUnmount() {
    const marshal: Marshal = this.context.marshal;
    const descriptor: DraggableDescriptor = this.props.descriptor;

    marshal.unregisterDraggable(descriptor.id);
  }

  getDimension = (): DraggableDimension => {
    const { descriptor, targetRef } = this.props;

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


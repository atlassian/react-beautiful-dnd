// @flow
import {
  type BoxModel,
  type Position,
  calculateBox,
  withScroll,
} from 'css-box-model';
import type {
  DraggableDescriptor,
  DraggableDimension,
  Placeholder,
} from '../../types';
import { origin } from '../../state/position';

export default function getDimension(
  descriptor: DraggableDescriptor,
  el: HTMLElement,
  windowScroll?: Position = origin,
): DraggableDimension {
  const computedStyles: CSSStyleDeclaration = window.getComputedStyle(el);
  const borderBox: ClientRect = el.getBoundingClientRect();
  const client: BoxModel = calculateBox(borderBox, computedStyles);
  const page: BoxModel = withScroll(client, windowScroll);

  const placeholder: Placeholder = {
    client,
    tagName: el.tagName.toLowerCase(),
    display: computedStyles.display,
  };
  const displaceBy: Position = {
    x: client.marginBox.width,
    y: client.marginBox.height,
  };

  const dimension: DraggableDimension = {
    descriptor,
    placeholder,
    displaceBy,
    client,
    page,
  };

  return dimension;
}

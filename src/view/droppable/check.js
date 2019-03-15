// @flow
import invariant from 'tiny-invariant';
import type { Props } from './droppable-types';
import isHtmlElement from '../is-type-of-element/is-html-element';
import { warning } from '../../dev-warning';

export function checkOwnProps(props: Props) {
  invariant(props.droppableId, 'A Droppable requires a droppableId prop');
  invariant(
    typeof props.isDropDisabled === 'boolean',
    'isDropDisabled must be a boolean',
  );
  invariant(
    typeof props.isCombineEnabled === 'boolean',
    'isCombineEnabled must be a boolean',
  );
  invariant(
    typeof props.ignoreContainerClipping === 'boolean',
    'ignoreContainerClipping must be a boolean',
  );
}

export function checkPlaceholder(props: Props, placeholderEl: ?HTMLElement) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (!props.placeholder) {
    return;
  }

  if (placeholderEl) {
    return;
  }

  warning(`
    Droppable setup issue [droppableId: "${props.droppableId}"]:
    DroppableProvided > placeholder could not be found.

    Please be sure to add the {provided.placeholder} React Node as a child of your Droppable.
    More information: https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/api/droppable.md
  `);
}

export function checkProvidedRef(ref: ?mixed) {
  invariant(
    ref && isHtmlElement(ref),
    `
    provided.innerRef has not been provided with a HTMLElement.

    You can find a guide on using the innerRef callback functions at:
    https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/using-inner-ref.md
  `,
  );
}

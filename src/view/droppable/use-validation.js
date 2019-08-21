// @flow
import { useEffect } from 'react';
import invariant from 'tiny-invariant';
import type { Props } from './droppable-types';
import { warning } from '../../dev-warning';
import checkIsValidInnerRef from '../check-is-valid-inner-ref';

function checkOwnProps(props: Props) {
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
    typeof props.isCombineOnly === 'boolean',
    'isCombineOnly must be a boolean',
  );
  invariant(
    typeof props.ignoreContainerClipping === 'boolean',
    'ignoreContainerClipping must be a boolean',
  );
}

function checkPlaceholderRef(props: Props, placeholderEl: ?HTMLElement) {
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

type Args = {|
  props: Props,
  getDroppableRef: () => ?HTMLElement,
  getPlaceholderRef: () => ?HTMLElement,
|};

export default function useValidation({
  props,
  getDroppableRef,
  getPlaceholderRef,
}: Args) {
  // Running on every update
  useEffect(() => {
    // wrapping entire block for better minification
    if (process.env.NODE_ENV !== 'production') {
      checkOwnProps(props);
      checkIsValidInnerRef(getDroppableRef());
      checkPlaceholderRef(props, getPlaceholderRef());
    }
  });
}

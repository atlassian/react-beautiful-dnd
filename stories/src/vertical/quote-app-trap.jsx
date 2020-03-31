// @flow
import React, { useState } from 'react';
import styled from '@emotion/styled';
import type { Quote } from '../types';
import type { DropResult } from '../../../src/types';
import { DragDropContext } from '../../../src';
import QuoteListTrap from '../primatives/quote-list-trap';
import reorder from '../reorder';
import { grid } from '../constants';

const Root = styled.div`
  /* flexbox */
  padding-top: ${grid * 2}px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

type Props = {|
  initial: Quote[],
  isCombineEnabled?: boolean,
  listStyle?: Object,
|};

const queryAttr = 'data-rbd-drag-handle-draggable-id';

export default function QuoteApp(props: Props) {
  const [quotes, setQuotes] = useState(() => props.initial);

  function onDragStart() {
    // Add a little vibration if the browser supports it.
    // Add's a nice little physical feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  }

  function onDragEnd(result: DropResult) {
    // combining item
    if (result.combine) {
      // super simple: just removing the dragging item
      const newQuotes: Quote[] = [...quotes];
      newQuotes.splice(result.source.index, 1);
      setQuotes(newQuotes);
      return;
    }

    // dropped outside the list
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const newQuotes = reorder(
      quotes,
      result.source.index,
      result.destination.index,
    );

    setQuotes(newQuotes);
  }

  function getItemStyle(draggableStyle, mode, draggableId) {
    if (mode !== 'FLUID') {
      return draggableStyle;
    }
    const domQuery = `[${queryAttr}='${draggableId}']`;
    const draggedDOM = document.querySelector(domQuery);
    const { transform } = draggableStyle;
    let activeTransform = {
      boxSizing: 'border-box',
    };

    if (transform) {
      const { y, height } = draggedDOM.getBoundingClientRect();
      const {
        y: availableY,
        height: availableHeight,
      } = draggedDOM.parentNode.getBoundingClientRect();
      const currentY = draggedDOM.getAttribute(
        'data-rbd-drag-draggable-trappedY',
      );
      const trappedY = transform.substring(
        transform.indexOf(',') + 1,
        transform.indexOf(')'),
      );

      const isMoreThenMin = y - availableY >= 0;
      const isLessThenMax = y - availableY + height <= availableHeight;

      if (
        (isMoreThenMin && isLessThenMax) ||
        (!isMoreThenMin &&
          parseInt(currentY, 10) < parseInt(trappedY, 10)) ||
        (!isLessThenMax &&
          parseInt(currentY, 10) > parseInt(trappedY, 10))
      ) {
        draggedDOM.setAttribute('data-rbd-drag-draggable-trappedY', trappedY);
        activeTransform = {
          ...activeTransform,
          transform: `translate(0, ${trappedY})`,
        };
      } else if (currentY) {
        activeTransform = {
          ...activeTransform,
          transform: `translate(0, ${currentY})`,
        };
      }
    }
    return {
      ...draggableStyle,
      ...activeTransform,
    };
  }

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <Root>
        <QuoteListTrap
          listId="list"
          style={props.listStyle}
          quotes={quotes}
          isCombineEnabled={props.isCombineEnabled}
          getItemStyle={getItemStyle}
        />
      </Root>
    </DragDropContext>
  );
}

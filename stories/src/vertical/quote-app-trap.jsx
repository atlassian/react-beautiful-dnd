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
  const [placeholderProps, setPlaceholderProps] = useState({});

  function onDragStart() {
    // Add a little vibration if the browser supports it.
    // Add's a nice little physical feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  }

  function onDragEnd(result: DropResult) {
    // combining item
    setPlaceholderProps({});
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

  function onDragUpdate(update: DragUpdate) {
    if (!update.destination) {
      return;
    }

    const draggableId = update.draggableId;
    const destinationIndex = update.destination.index;
    const domQuery = `[${queryAttr}='${draggableId}']`;
    const draggedDOM = document.querySelector(domQuery);

    if (!draggedDOM) {
      setPlaceholderProps({});
      return;
    }

    const { clientHeight, clientWidth } = draggedDOM;

    const parentStyle = window.getComputedStyle(draggedDOM.parentNode);

    const elements = Array.prototype.slice.call(draggedDOM.parentNode.children);
    const clientY = elements
      .slice(0, destinationIndex)
      .reduce((total, curr) => {
        const style = curr.currentStyle || window.getComputedStyle(curr);
        const marginBottom = parseInt(style.marginBottom, 10);
        return total + curr.clientHeight + marginBottom;
      }, parseInt(parentStyle.paddingTop, 10));

    setPlaceholderProps({
      clientHeight,
      clientWidth,
      clientY,
      clientX: parseInt(parentStyle.paddingLeft, 10),
      parentHeight: parseInt(parentStyle.height, 10),
    });
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
      const currentCurrentY = draggedDOM.getAttribute(
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
          parseInt(currentCurrentY, 10) < parseInt(trappedY, 10)) ||
        (!isLessThenMax &&
          parseInt(currentCurrentY, 10) > parseInt(trappedY, 10))
      ) {
        draggedDOM.setAttribute('data-rbd-drag-draggable-trappedY', trappedY);
        activeTransform = {
          ...activeTransform,
          transform: `translate(0, ${trappedY})`,
        };
      } else if (currentCurrentY) {
        activeTransform = {
          ...activeTransform,
          transform: `translate(0, ${currentCurrentY})`,
        };
      }
    }
    return {
      ...draggableStyle,
      ...activeTransform,
    };
  }

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragUpdate={onDragUpdate}
    >
      <Root>
        <QuoteListTrap
          listId="list"
          style={props.listStyle}
          quotes={quotes}
          isCombineEnabled={props.isCombineEnabled}
          placeholderProps={placeholderProps}
          getItemStyle={getItemStyle}
        />
      </Root>
    </DragDropContext>
  );
}

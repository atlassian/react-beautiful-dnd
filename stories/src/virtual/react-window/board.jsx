// @flow
import React, { useState } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';
import { colors } from '@atlaskit/theme';
import type {
  DropResult,
  DraggableLocation,
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
  DraggableDescriptor,
  DroppableStateSnapshot,
} from '../../../../src';
import type { QuoteMap, Quote } from '../../types';
import Title from '../../primatives/title';
import { reorderQuoteMap } from '../../reorder';
import { DragDropContext, Droppable, Draggable } from '../../../../src';
import QuoteItem from '../../primatives/quote-item';
import { grid, borderRadius } from '../../constants';
import { getBackgroundColor } from '../../primatives/quote-list';

type Props = {|
  initial: QuoteMap,
|};

const Container = styled.div`
  display: flex;
`;

type RowProps = {
  data: Quote[],
  index: number,
  style: Object,
};

const Row = React.memo(({ data: quotes, index, style }: RowProps) => {
  const quote: ?Quote = quotes[index];

  // placeholder :D
  if (!quote) {
    return null;
  }

  const patchedStyle = {
    ...style,
    left: style.left + grid,
    top: style.top + grid,
    width: `calc(${style.width} - ${grid * 2}px)`,
    height: style.height - grid,
  };

  return (
    <Draggable draggableId={quote.id} index={index} key={quote.id}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <QuoteItem
          provided={provided}
          quote={quote}
          isDragging={snapshot.isDragging}
          style={patchedStyle}
        />
      )}
    </Draggable>
  );
}, areEqual);

type ColumnProps = {|
  columnId: string,
  quotes: Quote[],
|};

const ColumnContainer = styled.div`
  border-top-left-radius: ${borderRadius}px;
  border-top-right-radius: ${borderRadius}px;
  background-color: ${colors.N30};
  flex-shrink: 0;
  margin: ${grid}px;
  display: flex;
  flex-direction: column;
`;

const Column = React.memo(function Column(props: ColumnProps) {
  const { columnId, quotes } = props;

  return (
    <ColumnContainer>
      <Title>{columnId}</Title>
      <Droppable
        droppableId={columnId}
        mode="VIRTUAL"
        renderClone={(
          provided: DraggableProvided,
          snapshot: DraggableStateSnapshot,
          descriptor: DraggableDescriptor,
        ) => (
          <QuoteItem
            provided={provided}
            isDragging={snapshot.isDragging}
            quote={quotes[descriptor.index]}
            style={{ margin: 0 }}
          />
        )}
      >
        {(
          droppableProvided: DroppableProvided,
          snapshot: DroppableStateSnapshot,
        ) => {
          // TODO: should snapshot include `placeholder` data?
          const itemCount: number = (() => {
            if (snapshot.isDraggingOver && !snapshot.draggingFromThisWith) {
              return quotes.length + 1;
            }
            return quotes.length;
          })();

          return (
            <List
              height={500}
              itemCount={itemCount}
              itemSize={110}
              width={300}
              outerRef={droppableProvided.innerRef}
              style={{
                backgroundColor: getBackgroundColor(
                  snapshot.isDraggingOver,
                  Boolean(snapshot.draggingFromThisWith),
                ),
                transition: 'background-color 0.2s ease',
                padding: grid,
              }}
              itemData={quotes}
            >
              {Row}
            </List>
          );
        }}
      </Droppable>
    </ColumnContainer>
  );
});

function Board(props: Props) {
  const [columns, setColumns] = useState(() => props.initial);
  const [ordered] = useState(() => Object.keys(props.initial));

  function onDragEnd(result: DropResult) {
    if (!result.destination) {
      return;
    }
    const source: DraggableLocation = result.source;
    const destination: DraggableLocation = result.destination;

    // did not move anywhere - can bail early
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const updated = reorderQuoteMap({
      quoteMap: columns,
      source,
      destination,
    });

    setColumns(updated.quoteMap);
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Container>
          {ordered.map((key: string) => {
            const quotes: Quote[] = columns[key];

            return <Column key={key} quotes={quotes} columnId={key} />;
          })}
        </Container>
      </DragDropContext>
      <Global
        styles={css`
          body {
            background: ${colors.B200} !important;
          }
        `}
      />
    </>
  );
}

export default Board;

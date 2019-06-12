// @flow
import React, { useState, useEffect } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import styled from '@emotion/styled';
import { colors } from '@atlaskit/theme';
import type {
  DropResult,
  DraggableLocation,
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
} from '../../../src';
import type { QuoteMap, Quote } from '../types';
import reorder, { reorderQuoteMap } from '../reorder';
import { DragDropContext, Droppable, Draggable } from '../../../src';
import QuoteItem from '../primatives/quote-item';
import { grid, borderRadius } from '../constants';

type Props = {|
  initial: QuoteMap,
|};

type ItemProps = {|
  provided: DraggableProvided,
  quote: Quote,
  style?: Object,
|};

function Item(props: ItemProps) {
  const { quote, provided, style } = props;

  useEffect(() => {
    console.log('quote mounted', quote.id);
    return () => console.log('quote unmounted', quote.id);
  }, [quote.id]);
  return (
    <div
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      ref={provided.innerRef}
      style={{
        ...provided.draggableProps.style,
        ...style,
      }}
    >
      {quote.id}
    </div>
  );
}

const Container = styled.div`
  display: flex;
  background: blue;
`;

const Row = React.memo(({ data: quotes, index, style }) => {
  const quote: Quote = quotes[index];

  return (
    <Draggable draggableId={quote.id} index={index} key={quote.id}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <QuoteItem
          provided={provided}
          quote={quote}
          style={style}
          isDragging={snapshot.isDragging}
          style={{ margin: 0, ...style }}
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

const ColumnHeader = styled.h3`
  align-self: center;
  padding: ${grid}px;
`;

const Column = React.memo(function Column(props: ColumnProps) {
  const { columnId, quotes } = props;

  return (
    <ColumnContainer>
      <ColumnHeader>{columnId}</ColumnHeader>
      <Droppable
        droppableId={columnId}
        mode="VIRTUAL"
        whenDraggingClone={(
          provided: DraggableProvided,
          snapshot: DraggableStateSnapshot,
          source: DraggableLocation,
        ) => (
          <QuoteItem
            provided={provided}
            isDragging={snapshot.isDragging}
            quote={quotes[source.index]}
            style={{ margin: 0 }}
          />
        )}
      >
        {(droppableProvided: DroppableProvided) => (
          <List
            height={500}
            itemCount={quotes.length}
            itemSize={110}
            width={300}
            innerRef={droppableProvided.innerRef}
            itemData={quotes}
          >
            {Row}
          </List>
        )}
      </Droppable>
    </ColumnContainer>
  );
});

function Board(props: Props) {
  const [columns, setColumns] = useState(() => props.initial);
  const [ordered, setOrder] = useState(() => Object.keys(props.initial));

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
    <DragDropContext onDragEnd={onDragEnd}>
      <Container>
        {ordered.map((key: string, index: number) => {
          const quotes: Quote[] = columns[key];

          return <Column key={key} quotes={quotes} columnId={key} />;
        })}
      </Container>
    </DragDropContext>
  );
}

export default Board;

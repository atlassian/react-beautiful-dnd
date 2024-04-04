// @flow
import * as React from 'react';
import { useReducer } from 'react';
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
  DraggableRubric,
  DroppableStateSnapshot,
} from '../../../../src';
import type { QuoteMap, Quote } from '../../types';
import Title from '../../primatives/title';
import { reorderQuoteMap } from '../../reorder';
import { DragDropContext, Droppable, Draggable } from '../../../../src';
import QuoteItem from '../../primatives/quote-item';
import { grid, borderRadius } from '../../constants';
import { getBackgroundColor } from '../../primatives/quote-list';
import QuoteCountSlider from '../quote-count-chooser';
import { generateQuoteMap } from '../../data';

const Container = styled.div`
  display: flex;
`;

type RowProps = {
  data: Quote[],
  index: number,
  style: Object,
};

// Memoizing row items for even better performance!
const Row = React.memo(({ data: quotes, index, style }: RowProps) => {
  const quote: ?Quote = quotes[index];

  // We are rendering an extra item for the placeholder
  // Do do this we increased our data set size to include one 'fake' item
  if (!quote) {
    return null;
  }

  // Faking some nice spacing around the items
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
        mode="virtual"
        renderClone={(
          provided: DraggableProvided,
          snapshot: DraggableStateSnapshot,
          rubric: DraggableRubric,
        ) => (
          <QuoteItem
            provided={provided}
            isDragging={snapshot.isDragging}
            quote={quotes[rubric.source.index]}
            style={{ margin: 0 }}
          />
        )}
      >
        {(
          droppableProvided: DroppableProvided,
          snapshot: DroppableStateSnapshot,
        ) => {
          // Add an extra item to our list to make space for a dragging item
          // Usually the DroppableProvided.placeholder does this, but that won't
          // work in a virtual list
          const itemCount: number = snapshot.isUsingPlaceholder
            ? quotes.length + 1
            : quotes.length;

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
                // We add this spacing so that when we drop into an empty list we will animate to the correct visual position.
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

type State = {|
  itemCount: number,
  quoteMap: QuoteMap,
  columnKeys: string[],
|};

function getColumnKeys(quoteMap: QuoteMap): string[] {
  return Object.keys(quoteMap).sort();
}

function getInitialState() {
  const itemCount: number = 10000;
  const quoteMap: QuoteMap = generateQuoteMap(itemCount);
  const columnKeys: string[] = getColumnKeys(quoteMap);
  return {
    itemCount,
    quoteMap,
    columnKeys,
  };
}

type Action =
  | {|
      type: 'CHANGE_COUNT',
      payload: number,
    |}
  | {|
      type: 'REORDER',
      payload: QuoteMap,
    |};

function reducer(state: State, action: Action) {
  if (action.type === 'CHANGE_COUNT') {
    const quoteMap: QuoteMap = generateQuoteMap(action.payload);
    return {
      itemCount: action.payload,
      quoteMap,
      columnKeys: getColumnKeys(quoteMap),
    };
  }
  if (action.type === 'REORDER') {
    return {
      itemCount: state.itemCount,
      quoteMap: action.payload,
      columnKeys: getColumnKeys(action.payload),
    };
  }

  return state;
}

type Empty = {||};

// eslint-disable-next-line no-unused-vars
function Board(props: Empty) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

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
      quoteMap: state.quoteMap,
      source,
      destination,
    });

    dispatch({ type: 'REORDER', payload: updated.quoteMap });
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Container>
          {state.columnKeys.map((key: string) => {
            const quotes: Quote[] = state.quoteMap[key];

            return <Column key={key} quotes={quotes} columnId={key} />;
          })}
        </Container>
        <QuoteCountSlider
          library="react-window"
          count={state.itemCount}
          onCountChange={(count: number) =>
            dispatch({ type: 'CHANGE_COUNT', payload: count })
          }
        />
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

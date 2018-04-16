// @flow
import React from 'react';
import styled from 'styled-components';
import { colors } from '@atlaskit/theme';
import { Draggable, Droppable } from '../../../../../src';
import Quote from './quote';
import { grid } from '../../../layouts/constants';
import type {
  DroppableProvided,
  DraggableProvided,
  DroppableStateSnapshot,
  DraggableStateSnapshot
} from '../../../../../src';
import type { Column as ColumnType } from './board-types';
import type { Quote as QuoteType } from '../../types';

type InnerListProps = {|
  quotes: QuoteType[],
|}

// A performance optimisation to avoid rendering all the children
// when dragging over a list
class InnerList extends React.Component<InnerListProps> {
  shouldComponentUpdate(nextProps: InnerListProps) {
    // items have not changed
    if (this.props.quotes === nextProps.quotes) {
      return false;
    }
    return true;
  }

  render() {
    return this.props.quotes.map((quote: QuoteType, index: number) => (
      <Quote key={quote.id} quote={quote} index={index} />
    ));
  }
}

const interactive: string = colors.G50;

const Container = styled.div`
  background-color: ${props => (props.isDragging ? interactive : colors.N30)};
  margin: ${grid}px;
  color: ${colors.N800};
  border-radius: 2px;
  font-weight: bold;
  user-select: none;
  width: 270px;
`;

const Header = styled.div`
  font-size: 20px;
  padding: ${grid}px;
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;

  &:hover {
    background-color: ${interactive};
  }
`;

const List = styled.div`
  min-height: 100px;
  padding: ${grid}px;
  transition: background-color 0.2s ease;

  ${props => (props.isDraggingOver ? `
    background-color: ${colors.R50};
  ` : '')}
`;

type Props = {|
  column: ColumnType,
  quotes: QuoteType[],
  index: number,
|}

export default class Column extends React.Component<Props> {
  render() {
    const column: ColumnType = this.props.column;
    const index: number = this.props.index;
    const quotes: QuoteType[] = this.props.quotes;

    return (
      <Draggable draggableId={column.id} index={index}>
        {(draggableProvided: DraggableProvided, draggableSnapshot: DraggableStateSnapshot) => (
          <Container
            innerRef={draggableProvided.innerRef}
            {...draggableProvided.draggableProps}
            isDragging={draggableSnapshot.isDragging}
          >
            {/* Making the column draggable from the column */}
            <Header {...draggableProvided.dragHandleProps}>
              {column.title}
            </Header>
            <Droppable droppableId={column.id} type="quote">
              {(droppableProvided: DroppableProvided, droppableSnapshot: DroppableStateSnapshot) => (
                <List
                  innerRef={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  isDraggingOver={droppableSnapshot.isDraggingOver}
                >
                  <InnerList quotes={quotes} />
                  {droppableProvided.placeholder}
                </List>
              )}
            </Droppable>
          </Container>
          )}
      </Draggable>
    );
  }
}

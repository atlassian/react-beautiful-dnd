// @flow
import React from 'react';
import { Link } from 'gatsby';
import styled, { css } from 'react-emotion';
import { grid, colors } from '../../../constants';
import { smallView } from '../../media';
import reorder from '../../reorder';
import { DragDropContext, Droppable, Draggable } from '../../../../../src';
import type {
  DraggableProvided,
  DroppableProvided,
  DropResult,
} from '../../../../../src';

const ActionBox = styled('div')`
  display: flex;
  align-items: center;

  ${smallView.fn(`
    flex-direction: column;
    align-items: stretch;
    min-width: 60vw;
    text-align: center;
  `)};
`;

const linkBase = css`
  border: none;
  color: ${colors.dark100};
  margin-right: ${grid * 2}px;
  padding: ${grid * 1}px ${grid * 2}px;
  transition: background-color ease 0.15s;
  border-radius: 2px;
  font-size: 1.2rem;
  font-weight: bold;
  user-select: none;

  :hover {
    cursor: pointer;
    text-decoration: none;
    color: ${colors.dark100};
  }

  ${smallView.fn(`
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 8px;
  `)};
`;

type Entry = {|
  id: string,
  text: string,
  path: string,
  color: {|
    background: string,
    hover: string,
  |},
|};

type EntryProps = {|
  entry: Entry,
  index: number,
|};
class EntryItem extends React.Component<EntryProps> {
  render() {
    const entry: Entry = this.props.entry;
    const className = css`
      ${linkBase};
      background-color: ${entry.color.background};

      :hover,
      :active {
        background-color: ${entry.color.hover};
        color: ${colors.dark100};
      }
    `;

    return (
      <Draggable draggableId={entry.id} key={entry.id} index={this.props.index}>
        {(provided: DraggableProvided) => (
          <Link
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            innerRef={provided.innerRef}
            className={className}
            to={entry.path}
          >
            {entry.text}
          </Link>
        )}
      </Draggable>
    );
  }
}

const initial: Entry[] = [
  {
    id: 'get-started',
    path: '/get-started',
    text: 'Get started',
    color: {
      background: colors.blue400,
      hover: colors.blue500,
    },
  },
  {
    id: 'docs',
    path: '/api/drag-drop-context',
    text: 'Docs',
    color: {
      background: colors.green400,
      hover: colors.green500,
    },
  },
  {
    id: 'examples',
    path: '/examples',
    text: 'Examples',
    color: {
      background: colors.purple400,
      hover: colors.purple500,
    },
  },
];

type Props = {|
  isSmallView: boolean,
|};

type State = {|
  entries: Entry[],
|};

export default class CallToAction extends React.Component<Props, State> {
  state: State = {
    entries: initial,
  };

  onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    this.setState({
      entries: reorder(
        this.state.entries,
        result.source.index,
        result.destination.index,
      ),
    });
  };

  render() {
    const direction = this.props.isSmallView ? 'vertical' : 'horizontal';
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable" direction={direction}>
          {(provided: DroppableProvided) => (
            <ActionBox
              {...provided.droppableProps}
              innerRef={provided.innerRef}
            >
              {this.state.entries.map((entry: Entry, index: number) => (
                <EntryItem key={entry.id} entry={entry} index={index} />
              ))}
              {provided.placeholder}
            </ActionBox>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

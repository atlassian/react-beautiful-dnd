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

const ActionBox = styled.div`
  display: flex;
  align-items: center;

  ${smallView.fn`
    flex-direction: column;
    align-items: stretch;
    min-width: 60vw;
  `};
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
`;

// const getColors = (base: string, active: string): string => `
//   background-color: ${base};

//   :hover,
//   :active {
//     background-color: ${active};
//   }
// `;

// const GetStartedLink = styled(ActionLink)`
//   margin-left: 0;
//   ${getColors(colors.blue400, colors.blue500)};
// `;

// const DocumentationLink = styled(ActionLink)`
//   ${getColors(colors.green400, colors.green500)};
// `;

// const ExampleLink = styled(ActionLink)`
//   ${getColors(colors.purple400, colors.purple500)};

//   ${smallView.fn`
//     margin-bottom: 0;
//   `};
// `;

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
    path: '/guides',
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

type State = {|
  entries: Entry[],
|};

export default class CallToAction extends React.Component<*, State> {
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
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable" direction="horizontal">
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

// @flow
import React, { type Node } from 'react';
import styled from 'styled-components';
import GithubIcon from 'react-icons/lib/fa/github';
import TwitterIcon from 'react-icons/lib/fa/twitter';
import { grid, colors } from '../../../constants';
import reorder from '../../reorder';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DroppableProvided,
  type DraggableProvided,
  type DropResult,
} from '../../../../../src';

const Container = styled.div`
  display: flex;
`;

const ExternalLink = styled.a`
  color: ${colors.dark100};
  transition: color 0.2s ease;
  margin-right: ${grid}px;

  :hover,
  :active,
  :focus {
    color: ${colors.green300};
    text-decoration: none;
  }
`;

const iconProps: Object = {
  width: 40,
  height: 40,
};

type SocialLink = {|
  id: string,
  href: string,
  icon: Node,
|};

type State = {|
  links: SocialLink[],
|};

const initial: SocialLink[] = [
  {
    id: 'social',
    href: 'https://github.com/atlassian/react-beautiful-dnd',
    icon: <GithubIcon {...iconProps} />,
  },
  {
    id: 'twitter',
    href: 'https://twitter.com/alexandereardon',
    icon: <TwitterIcon {...iconProps} />,
  },
];

export default class SocialIcons extends React.Component<*, State> {
  state: State = {
    links: initial,
  };
  onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    this.setState({
      links: reorder(
        this.state.links,
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
            <Container {...provided.droppableProps} ref={provided.innerRef}>
              {this.state.links.map((link: SocialLink, index: number) => (
                <Draggable draggableId={link.id} key={link.id} index={index}>
                  {(draggableProvided: DraggableProvided) => (
                    <ExternalLink
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      {...draggableProvided.dragHandleProps}
                      href={link.href}
                    >
                      {link.icon}
                    </ExternalLink>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Container>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

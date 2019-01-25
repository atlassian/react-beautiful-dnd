// @flow
import React, { type Node } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'gatsby';
import invariant from 'tiny-invariant';
import reorder from '../reorder';
import type { NavLink } from './sidebar-types';
import { Draggable, Droppable, DragDropContext } from '../../../../src';
import { linkClassName, isActiveClassName } from './link-class-name';
import type {
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
  DropResult,
} from '../../../../src';

const getBodyElement = (): HTMLBodyElement => {
  invariant(document.body);
  return document.body;
};

type PortalAwareItemProps = {|
  link: NavLink,
  hoverColor: string,
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
|};

class PortalAwareLink extends React.Component<PortalAwareItemProps> {
  // eslint-disable-next-line react/sort-comp
  portal: ?HTMLElement;

  componentDidMount() {
    const portal: HTMLElement = document.createElement('div');
    this.portal = portal;
    getBodyElement().appendChild(portal);
  }
  componentWillUnmount() {
    getBodyElement().removeChild(this.getPortal());
    this.portal = null;
  }

  getPortal = (): HTMLElement => {
    invariant(this.portal);
    return this.portal;
  };

  render() {
    const { snapshot, provided, hoverColor, link } = this.props;
    const child: Node = (
      <Link
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        innerRef={provided.innerRef}
        to={link.href}
        className={linkClassName(hoverColor, snapshot.isDragging)}
        activeClassName={isActiveClassName(hoverColor)}
      >
        {link.title}
      </Link>
    );
    if (!snapshot.isDragging) {
      return child;
    }

    return ReactDOM.createPortal(child, this.getPortal());
  }
}

type NavLinkItemProps = {|
  link: NavLink,
  index: number,
  hoverColor: string,
|};

class NavLinkItem extends React.PureComponent<NavLinkItemProps> {
  render() {
    const { link, index, hoverColor } = this.props;

    return (
      <Draggable draggableId={link.href} index={index}>
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
          <PortalAwareLink
            link={link}
            provided={provided}
            snapshot={snapshot}
            hoverColor={hoverColor}
          />
        )}
      </Draggable>
    );
  }
}

type ReorderableLinksProps = {|
  links: NavLink[],
  hoverColor: string,
|};
type ReorderableLinksState = {|
  ordered: NavLink[],
|};

// For performance
class InnerList extends React.PureComponent<ReorderableLinksProps> {
  render() {
    return this.props.links.map((link: NavLink, index: number) => (
      <NavLinkItem
        key={link.href}
        link={link}
        hoverColor={this.props.hoverColor}
        index={index}
      />
    ));
  }
}

export default class ReorderableLinks extends React.Component<
  ReorderableLinksProps,
  ReorderableLinksState,
> {
  state: ReorderableLinksState = {
    ordered: this.props.links,
  };

  onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    this.setState({
      ordered: reorder(
        this.state.ordered,
        result.source.index,
        result.destination.index,
      ),
    });
  };

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="section">
          {(provided: DroppableProvided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <InnerList
                links={this.state.ordered}
                hoverColor={this.props.hoverColor}
              />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

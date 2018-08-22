// @flow
import React, { type Node } from 'react';
import styled from 'styled-components';
import Media from 'react-media';
import Sidebar from './sidebar';
import type { sitePage, docsPage } from './types';
import { smallView } from './media';
import { grid, sidebarWidth } from '../constants';

const gutter: number = grid * 2;

const Content = styled.div`
  margin-left: ${sidebarWidth + gutter}px;
  margin-right: ${gutter}px;
  margin-top ${grid * 4}px;
  display: flex;
  justify-content: center;

  ${smallView.fn`
    margin-left: 16px;
  `}
`;

const ContentSpacing = styled.div`
  background: lightgreen;
  max-width: 960px;
  width: 100%;
  min-height: 100vh;
`;

type MobileTopBarProps = {|
  onMenuToggle: () => void,
|};
class MobileTopBar extends React.Component<MobileTopBarProps> {
  render() {
    return (
      <div>
        Mobile topbar
        <button onClick={this.props.onMenuToggle}>Toggle menu</button>
      </div>
    );
  }
}

type ExternalProps = {|
  examples: sitePage,
  docs: docsPage,
  internal: sitePage,
  showInternal: boolean,
  children: Node,
|};

type InternalProps = {|
  ...ExternalProps,
  isInLargeView: boolean,
|};

type State = {|
  showSidebar: boolean,
|};

class WithConditionalSidebar extends React.Component<InternalProps, State> {
  // Show the sidebar if moving into large view
  // Hide the sidebar is moving into small view
  static getDerivedStateFromProps = (nextProps: InternalProps): State => ({
    showSidebar: nextProps.isInLargeView,
  });

  state: State = {
    showSidebar: false,
  };

  onMenuToggle = () => {
    this.setState({
      showSidebar: !this.state.showSidebar,
    });
  };

  onContentClick = () => {
    // We want to close the sidebar if it is open
    // while in the mobile view
    if (this.props.isInLargeView) {
      return;
    }

    if (!this.state.showSidebar) {
      return;
    }

    this.setState({
      showSidebar: false,
    });
  };

  render() {
    const {
      examples,
      docs,
      internal,
      showInternal,
      children,
      isInLargeView,
    } = this.props;
    const { showSidebar } = this.state;

    const sidebar: Node = showSidebar ? (
      <Sidebar
        examples={examples}
        docs={docs}
        internal={internal}
        showInternal={showInternal}
      />
    ) : null;

    const topbar: Node = isInLargeView ? null : (
      <MobileTopBar onMenuToggle={this.onMenuToggle} />
    );

    return (
      <React.Fragment>
        {sidebar}
        {topbar}
        <Content onClick={this.onContentClick}>
          <ContentSpacing>{children}</ContentSpacing>
        </Content>
      </React.Fragment>
    );
  }
}

export default (props: ExternalProps) => (
  <Media query={smallView.negatedQuery}>
    {(matches: boolean) => (
      <WithConditionalSidebar {...props} isInLargeView={matches} />
    )}
  </Media>
);

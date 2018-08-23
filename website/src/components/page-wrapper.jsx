// @flow
import React, { type Node } from 'react';
import styled from 'react-emotion';
import Media from 'react-media';
import Sidebar from './sidebar';
import type { sitePage, docsPage } from './types';
import { smallView } from './media';
import { grid, sidebarWidth, colors, contentWidth } from '../constants';

require('prism-themes/themes/prism-a11y-dark.css');

const gutter: number = grid * 2;

const Content = styled.div`
  background: ${colors.dark400};
  margin-left: ${sidebarWidth + gutter}px;
  margin-right: ${gutter}px;
  display: flex;
  justify-content: center;
  color: ${colors.dark100};

  ${smallView.fn(`
    margin-left: 16px;
  `)};
`;

const ContentSpacing = styled.div`
  max-width: ${contentWidth}px;
  margin-top: ${grid * 4}px;
  width: 100%;
  min-height: 100vh;
  padding: ${grid * 4}px;

  /* This should be applied only within Content */
  a {
    color: ${colors.green400};
    font-weight: bold;
  }
`;

type MobileTopBarProps = {|
  onMenuToggle: () => void,
|};
class MobileTopBar extends React.Component<MobileTopBarProps> {
  render() {
    return (
      <div>
        Mobile topbar
        <button type="button" onClick={this.props.onMenuToggle}>
          Toggle menu
        </button>
      </div>
    );
  }
}

type ExternalProps = {|
  examples: sitePage,
  docs: docsPage,
  internal: sitePage,
  children: Node,
|};

type InternalProps = {|
  ...ExternalProps,
  isInLargeView: boolean,
|};

type State = {|
  showSidebar: boolean,
  mobileSidebar: boolean,
|};

class WithConditionalSidebar extends React.Component<InternalProps, State> {
  state: State = {
    showSidebar: false,
    mobileSidebar: false,
  };

  onMenuToggle = () => {
    this.setState({
      mobileSidebar: !this.state.mobileSidebar,
    });
  };

  onContentClick = () => {
    // We want to close the sidebar if it is open
    // while in the mobile view
    if (this.props.isInLargeView) {
      return;
    }

    if (!this.state.mobileSidebar) {
      return;
    }

    this.setState({
      mobileSidebar: false,
    });
  };

  // Show the sidebar if moving into large view
  // Hide the sidebar is moving into small view
  static getDerivedStateFromProps = (
    nextProps: InternalProps,
    state: State,
  ): State => ({
    showSidebar: nextProps.isInLargeView,
    mobileSidebar: state.mobileSidebar,
  });

  render() {
    const { examples, docs, internal, children, isInLargeView } = this.props;
    const { showSidebar, mobileSidebar } = this.state;

    const sidebar: Node =
      showSidebar || mobileSidebar ? (
        <Sidebar examples={examples} docs={docs} internal={internal} />
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

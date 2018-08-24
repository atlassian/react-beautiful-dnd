// @flow
import React, { type Node } from 'react';
import styled from 'react-emotion';
import Media from 'react-media';
import Sidebar from './sidebar';
import type { sitePage, docsPage } from './types';
import { smallView } from './media';
import { grid, gutter, sidebarWidth, colors, contentWidth } from '../constants';

require('prism-themes/themes/prism-a11y-dark.css');

const sectionGap: number = gutter.large;

const Content = styled.div`
  background: ${colors.dark400};
  margin-left: ${sidebarWidth + gutter.normal}px;
  margin-right: ${gutter.normal}px;
  display: flex;
  justify-content: center;
  color: ${colors.dark100};

  ${smallView.fn(`
    margin-left: 16px;
  `)};
`;

const ContentSpacing = styled.div`
  max-width: ${contentWidth}px;
  padding: ${sectionGap}px;
  padding-top: ${sectionGap}px;
  width: 100%;
  box-sizing: border-box;
  min-height: 100vh;

  /* This should be applied only within Content */
  a {
    color: ${colors.green400};
    font-weight: bold;
  }

  blockquote {
    padding: 0 ${gutter}px;
    color: ${colors.dark200};
    border-left: ${grid / 2}px solid ${colors.dark300};
    margin: ${sectionGap}px 0;
  }
  blockquote::before,
  blockquote::after {
    content: '';
  }

  /* code blocks */
  pre[class*='language-'] {
    margin: ${sectionGap}px 0;
  }

  /* inline code */
  .language-text {
    display: inline-block;
    padding: 0 ${grid / 2}px;
    margin: 0 ${grid / 2}px;
  }
  img {
    max-width: 100%;
    margin: ${sectionGap}px 0;
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

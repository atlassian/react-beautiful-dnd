// @flow
import React, { type Node } from 'react';
import styled from 'styled-components';
import Link from 'gatsby-link';
import Media from 'react-media';
import { colors as akColors } from '@atlaskit/theme';
import Sidebar from './sidebar';
import type { sitePage, docsPage } from './types';
import { singleColumn } from '../components/media';
import { grid, sidebarWidth } from '../constants';

const gutter: number = grid * 2;

const Content = styled.div`
  margin-left: ${sidebarWidth + gutter}px;
  margin-right: ${gutter}px;
  margin-top ${grid * 4}px;
  display: flex;
  justify-content: center;

  ${singleColumn.fn`
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
|}
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
|}

type InternalProps = {|
  ...ExternalProps,
  isInSingleColumn: boolean,
|}

type State = {|
  showSidebar: boolean,
|}

class WithConditionalSidebar extends React.Component<InternalProps, State> {
  static getDerivedStateFromProps = (nextProps: InternalProps): State => ({
    showSidebar: !nextProps.isInSingleColumn,
  })

  state: State = {
    showSidebar: !this.props.isInSingleColumn,
  };

  onMenuToggle = () => {
    this.setState({
      showSidebar: !this.state.showSidebar,
    });
  }

  render() {
    const { examples, docs, internal, showInternal, children, isInSingleColumn } = this.props;
    const { showSidebar } = this.state;

    const sidebar: Node = showSidebar ? (
      <Sidebar
        examples={examples}
        docs={docs}
        internal={internal}
        showInternal={showInternal}
      />) : null;

    const topbar: Node = isInSingleColumn ?
      <MobileTopBar onMenuToggle={this.onMenuToggle} /> : null;

    return (
      <React.Fragment>
        {sidebar}
        {topbar}
        <Content>
          <ContentSpacing>
            {children}
          </ContentSpacing>
        </Content>
      </React.Fragment>
    );
  }
}

export default (props: ExternalProps) => (
  <Media query={singleColumn.negatedQuery}>
    {(matches: boolean) => <WithConditionalSidebar {...props} isInSingleColumn={!matches} />}
  </Media>
);

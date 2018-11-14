// @flow
import React from 'react';
import { Link } from 'gatsby';
import styled from 'react-emotion';
import { grid, sidebarWidth, colors } from '../../constants';
import type { DocsPage, MarkdownPage, SitePage } from '../types';
import { getTitleFromExamplePath } from '../../utils';
import Heading from './heading';
import type { NavLink } from './sidebar-types';
import LinkList from './reorderable-links';
import spacing from './spacing';
import { linkClassName, isActiveClassName } from './link-class-name';

const ScrollContainer = styled('div')`
  height: 100vh;
  width: ${sidebarWidth}px;
  box-sizing: border-box;
  position: fixed;
  left: 0;
  top: 0;
  overflow: auto;
  padding-bottom: ${spacing.side}px;
  background: ${colors.dark500};

  ::-webkit-scrollbar {
    width: ${grid}px;
  }

  ::-webkit-scrollbar-track {
    background-color: ${colors.purple500};
  }

  ::-webkit-scrollbar-thumb {
    background-color: ${colors.purple400};
  }
`;

const Section = styled('div')`
  margin-top: ${spacing.top}px;
  display: flex;
  flex-direction: column;
`;

const Title = styled('h3')`
  color: ${colors.dark100};
  font-size: 20px;
  padding: ${grid}px ${spacing.side}px;
`;

type NavFromUrlsProps = {
  examples: SitePage,
  title: string,
};

const ExampleSection = ({ examples, title }: NavFromUrlsProps) => {
  const links: NavLink[] = examples.edges.map(
    (edge): NavLink => {
      const { path: href } = edge.node;
      const link: NavLink = {
        title: getTitleFromExamplePath(href, '/examples/'),
        href,
      };
      return link;
    },
  );

  return (
    <Section>
      <Title>{title}</Title>
      <LinkList links={links} hoverColor={colors.blue500} />
    </Section>
  );
};

type Props = {
  docs: DocsPage,
  examples: SitePage,
};

type DocsSectionProps = {
  title: string,
  directory: string,
  hoverColor: string,
  pages: MarkdownPage[],
};

const DocsSection = ({
  title,
  pages,
  directory,
  hoverColor,
}: DocsSectionProps) => {
  const links: NavLink[] = pages
    .filter((page: MarkdownPage): boolean => directory === page.node.fields.dir)
    .map(
      (page: MarkdownPage): NavLink => {
        const { slug, title: pageTitle } = page.node.fields;
        const link: NavLink = {
          title: pageTitle,
          href: slug,
        };
        return link;
      },
    );
  console.log('rendering section', title);

  return (
    <Section>
      <Title>{title}</Title>
      <LinkList links={links} hoverColor={hoverColor} />
    </Section>
  );
};

export default class Sidebar extends React.PureComponent<Props> {
  render() {
    const { docs, examples } = this.props;
    return (
      <ScrollContainer>
        <Heading />
        <Section>Search goes here</Section>
        <DocsSection
          pages={docs.edges}
          title="Get started"
          directory="get-started"
          hoverColor={colors.blue500}
        />
        <DocsSection
          pages={docs.edges}
          title="Guides"
          directory="guides"
          hoverColor={colors.purple500}
        />
        <DocsSection
          pages={docs.edges}
          title="API"
          directory="api"
          hoverColor={colors.purple500}
        />
        <ExampleSection examples={examples} title="Examples" />
      </ScrollContainer>
    );
  }
}

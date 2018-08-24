// @flow
import React from 'react';
import { Link } from 'gatsby';
import styled from 'react-emotion';
import { grid, sidebarWidth, colors, gutter } from '../../constants';
import type { DocsPage, MarkdownPage, SitePage } from '../types';
import { getTitleFromExamplePath } from '../../utils';
import Heading from './heading';
import type { NavLink } from './sidebar-types';
import ReorderableLinks from './reorderable-links';
import { linkClassName, isActiveClassName } from './link-class-name';

const Sidebar = styled.div`
  height: 100vh;
  width: ${sidebarWidth}px;
  box-sizing: border-box;
  position: fixed;
  left: 0;
  top: 0;
  overflow: auto;
  padding-bottom: ${grid * 2}px;
  background: ${colors.dark500};

  ::-webkit-scrollbar {
    width: ${grid}px;
  }

  ::-webkit-scrollbar-track {
    background-color: pink;
  }

  ::-webkit-scrollbar-thumb {
    background-color: darkgrey;
  }
`;

const Section = styled.div`
  margin-top: ${grid * 3}px;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  color: ${colors.dark100};
  font-size: 20px;
  padding: ${grid}px;
  padding-left: ${gutter.normal}px;
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
      <ReorderableLinks links={links} hoverColor={colors.blue500} />
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
  pages: MarkdownPage[],
};

const DocsSection = ({ title, pages, directory }: DocsSectionProps) => {
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

  return (
    <Section>
      <Title>{title}</Title>
      <ReorderableLinks links={links} hoverColor={colors.purple300} />
    </Section>
  );
};

export default ({ docs, examples }: Props) => (
  <Sidebar>
    <Section>
      <Heading />
    </Section>
    <Section>
      <Link
        key="get-started"
        to="/get-started"
        style={{ paddingLeft: 0 }}
        className={linkClassName(colors.blue500)}
        activeClassName={isActiveClassName(colors.blue500)}
      >
        <Title>Get started</Title>
      </Link>
    </Section>
    <DocsSection pages={docs.edges} title="Guides" directory="guides" />
    <DocsSection pages={docs.edges} title="API" directory="api" />
    <ExampleSection examples={examples} title="Examples" />
  </Sidebar>
);

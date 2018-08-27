// @flow
export type Id = string;

export type Author = {|
  id: Id,
  name: string,
  avatarUrl: string,
  colors: {|
    soft: string,
    medium: string,
    // strong: string,
  |},
|};

export type AuthorMap = {
  [authorId: Id]: Author,
};

export type Quote = {|
  id: Id,
  content: string,
  author: Author,
|};

export type QuoteMap = {
  [quoteId: Id]: Quote,
};

export type SitePage = {
  edges: Array<{ node: { path: string } }>,
};

export type MarkdownPage = {
  node: {
    fields: {
      slug: string,
      title: string,
      dir?: string,
    },
  },
};

export type DocsPage = {
  edges: Array<MarkdownPage>,
};

export type SidebarData = {
  examples: SitePage,
  internal: SitePage,
  docs: DocsPage,
  site: {
    siteMetadata: {
      isDevelopment: boolean,
    },
  },
};

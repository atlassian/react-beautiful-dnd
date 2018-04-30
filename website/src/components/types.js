// @flow
export type Id = string;

export type Author = {|
  id: Id,
  name: string,
  avatarUrl: string,
  colors: {|
    soft: string,
    medium: string
    // strong: string,
  |}
|};

export type AuthorMap = {
  [authorId: Id]: Author
};

export type Quote = {|
  id: Id,
  content: string,
  author: Author
|};

export type QuoteMap = {
  [quoteId: Id]: Quote
};

export type sitePage = {
  edges: Array<{ node: { path: string } }>
};

export type docsPage = {
  edges: Array<{
    node: {
      fields: {
        slug: string,
        title: string,
        dir?: string
      }
    }
  }>
};

export type SidebarData = {
  examples: sitePage,
  internal: sitePage,
  docs: docsPage,
  site: {
    siteMetadata: {
      isDevelopment: boolean
    }
  }
};

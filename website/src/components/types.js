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
  |}
|}

export type AuthorMap = {
  [authorId: Id]: Author,
}

export type Quote = {|
  id: Id,
  content: string,
  author: Author,
|}

export type QuoteMap = {
  [quoteId: Id]: Quote,
}

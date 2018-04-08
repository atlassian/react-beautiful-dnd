// @flow
import React from 'react';

type Data = {
  markdownRemark: {
    html: string,
  }
}

type Props = { data: Data }

export default ({ data }: Props) => (
  <div dangerouslySetInnerHTML={{ __html: data.markdownRemark.html }} />
);

/* eslint-disable no-undef */
// $FlowFixMe
export const query = graphql`
  query docsBySlug($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
    }
  }
`;

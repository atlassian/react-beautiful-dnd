// @flow
import React from 'react';
import { graphql } from 'gatsby';
import Layout from '../components/layouts';

type Data = {
  markdownRemark: {
    html: string,
  },
};

type Props = { data: Data };

export default ({ data }: Props) => (
  <Layout>
    <div dangerouslySetInnerHTML={{ __html: data.markdownRemark.html }} />
  </Layout>
);

/* eslint-disable no-undef */
// $FlowFixMe
export const query = graphql`
  query markdownQuery($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
    }
  }
`;

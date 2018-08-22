// @flow
import React from 'react';
import InteractiveElementsApp from '../../components/examples/interactive-elements/interactive-elements-app';
import Layout from '../../components/layouts/example';

type Props = {
  location: {
    pathname: string,
  },
};

export default (props: Props) => (
  <Layout location={props.location}>
    <div>nested interative elements: stress test</div>
    <InteractiveElementsApp />
  </Layout>
);

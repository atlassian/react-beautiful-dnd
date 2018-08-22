// @flow
import React from 'react';
import TaskApp from '../../components/examples/accessible/task-app';
import Layout from '../../components/layouts/example';

type Props = {
  location: {
    pathname: string,
  },
};

export default (props: Props) => (
  <Layout location={props.location}>
    <div>Accessibility: single list</div>
    <TaskApp />
  </Layout>
);

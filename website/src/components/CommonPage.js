// @flow
import React, { type Node } from 'react';
import Helmet from 'react-helmet';
/* eslint-disable-next-line import/extensions */
import '@atlaskit/css-reset';

type Props = {
  children: Node,
};

const CommonPage = ({ children }: Props) => (
  <div>
    <Helmet>
      <title>react-beautiful-dnd</title>
      <meta
        name="description"
        content="react-beautiful-dnd: Beautiful, accessible drag and drop for lists with React.js"
      />
      <link
        href="https://fonts.googleapis.com/css?family=Clicker+Script"
        rel="stylesheet"
      />
    </Helmet>
    {children}
  </div>
);

export default CommonPage;

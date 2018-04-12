// @flow
import React, { type Node } from 'react';
import Helmet from 'react-helmet';
/* eslint-disable-next-line import/extensions */
import '@atlaskit/css-reset';

// import Header from '../components/header';

type Props = {
  children: () => Node,
}

// const WithGutter = styled.div`
//   margin: 0 auto;
//   max-width: 960px;
// `;

const PageTemplate = ({ children } : Props) => (
  <div>
    <Helmet
      title="react-beautiful-dnd"
      meta={[
            { name: 'description', content: 'react-beautiful-dnd: Beautiful, accessible drag and drop for lists with React.js' },
          ]}
    />
    {children()}
  </div>
);

export default PageTemplate;

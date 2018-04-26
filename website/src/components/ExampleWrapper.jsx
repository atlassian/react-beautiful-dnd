// @flow
import React from 'react';
import Codesandboxer from 'react-codesandboxer';

const gitInfo = {
  account: 'atlassian',
  repository: 'react-beautiful-dnd',
  host: 'github',
};

// this needs to handle internal v external
export const gatsbyUrlToCSBPath = (url: string) =>
  `website/src/pages${url.replace(/\/$/, '.jsx')}`;

const ExampleWrapper = ({ children, path }) => (
  <div>
    <Codesandboxer
      gitInfo={gitInfo}
      examplePath={path}
      pkgJSON="package.json"
      preload
      onLoadComplete={something => console.log('we completed loading of', something, path)}
    >
      {() => <button>Take 1</button>}
    </Codesandboxer>
    {children}
  </div>
);

export default ExampleWrapper;

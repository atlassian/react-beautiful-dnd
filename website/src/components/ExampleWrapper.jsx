// @flow
import React from 'react';
import Codesandboxer from 'react-codesandboxer';

const gitInfo = {
  account: 'noviny',
  repository: 'react-beautiful-dnd',
  host: 'github',
  branch: 'website-layout',
};

// this needs to handle internal v external
export const gatsbyUrlToCSBPath = (url: string) =>
  `website/src/pages${url.replace(/\/$/, '.jsx')}`;

const ExampleWrapper = ({ children, path }) => (
  <div>
    <Codesandboxer
      gitInfo={gitInfo}
      examplePath={path}
      allowJSX
      preload
      importReplacements={[['src', 'react-beautiful-dnd']]}
      onLoadComplete={something =>
        console.log('we completed loading of', something, path)}
    >
      {() => <button>Take 1</button>}
    </Codesandboxer>
    {children}
  </div>
);

export default ExampleWrapper;

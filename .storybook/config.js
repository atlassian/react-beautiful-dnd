import { configure } from '@storybook/react';
// adding css reset - storybook includes a css loader
import '@atlaskit/css-reset';

// dynamically load in all the stories in the /stories directory
// https://github.com/storybooks/storybook/issues/125#issuecomment-212404756
const req = require.context('../stories/', true, /story\.js$/)

function loadStories() {
  req.keys().forEach(req)
}

configure(loadStories, module);
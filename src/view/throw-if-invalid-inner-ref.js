// @flow
import { invariant } from '../invariant';
import isHtmlElement from './is-type-of-element/is-html-element';

export default (ref: ?mixed) => {
  invariant(
    ref && isHtmlElement(ref),
    `
    provided.innerRef has not been provided with a HTMLElement.

    You can find a guide on using the innerRef callback functions at:
    https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/using-inner-ref.md
  `,
  );
};

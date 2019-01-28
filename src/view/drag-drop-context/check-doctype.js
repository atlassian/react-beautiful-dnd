// @flow
import { warning } from '../../dev-warning';

const suffix: string = `
  We expect a html5 doctype: <!doctype html>
  This is to ensure consistent browser layout and measurement

  More information: https://github.com/atlassian/react-beautiful-dnd#use-the-html5-doctype
`;

export default (doc: Document) => {
  const doctype: ?DocumentType = doc.doctype;

  if (!doctype) {
    warning(`
      No <!doctype html> found.

      ${suffix}
    `);
    return;
  }

  if (doctype.name.toLowerCase() !== 'html') {
    warning(`
      Unexpected <!doctype> found: (${doctype.name})

      ${suffix}
    `);
  }

  if (doctype.publicId !== '') {
    warning(`
      Unexpected <!doctype> publicId found: (${doctype.publicId})
      A html5 doctype does not have a publicId

      ${suffix}
    `);
  }
};

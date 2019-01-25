// @flow
import { warning } from '../../dev-warning';

const suffix: string = `
  We expect a html5 doctype
  More information:
`;

export default (doc: Document) => {
  const doctype: ?DocumentType = doc.doctype;

  if (!doctype) {
    warning(`
      No doctype found.

      ${suffix}
    `);
    return;
  }

  if (doctype.name.toLowerCase() !== 'html') {
    warning(`
      Unexpected doctype found: (${doctype.name})

      ${suffix}
    `);
  }

  if (doctype.publicId !== '') {
    warning(`
      Unexpected publicId found: (${doctype.publicId})
      A html5 doctype does not have a publicId

      ${suffix}
    `);
  }
};

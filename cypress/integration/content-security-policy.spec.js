// @flow
import * as keyCodes from '../../src/view/key-codes';
import { timings } from '../../src/animation';

it('should reorder a list without a nonce', () => {
  cy.visit('http://localhost:9003');

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .as('first')
    .should('have.text', 'item 0');

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(1)
    .should('have.text', 'item 1');

  cy.get('@first')
    .closest('[data-react-beautiful-dnd-drag-handle]')
    .focus()
    .trigger('keydown', { keyCode: keyCodes.space })
    .trigger('keydown', { keyCode: keyCodes.arrowDown, force: true })
    // finishing before the movement time is fine - but this looks nice
    .wait(timings.outOfTheWay * 1000)
    .trigger('keydown', { keyCode: keyCodes.space, force: true });

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .should('have.text', 'item 1');

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(1)
    .should('have.text', 'item 0');

  cy.get('#cspErrors').should('have.text', '0');
});

it('should reorder a list with a nonce', () => {
  cy.visit('http://localhost:9003/nonce');

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .as('first')
    .should('have.text', 'item 0');

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(1)
    .should('have.text', 'item 1');

  cy.get('@first')
    .closest('[data-react-beautiful-dnd-drag-handle]')
    .focus()
    .trigger('keydown', { keyCode: keyCodes.space })
    .trigger('keydown', { keyCode: keyCodes.arrowDown, force: true })
    // finishing before the movement time is fine - but this looks nice
    .wait(timings.outOfTheWay * 1000)
    .trigger('keydown', { keyCode: keyCodes.space, force: true });

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .should('have.text', 'item 1');

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(1)
    .should('have.text', 'item 0');

  cy.get('#cspErrors').should('have.text', '0');
});

it('should reorder a list with a wrong nonce', () => {
  cy.visit('http://localhost:9003/wrong-nonce');

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .as('first')
    .should('have.text', 'item 0');

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(1)
    .should('have.text', 'item 1');

  cy.get('@first')
    .closest('[data-react-beautiful-dnd-drag-handle]')
    .focus()
    .trigger('keydown', { keyCode: keyCodes.space })
    .trigger('keydown', { keyCode: keyCodes.arrowDown, force: true })
    // finishing before the movement time is fine - but this looks nice
    .wait(timings.outOfTheWay * 1000)
    .trigger('keydown', { keyCode: keyCodes.space, force: true });

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(0)
    .should('have.text', 'item 1');

  cy.get('[data-react-beautiful-dnd-drag-handle]')
    .eq(1)
    .should('have.text', 'item 0');

  cy.get('#cspErrors').should('not.have.text', '0');
});

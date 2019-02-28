# Mouse dragging

## Sloppy clicks and click prevention 🐱🎁

When a user presses the mouse down on an element, we cannot determine if the user was clicking or dragging. Also, sometimes when a user clicks they can move the cursor slightly — a sloppy click. So we only start a drag once the user has moved beyond a certain distance with the mouse down (the drag threshold) — more than they would if they were just making a sloppy click. If the drag threshold is not exceeded then the user interaction behaves just like a regular click. If the drag threshold is exceeded then the interaction will be classified as a drag and the standard click behaviour will not occur.

This allows consumers to wrap interactive elements such as an anchor and have it be both a standard anchor as well as a draggable item in a natural way.

(🐱🎁 is a [schrodinger's cat](https://www.youtube.com/watch?v=IOYyCHGWJq4) joke)

> To see more in depth information about how we impact standard browser events see our [how we use DOM events guide](/docs/guides/how-we-use-dom-events.md)

## Keyboard shortcuts

When a drag **is not occurring** `react-beautiful-dnd` does not impact any of the standard keyboard interactions (it has no listeners bound).

When a drag **is occurring** with a _mouse_ the user is able to execute the following keyboard shortcuts:

- **escape** <kbd>esc</kbd> - cancel the drag

During a mouse drag the following standard keyboard events are prevented to prevent a bad experience:

- **tab** <kbd>tab ↹</kbd> - preventing tabbing
- **enter** <kbd>⏎</kbd> - preventing submission

Other than these explicitly prevented keyboard events all standard keyboard events should work as expected.

[Back to documentation](/README.md#documentation-)

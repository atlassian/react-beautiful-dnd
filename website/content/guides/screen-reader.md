---
title: Screen Reader Guide
---

`react-beautiful-dnd` ships with great screen reader support in english out of the box 📦! So if you are looking to just get started there is nothing you need to do.

However, you have total control over all of the messages. This allows you to tailor the messaging for your particular usages as well as for internationalisation purposes.

This guide has been written to assist you in creating your own messaging that is functional and delights users. It is possible for a user who is using a screen reader to use any input type. However, we have the screen reader experience to be focused on keyboard interactions.

## Tone

For the default messages we have gone for a friendly tone. We have also chosen to use personal language; preferring phases such as 'You have dropped the item' over 'Item dropped'. It is a little more wordy but is a friendlier experience. You are welcome to choose your own tone for your messaging.

## How to control announcements

The `announce` function that is provided to each of the `DragDropContext` > `Hook` functions can be used to provide your own screen reader message. This message will be immediately read out. In order to provide a fast and responsive experience to users **you must provide this message synchronously**. If you attempt to hold onto the `announce` function and call it later it will not work and will just print a warning to the console. Additionally, if you try to call `announce` twice for the same event then only the first will be read by the screen reader with subsequent calls to `announce` being ignored and a warning printed.

## Step 1: lift instructions

When a user `tabs` to a `Draggable` we need to instruct them on how they can start a drag. We do this by using the `aria-roledescription` property on a `drag handle`.

**Default message**: "Draggable item. Press space bar to lift"

Things to note:

- We tell the user that the item is draggable
- We tell the user how they can start a drag

We do not give all the drag movement instructions at this point as they are not needed until a user starts a drag.

The **default** message is fairly robust, however, you may prefer to substitute the word "item" for a noun that more closely matches your problem domain, such as "task" or "issue". You may also want to drop the word "item" altogether.

## Step 2: drag start

When a user lifts a `Draggable` by using the `spacebar` we want to tell them a few things:

- they have lifted the item
- what position the item is in
- how to move the item around

**Default message**: "You have lifted an item in position ${start.source.index + 1}. Use the arrow keys to move, space bar to drop, and escape to cancel."

By default we do not say they are in position `1 of x`. This is because we do not have access to the size of the list in the current api. We have kept it like this for now to keep the api light and future proof as we move towards virtual lists. You are welcome to add the `1 of x` language yourself if you like!

You may also want to say what list the item is in and potentially the index of the list.

Here is an message that has a little more information:

"You have lifted an item in position ${startPosition} of ${listLength} in the ${listName} list. Use the arrow keys to move, space bar to drop, and escape to cancel."

You can control the message printed to the user by using the `DragDropContext` > `onDragStart` hook

```js
onDragStart = (start: DragStart, provided: HookProvided) => {
  provided.announce('My super cool message');
}
```

## Step 3: drag movement

When something changes in response to a user interaction we want to announce the current state of the drag to the user. There are a lot of different things that can happen so we will need a different message for these different stages.

We can control the announcement by using the `DragDropContext` > `onDragUpdate` hook.

```js
onDragUpdate = (update: DragUpdate, provided: HookProvided) => {
  provided.announce('Update message');
}
```

### Moved in the same list

In this scenario the user has moved backwards or forwards within the same list. We want to instruct the user what position they are now in.

**Default message**: "You have moved the item to position ${update.destination.index + 1}".

You may also want to include `of ${listLength}` in your messaging.

### Moved into a different list

In this case we want to tell the user

- they have moved to a new list
- some information about the new list
- what position they have moved from
- what position they are now in

**Default message**: "You have moved the item from list ${update.source.droppableId} in position ${update.source.index + 1} to list ${update.destination.droppableId} in position ${update.destination.index + 1}".

You will probably want to change this messaging to use some friendly text for the name of the droppable. It would also be good to say the size of the lists in the message

Suggestion:

"You have moved the item from list ${sourceName} in position ${lastIndex} of ${sourceLength} to list ${destinationName} in position ${newIndex} of ${destinationLength}".

### Moved over no list

While this is not possible to do with a keyboard, it is worth having a message for this in case a screen reader user is using a pointer for dragging.

You will want to simply explain that they are not over a droppable area.

**Default message**: "You are currently not dragging over a droppable area".

## Step 3: on drop

In this phase we give a small summary of what the user has achieved.

There are two ways a drop can occur. Either the drag was cancelled or the user released the dragging item. You are able to control the messaging for these events using the `DragDropContext` > `onDragEnd` hook.

### Cancel

A `DropResult` object has a `reason` property which can either be `DROP` or `CANCEL`. You can use this to announce your cancel message.

```js
onDragEnd = (result: DropResult, provided: HookProvided) => {
  if(result.reason === 'CANCEL') {
    provided.announce('Your cancel message');
    return;
  }
}
```

This announcement should:

- Inform the user that the drag have been cancelled
- Let the user know where the item has returned to

**Default message**: "Movement cancelled. The item has returned to its starting position of ${result.source.index + 1}"

You are also welcome to add information about the size of the list, and the name of the list you have dropped into.

**Suggestion** "Movement cancelled. The item has returned to list ${listName} to its starting position of ${startPosition} of ${listLength}".

### Drop in the home list

This announcement should:

- Inform the user that they have completed the drag
- Let them know what position the item is in now

**Default message**: "You have dropped the item. It has moved from position ${result.source.index + 1} to ${result.destination.index + 1}"

You may also want to provide a different message if they drop in the same position that they started in.

**Default message**: "You have dropped the item. It has been dropped on its starting position of ${result.source.index + 1}"

### Drop in a foreign list

The messaging for this scenario should be similar to that of dropping in the home list, with the additional information of what list the item started in and where it finished.

**Default message**: "You have dropped the item. It has moved from position ${result.source.index + 1} in list ${result.source.droppableId} to position ${result.destination.index + 1} in list ${result.destination.droppableId}"

You may want to extend this to include the name of the `Droppable` rather than the id. Also, if your `Droppable`s are ordered you may also want to include some positioning information.

### Drop on no destination

It is possible for a user to drop on no Droppable. This is not possible to do with a keyboard. However, if a user is using a pointer input such as a mouse. Our messaging is geared towards keyboard usage. However, it is a good idea to provide messaging for this scenario also.

In this message you should:

- Let the user know that they dropped while not over a droppable location
- Let them know where the item has returned to

**Default message**: "The item has been dropped while not over a droppable location. The item has returned to its starting position of ${result.source.index + 1}"

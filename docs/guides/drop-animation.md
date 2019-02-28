# Drop animation

Out of the box we provide a beautiful drop animation for you to use. We have worked hard to create an experience that feels responsive while also feeling like you are physically dropping an object. There may be situations in which you want to add an additional effect to the drop, or remove the drop animation entirely.

## Styling a drop

You are able to add your own style to a `<Draggable />` while it is dropping (such as `background-color`). You know a drop is occurring when `DraggableStateSnapshot > DropAnimation` is populated.

## Patching the drop animation

In some cases you might want to add an additional `transform` or change the `transition`. In which case, you can patch the style of a `<Draggable />` while a drop is occurring. (patch `DraggableProvided > DraggableProps > DraggableStyle`)

Here is the shape of `DropAnimation`:

```js
type DropReason = 'DROP' | 'CANCEL';

type DropAnimation = {|
  // how long the animation will run for
  duration: number,
  // the animation curve that we will be using for the drop
  curve: string,
  // the x,y position will be be animating to as a part of the drop
  moveTo: Position,
  // when combining with another item, we animate the opacity when dropping
  opacity: ?number,
  // when combining with another item, we animate the scale when dropping
  scale: ?number,
|};
```

You can use the `DraggableDroppingState` to build up your own `transform` and `transition` properties during a drop.

```js
const getStyle = (style, snapshot):  => {
  if (!snapshot.isDropAnimating) {
    return style;
  }
  const {moveTo, curve, duration} = snapshot.dropAnimation;
  // move to the right spot
  const translate = `translate(${moveTo.x}px, ${moveTo.y}px)`;
  // add a bit of turn for fun
  const rotate = 'rotate(0.5turn)';

  // patching the existing style
  return {
    ...style,
    transform: `${translate} ${rotate}`,
    // slowing down the drop because we can
    transition: `all ${curve} ${duration + 1}s`,
  };
};

class TaskItem extends React.Component {
  render() {
    const task = this.props.task;
    return (
      <Draggable draggableId={task.id} index={this.props.index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            isDragging={snapshot.isDragging && !snapshot.isDropAnimating}
            style={getStyle(provided.draggableProps.style, snapshot)}
          >
            {task.content}
          </div>
        )}
      </Draggable>
    );
  }
}
```

## Skipping the drop animation

Generally speaking you should be avoiding this. A drop animation is an important affordance to communicate placement. Our drop animations do not prevent the user from dragging something else while the animation is running.

If you are seeing a strange drop behaviour, such as dropping to the wrong spot, our recommendation is to raise an issue as it could be a bug with `react-beautiful-dnd` or a setup issue.

If you do have use case where it makes sense to remove the drop animation you will need to add a `[transition-duration](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-duration)` property of _almost_ `0s`. This will skip the drop animation.

Do not make the `transition-duration` actually `0s`. It should be set at a near `0s` value such as `0.001s`. The reason for this is that if you set `transition-duration` to `0s` then a `onTransitionEnd` event will not fire - and we use that to know when the drop animation is finished.

```js
const getStyle = (style, snapshot): ?Object => {
  if (!snapshot.isDropAnimating) {
    return style;
  }
  return {
    ...style,
    // cannot be 0, but make it super tiny
    transitionDuration: `0.001s`,
  };
};

class TaskItem extends React.Component {
  render() {
    const task = this.props.task;
    return (
      <Draggable draggableId={task.id} index={this.props.index}>
        {(provided, snapshot) => (
          <div
            innerRef={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={getStyle(provided.draggableProps.style, snapshot)}
          >
            {task.content}
          </div>
        )}
      </Draggable>
    );
  }
}
```

[← Back to documentation](/README.md#documentation-)

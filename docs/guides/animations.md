# Carefully designed animations

With things moving a lot it would be easy for the user to become distracted by the animations or for them to get in the way. We have tweaked the various animations to ensure the right balance of guidance, performance and interactivity.

## Dropping

We have designed a drop animation that feels weighted and physical. It is based on a [`spring`](https://developer.android.com/guide/topics/graphics/spring-animation) and uses a CSS animation with a dynamic duration to achieve the effect.

![result-curve](https://user-images.githubusercontent.com/2182637/48235467-1ce34200-e412-11e8-8c69-2060a0c2f61a.png)

> Animation curve used when dropping. Duration is dynamic based on distance to travel

You can tweak the drop animation if you would like to. We have created a guide: [drop animation](/docs/guides/drop-animation.md)

## Moving out of the way

Items that are moving out of the way of a dragging item do so with a CSS transition rather than physics. This is to maximise performance by allowing the GPU to handle the movement. The CSS animation curve has been designed to communicate getting out of the way.

How it is composed:

1.  A warm up period to mimic a natural response time
2.  A small phase to quickly move out of the way
3.  A long tail so that people can read any text that is being animated in the second half of the animation

![animation curve](https://raw.githubusercontent.com/alexreardon/files/master/resources/dnd-ease-in-out-small.png?raw=true)

> Animation curve used when moving out of the way

[Back to home](/README.md#documentation-)

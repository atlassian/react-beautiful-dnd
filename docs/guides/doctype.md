# Use the html5 `doctype`

Be sure that you have specified the html5 `doctype` ([Document Type Definition - DTD](https://developer.mozilla.org/en-US/docs/Glossary/Doctype)) for your `html` page:

```html
<!DOCTYPE html>
```

A `doctype` impacts browser layout and measurement apis. Not specifying a `doctype` is a world of pain 🔥. Browsers will use some other `doctype` such as ["Quirks mode"](https://en.wikipedia.org/wiki/Quirks_mode) which can drastically change layout and measurement ([more information](https://www.w3.org/QA/Tips/Doctype)). The html5 `doctype` is our only supported `doctype`.

For non `production` builds we will log a warning to the `console` if a html5 `doctype` is not found. You can [disable the warning](#disable-warnings) if you like.

[← Back to documentation](/README.md#documentation-)

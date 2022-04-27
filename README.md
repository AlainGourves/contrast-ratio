![Screen capture](https://raw.githubusercontent.com/AlainGourves/contrast-ratio/blob/main/contrast-ratio-checker.png)

# Contrast ratio checker

Given a background and a text colors, this computes their contrast ratio according to [WCAG 2.0 formula](https://www.w3.org/TR/WCAG20/#contrast-ratiodef), ranging from 1:1 (no contrast, e.g., black text on a black background) to 21:1 (maximum contrast, e.g., black text on a white background).

On the canvas, the stripped zone overlays the colors where the contrast ratio is inferior to 3.

The white little circle marks the currently selected background color.

Colors can be changed either via their respective color picker, or, for the background color, by clicking on the color chart.


## Installation

First:

```bash
npm install
```
And then:

```bash
npm start
```

## Libraries

Uses [p5.js](https://p5js.org/) for canvas manipulation.
![Screen capture](https://github.com/AlainGourves/contrast-ratio/blob/main/contrast-ratio-checker.png?raw=true)

# Contrast ratio checker

Given a background and a text colors, this computes their contrast ratio according to [WCAG 2.0 formula](https://www.w3.org/TR/WCAG20/#contrast-ratiodef), ranging from 1:1 (no contrast, e.g., a color compared to itself) to 21:1 (maximum contrast, obtainable by comparing black and white).

On the canvas, the stripped zone overlays the colors where the contrast ratio is inferior to the recommended minimum.

The white little circle marks the currently selected background color.

Colors can be changed either via their respective color picker, or, for the background color, by clicking on the color chart.

Dropdown menu let you select different color blindness to simulate on the sample zone.

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

- [p5.js](https://p5js.org/) for canvas manipulation.
- [Color Blindness Emulation](https://github.com/hail2u/color-blindness-emulation) for the SVG filters.

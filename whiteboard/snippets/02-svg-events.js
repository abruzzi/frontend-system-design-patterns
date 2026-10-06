// Example 2 — SVG shapes are addressable with normal DOM APIs.
//
// Idea: because the browser retained the rectangle, we can find it, listen
// to it, style it, and move it without redrawing the whole scene.

const svg = document.querySelector("svg");
const rect = svg.querySelector("#box");

rect.addEventListener("pointerdown", (event) => {
  // event.target is the rectangle, not a pixel on a canvas
});

rect.setAttribute("x", "160");
rect.classList.add("selected");

// Convenient for small scenes.
// At thousands of nodes, the retained tree becomes the bottleneck.

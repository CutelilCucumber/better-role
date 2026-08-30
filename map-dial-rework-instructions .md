# Task: Map Dial Rework (v2)

You are modifying an existing React app called Role Better. The relevant files live in
`src/pages/MapScreen.jsx`, `src/components/BottomNav.jsx`, and `src/App.jsx`. Read all
three before starting. Do not touch `src/pages/ActivitiesScreen.jsx`,
`src/pages/CharacterScreen.jsx`, or anything in `src/modals/`.

The goal is to turn the current static radial map into a rotating dial, similar in feel
to the Skyrim skill constellation wheel: you drag the wheel to spin it, it snaps onto
whichever attribute is centered at the top, and that attribute lights up.

Work through the steps below **in order**. Each step is independently testable — get
one working before moving to the next.

---

## Step 1 — Move the tab bar from bottom to top

File: `src/components/BottomNav.jsx` and `src/App.jsx`.

1. In `BottomNav.jsx`, change the outer wrapper from `fixed bottom-0` to `fixed top-0`.
   Keep everything else (the three tab buttons) the same. You may rename the file to
   `TopNav.jsx` if you prefer, but it is not required.
2. In `App.jsx`, render the nav bar **first**, before the scrolling content div, and
   swap the content wrapper's padding from bottom (`pb-20`) to top (`pt-16`).
3. Confirm: switching between Map / Activities / Character tabs still works, and the
   nav bar now sits at the very top of the screen on all three tabs.

---

## Step 2 — Move the existing "+ New" button to the bottom (do not rebuild it)

**Do not delete or recreate this button.** It already exists in `MapScreen.jsx` as the
circular button in the middle of the dial. You are only changing where it sits on
screen. Keep its JSX, styling, icon, and `onClick={onOpenNew}` exactly as they are.

1. Find the code that positions this button (currently something like
   `left: center, top: center`). Change its position so it sits horizontally centered
   and near the **bottom** of the map screen's container instead of the middle.
2. This button's screen position becomes the **hub** — the fixed pivot point that the
   whole dial rotates around, and the origin point for the spoke lines in Step 8.
   Store its coordinates in two variables, e.g. `hubX` and `hubY`, computed from the
   container's dimensions (e.g. `hubX = containerWidth / 2`, `hubY = containerHeight -
   BUTTON_RADIUS - BOTTOM_MARGIN`).
3. Every place in the existing code that currently computes positions using a shared
   `center` variable (for both x and y) must now use `hubX` for the x-origin and
   `hubY` for the y-origin instead. They are no longer the same value — `hubY` sits
   near the bottom, not the vertical middle.

---

## Step 3 — Stretch the dial's radius to span top attribute → bottom button

The dial's radius is no longer an arbitrary constant. It is defined by the actual
vertical space between the button (hub, near the bottom of the screen) and where the
topmost attribute needs to appear (near the top of the screen).

```js
const topMargin = 24; // space reserved below the top nav bar for the top attribute's label
const dialRadius = hubY - topMargin;
```

Use `dialRadius` everywhere the old `baseRadius` constant was used. This means when an
attribute's effective angle is exactly `-90` (straight up), its label lands right at
`topMargin` from the top of the container — and when rotation moves a different
attribute to the top, it lands in that same spot. The circle itself is much larger
than the visible screen; only the top portion of it is ever on-screen, which is
expected.

---

## Step 4 — Responsive visible arc: 60° on mobile, 180° on desktop

Only attributes within a certain angular distance of the top ("focused" position)
should be visible at all. How much is visible depends on screen size:

- **Mobile** (narrow viewport, e.g. `window.innerWidth < 640`): only show attributes
  within **30°** of top (a 60° total arc). With attributes spaced 60° apart, this
  means, in practice, only the single focused attribute is visible — its neighbors sit
  right at or beyond the edge of the visible arc and should not render.
- **Desktop** (`window.innerWidth >= 640`): show attributes within **90°** of top (a
  180° total arc). This reveals the focused attribute plus its two immediate
  neighbors on either side.

Implementation:

1. Track viewport width with a small hook or `useState` + `resize` listener, and
   derive `const visibleHalfArc = isMobile ? 30 : 90;`
2. Reuse the angular-distance calculation from Step 7 (the same shortest-angle-diff
   math used to find the focused attribute) to get each attribute's `diff` from top.
3. If `diff > visibleHalfArc`, do not render that attribute's label/icon or any of its
   activity nodes at all (return `null` for that attribute's group, or skip it when
   mapping). If `diff <= visibleHalfArc`, render it normally per Step 7's focused vs.
   unfocused styling rules.
4. Keep the container's `overflow: hidden` from before as a safety net, but the
   degree-based check above is the primary mechanism — don't rely on clipping alone.

---

## Step 5 — Rotation state and drag/swipe handling

### 5a. Add rotation state

```js
const [rotation, setRotation] = useState(0); // degrees, can be any value incl. negative
const [dragging, setDragging] = useState(false);
```

### 5b. Do NOT use a CSS `transform: rotate(...)` on a wrapper element

Every place that computes a position using `attr.angle` (attribute labels, activity
nodes, spokes) must use `attr.angle + rotation` instead. This keeps labels and icons
upright without needing any counter-rotation. Example:

```js
const effectiveAngle = attr.angle + rotation;
const rad = (effectiveAngle * Math.PI) / 180;
const lx = hubX + Math.cos(rad) * dialRadius;
const ly = hubY + Math.sin(rad) * dialRadius;
```

The underlying `ATTRS` array in `src/constants/attributes.js` does not change — its
`angle` values stay fixed anchors; `rotation` is applied on top at render time.

### 5c. Pointer drag handling

Attach `onPointerDown`, `onPointerMove`, `onPointerUp`, and `onPointerLeave` handlers to
the dial container div.

```js
function angleFromHub(clientX, clientY, containerRect, hubX, hubY) {
  const x = clientX - containerRect.left - hubX;
  const y = clientY - containerRect.top - hubY;
  return (Math.atan2(y, x) * 180) / Math.PI;
}
```

- `onPointerDown`: record `startPointerAngle` (via `angleFromHub`) and `startRotation`
  (current `rotation`). Set `dragging` to true. Call
  `e.target.setPointerCapture(e.pointerId)`.
- `onPointerMove`: only act if dragging.
  ```js
  const delta = currentPointerAngle - startPointerAngle;
  setRotation(startRotation + delta);
  ```
- `onPointerUp` / `onPointerLeave`: set `dragging` to false, then run the snap logic
  from Step 6.

---

## Step 6 — Snap to the nearest attribute on release

Attributes sit 60° apart. On pointer release, round rotation to the nearest 60°:

```js
function snapRotation(rotation) {
  return Math.round(rotation / 60) * 60;
}
```

Set `rotation` to this snapped value. A smooth transition is nice-to-have, not
required — if animating is difficult given the "no CSS transform" constraint, an
instant snap is an acceptable fallback.

---

## Step 7 — Determine and highlight the focused (topmost) attribute

```js
function getAngleDiffFromTop(attrAngle, rotation) {
  const effective = ((attrAngle + rotation) % 360 + 360) % 360;
  const target = 270; // -90 normalized to 0–360
  let diff = Math.abs(effective - target);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function getFocusedAttribute(rotation) {
  let best = ATTRS[0];
  let bestDiff = Infinity;
  for (const attr of ATTRS) {
    const diff = getAngleDiffFromTop(attr.angle, rotation);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = attr;
    }
  }
  return best;
}
```

Compute `const focused = getFocusedAttribute(rotation);` on every render. Reuse
`getAngleDiffFromTop` for the Step 4 visibility check too, so there's one source of
truth for "how far is this attribute from the top."

Visual rules:

- **Focused attribute** (`attr.key === focused.key`): full `attr.color`, slightly
  larger label. Its activity nodes show their name text.
- **Other visible attributes** (within the arc from Step 4, but not focused): muted
  gray (e.g. `#525252`) instead of `attr.color`. Their activity nodes shrink to plain
  unlabeled dots — still tappable, just no name text and a muted border color.
- **Attributes outside the visible arc**: not rendered at all (per Step 4).

---

## Step 8 — Spokes from the button, running between attributes (not at them)

Delete any line-drawing code left over from earlier attempts that connects attribute
to attribute, or that points a line directly at each attribute. Replace it with spokes
that:

- Originate at the hub (`hubX, hubY` — the button's position from Step 2).
- Point at the **midpoints between adjacent attributes**, not at the attributes
  themselves — so each spoke runs in the gap between two attribute clusters, like a
  sector divider.
- Extend outward to the edge of the dial (length ≈ `dialRadius`, or a bit past it).

Since `ATTRS` is ordered so each entry is exactly 60° after the previous one, the
midpoint between attribute `i` and attribute `i + 1` is simply
`ATTRS[i].angle + 30`. This gives six divider angles total:

```js
for (const attr of ATTRS) {
  const dividerAngle = attr.angle + 30 + rotation;
  const rad = (dividerAngle * Math.PI) / 180;
  const x2 = hubX + Math.cos(rad) * dialRadius;
  const y2 = hubY + Math.sin(rad) * dialRadius;
  // render <line x1={hubX} y1={hubY} x2={x2} y2={y2} stroke="#333" strokeWidth="1.5" />
}
```

Only render a divider line if at least one of its two neighboring attributes is
currently visible per Step 4 (no point drawing dividers for attributes that are
entirely off-screen). Styling: dim neutral gray by default; optionally brighten the
two dividers immediately flanking the focused attribute using its color at reduced
opacity — skip this polish detail if it's causing problems, uniform gray is fine.

---

## Acceptance checklist

- [ ] Tab bar (Map / Activities / Character) is at the top of the screen on all tabs.
- [ ] The same "+ New Activity" button from before (not a new one) now sits at the
      bottom of the Map screen, centered horizontally, and still opens the same
      activity picker modal.
- [ ] The dial's radius visibly spans from the top attribute's position down to the
      button — not an arbitrary fixed size.
- [ ] On a narrow/mobile-width viewport, only one attribute (the focused one) is
      visible at a time.
- [ ] On a wide/desktop-width viewport, the focused attribute plus its two immediate
      neighbors are visible (three total).
- [ ] Dragging/swiping left or right on the dial rotates it smoothly in real time,
      pivoting around the button's position, not the old screen-center point.
- [ ] Releasing a drag snaps the dial so the nearest attribute lands exactly at the
      top.
- [ ] After snapping, the newly-topmost attribute becomes highlighted (full color +
      labeled nodes); others revert to muted gray, unlabeled dots (or disappear if
      they fall outside the visible arc).
- [ ] The lines on the dial originate from the button and run in the gaps *between*
      attributes — no line points directly at an attribute, and no line connects one
      attribute straight to another.
- [ ] Tapping an activity node (labeled or unlabeled) still navigates to that
      activity's detail page, same as before.

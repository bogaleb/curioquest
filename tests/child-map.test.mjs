import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadTs } from "./load-typescript.mjs";

const root = resolve(import.meta.dirname, "..");
const { destinations, mapPlaces, primaryDestinations, destinationFor } = loadTs("lib/navigation");
const { wordBudget, countWords, systemWordsIn } = loadTs("lib/kid-copy");

/**
 * The map that replaced the menu (WP-03).
 *
 * These are checks on the *data*, because that is where the map lives: a place is a
 * coordinate, a hue, a spoken name and a drawing, and every one of those can be got wrong
 * without breaking a build. The rendered geometry is checked separately, against a real
 * browser, by `scripts/shot-child-map.mjs`.
 */

test("every destination has a place on the map", () => {
  for (const destination of destinations) {
    const place = destination.place;
    assert.ok(place, `${destination.id} has no place`);
    assert.ok(place.x >= 4 && place.x <= 96, `${destination.id} is off the map horizontally`);
    assert.ok(place.y >= 4 && place.y <= 96, `${destination.id} is off the map vertically`);
    assert.ok(["large", "small"].includes(place.size));
  }
});

test("the five primary destinations are the near, large places", () => {
  const primary = primaryDestinations({ faith: true });
  assert.equal(primary.length, 5, "the blueprint's five doors");
  for (const destination of primary) {
    assert.equal(destination.place.size, "large", `${destination.id} should be drawn large`);
    // Near means low on the picture, which is also where hands rest on a tablet (§C6).
    assert.ok(destination.place.y >= 55, `${destination.id} is too far up the picture`);
  }
  for (const destination of destinations.filter((item) => item.group === "secondary")) {
    assert.equal(destination.place.size, "small", `${destination.id} should be drawn small`);
    assert.ok(destination.place.y < 55, `${destination.id} should sit further away`);
  }
});

test("no two places sit on top of each other", () => {
  // The map is a fixed-size world (68rem x 48rem), so a separation in percent is a real
  // separation in pixels on every device. A landmark and its label occupy roughly 18% x 20%.
  for (const a of destinations) {
    for (const b of destinations) {
      if (a.id >= b.id) continue;
      const dx = Math.abs(a.place.x - b.place.x);
      const dy = Math.abs(a.place.y - b.place.y);
      assert.ok(dx >= 18 || dy >= 20, `${a.id} and ${b.id} are too close (${dx}% / ${dy}%)`);
    }
  }
});

test("the trail is the centre of the map and is not one of the places around it", () => {
  const trail = destinationFor("adventure");
  assert.ok(trail);
  assert.equal(trail.place.x, 50, "the trail is centred");
  // `mapPlaces` is what the map renders around the trailhead; the trail draws itself.
  assert.ok(!mapPlaces({ faith: true }).some((place) => place.id === "adventure"));
});

test("faith is the only place a family has to opt in to", () => {
  const withFaith = mapPlaces({ faith: true }).map((item) => item.id);
  const without = mapPlaces({ faith: false }).map((item) => item.id);
  assert.deepEqual(
    withFaith.filter((id) => !without.includes(id)),
    ["faith"],
  );
});

test("the map never reorders itself", () => {
  // Position is memory: a child learns where the grove is. If a future change sorts this
  // list by progress or recency, this test is the thing that stops it.
  const ids = mapPlaces({ faith: true }).map((item) => item.id);
  const byPosition = [...destinations]
    .filter((item) => item.id !== "adventure")
    .sort((a, b) => b.place.y - a.place.y)
    .map((item) => item.id);
  assert.deepEqual(ids, byPosition);
});

test("every spoken place name is child copy", () => {
  // Nova says these out loud on the first touch. They are the shortest copy in the product
  // and the most repeated, so they carry the §C5 rules in full.
  for (const destination of destinations) {
    const name = destination.place.childName;
    assert.ok(countWords(name) <= 3, `"${name}" is too long to be a landmark`);
    assert.ok(countWords(name) <= wordBudget("early-preschool"), name);
    assert.deepEqual(systemWordsIn(name), [], `"${name}" uses system vocabulary`);
    assert.ok(!/[A-Z]{3,}/.test(name), `"${name}" shouts`);
  }
});

test("every place has its own drawing, and no two share one", () => {
  const art = readFileSync(join(root, "components/kid/PlaceArt.tsx"), "utf8");
  const mapping = art.slice(art.indexOf("const art: Record"), art.indexOf("/**\n * The drawing"));
  const drawn = new Map([...mapping.matchAll(/^\s{2}(\w+): (\w+),$/gm)].map((m) => [m[1], m[2]]));
  for (const destination of destinations) {
    assert.ok(drawn.has(destination.id), `${destination.id} has no drawing`);
  }
  const shapes = [...drawn.values()];
  assert.equal(new Set(shapes).size, shapes.length, "two places share a silhouette");
});

test("the child layer, not the icon set, draws the map", () => {
  // The Lucide icons in navigation.ts are for Grown-ups. If one reaches a child surface the
  // check script fails; this pins the intent next to the data itself.
  const source = readFileSync(join(root, "components/experience/ChildMap.tsx"), "utf8");
  assert.ok(!/lucide-react/.test(source));
  assert.ok(!/\.icon\b/.test(source), "the map must not render the grown-up icon");
});

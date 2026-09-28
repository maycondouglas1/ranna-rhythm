import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeHit, makeChart, Round, TRACKS } from "../src/rhythm.ts";

test("timing, score, single consumption, wrong lanes, misses and deterministic charts", () => {
  assert.equal(gradeHit(-0.055), "perfect");
  assert.equal(gradeHit(0.105), "good");
  assert.equal(gradeHit(-0.16), "ok");
  assert.equal(gradeHit(0.161), "miss");
  const round = new Round([
    { lane: 0, time: 1, judged: false },
    { lane: 1, time: 2, judged: false },
  ]);
  assert.equal(round.hit(1, 1), null);
  assert.equal(round.hit(0, 1.03), "perfect");
  assert.equal(round.hit(0, 1.03), null);
  assert.equal(round.score, 1000);
  assert.equal(round.expire(2.17), 1);
  assert.equal(round.expire(3), 0);
  assert.equal(round.maxCombo, 1);
  assert.equal(round.combo, 0);
  assert.equal(round.accuracy, 50);
  for (const track of TRACKS) {
    let previousCount = 0;
    for (const difficulty of ["easy", "normal", "hard"] as const) {
      const chart = makeChart(track, difficulty);
      assert.deepEqual(chart, makeChart(track, difficulty));
      assert.ok(chart.length > previousCount);
      previousCount = chart.length;
      chart.forEach((note, i) => {
        assert.ok(note.lane >= 0 && note.lane < 4);
        assert.ok(note.time > 0 && note.time < track.duration);
        assert.ok(i === 0 || note.time > chart[i - 1].time);
      });
      const perfect = new Round(chart);
      chart.forEach((n) => perfect.hit(n.lane, n.time));
      assert.equal(perfect.accuracy, 100);
      assert.equal(perfect.maxCombo, chart.length);
      assert.equal(perfect.rank, "S");
    }
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { Sound } from "../src/audio.ts";

test("audio clock, pause/resume, buffer reuse, abort and failed downloads", async () => {
  const originalAudio = globalThis.AudioContext;
  const originalFetch = globalThis.fetch;
  let requests = 0;
  const starts: number[][] = [];
  const node = () => ({
    connect() {},
    disconnect() {},
    gain: { value: 0, setTargetAtTime() {} },
  });
  class MockContext {
    static instance: MockContext;
    currentTime = 10;
    baseLatency = 0;
    state = "running";
    destination = {};
    constructor() {
      MockContext.instance = this;
    }
    async resume() {
      this.state = "running";
    }
    createGain = node;
    createDynamicsCompressor = node;
    async decodeAudioData() {
      return { duration: 90 };
    }
    createBufferSource() {
      return {
        ...node(),
        start(...args: number[]) {
          starts.push(args);
        },
        stop() {},
      };
    }
  }
  globalThis.AudioContext = MockContext as unknown as typeof AudioContext;
  globalThis.fetch = async () => {
    requests++;
    return new Response(new ArrayBuffer(8));
  };
  try {
    const sound = new Sound();
    await sound.unlock();
    await sound.load("pixel.mp3", new AbortController().signal);
    sound.play(-3);
    assert.deepEqual(starts[0], [13, 0]);
    assert.equal(sound.time, -3);
    MockContext.instance.currentTime = 18;
    assert.equal(sound.time, 5);
    sound.pause();
    MockContext.instance.currentTime = 25;
    assert.equal(sound.time, 5);
    await sound.resume();
    assert.deepEqual(starts[1], [25, 5]);
    MockContext.instance.currentTime = 26;
    assert.equal(sound.time, 6);
    sound.stop();
    assert.equal(sound.time, 0);
    await sound.load("pixel.mp3", new AbortController().signal);
    assert.equal(requests, 1);
    const abort = new AbortController();
    abort.abort();
    await assert.rejects(sound.load("pixel.mp3", abort.signal), {
      name: "AbortError",
    });
    globalThis.fetch = async () => new Response(null, { status: 404 });
    await assert.rejects(
      sound.load("broken.mp3", new AbortController().signal),
      /carregar a música/,
    );
  } finally {
    globalThis.AudioContext = originalAudio;
    globalThis.fetch = originalFetch;
  }
});

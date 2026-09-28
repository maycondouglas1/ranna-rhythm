export class Sound {
  private context?: AudioContext;
  private music?: GainNode;
  private effects?: GainNode;
  private source?: AudioBufferSourceNode;
  private buffer?: AudioBuffer;
  private startedAt = 0;
  private position = 0;
  private running = false;
  private loadedFile?: string;
  volume = 0.7;

  async unlock() {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: "interactive" });
      this.music = this.context.createGain();
      this.effects = this.context.createGain();
      const master = this.context.createDynamicsCompressor();
      this.music.connect(master);
      this.effects.connect(master);
      master.connect(this.context.destination);
      this.effects.gain.value = 0.09;
      this.setVolume(this.volume);
    }
    await this.context.resume();
  }

  async load(file: string, signal: AbortSignal) {
    if (!this.context) throw new Error("Áudio indisponível neste navegador.");
    if (this.loadedFile !== file) {
      const response = await fetch(`/music/${file}`, { signal });
      if (!response.ok)
        throw new Error("Não foi possível carregar a música. Tente novamente.");
      const buffer = await this.context.decodeAudioData(
        await response.arrayBuffer(),
      );
      signal.throwIfAborted();
      this.buffer = buffer;
      this.loadedFile = file;
    }
    signal.throwIfAborted();
  }

  play(position = -3) {
    this.stopSource();
    const ctx = this.context!;
    const source = ctx.createBufferSource();
    source.buffer = this.buffer!;
    source.connect(this.music!);
    source.onended = () => source.disconnect();
    source.start(
      ctx.currentTime + Math.max(0, -position),
      Math.max(0, position),
    );
    this.source = source;
    this.position = position;
    this.startedAt = ctx.currentTime;
    this.running = true;
  }

  get time() {
    if (!this.running) return this.position;
    const ctx = this.context!;
    // Match the clock to sound reaching the speakers, not the render frame rate.
    const timestamp = ctx.getOutputTimestamp?.();
    const audible =
      timestamp &&
      timestamp.contextTime !== undefined &&
      timestamp.performanceTime !== undefined &&
      timestamp.contextTime > 0
        ? timestamp.contextTime +
          Math.max(0, performance.now() - timestamp.performanceTime) / 1000
        : ctx.currentTime - (ctx.baseLatency || 0);
    return audible - this.startedAt + this.position;
  }
  get interrupted() {
    return this.context?.state !== "running";
  }

  pause() {
    this.position = this.time;
    this.running = false;
    this.stopSource();
  }
  async resume() {
    await this.unlock();
    this.play(this.position);
  }
  stop() {
    this.running = false;
    this.position = 0;
    this.stopSource();
  }
  private stopSource() {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = undefined;
    }
  }
  setVolume(value: number) {
    this.volume = value;
    if (this.music && this.context)
      this.music.gain.setTargetAtTime(
        value === 0 ? 0 : 10 ** ((value - 1) * 2),
        this.context.currentTime,
        0.03,
      );
  }
  tick(lane: number, perfect = false) {
    if (!this.context || this.context.state !== "running" || this.volume === 0)
      return;
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      [523.25, 659.25, 783.99, 1046.5][lane] * (perfect ? 1 : 0.5),
      ctx.currentTime,
    );
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    oscillator.connect(gain);
    gain.connect(this.effects!);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}

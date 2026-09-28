export type Difficulty = "easy" | "normal" | "hard";
export type Grade = "perfect" | "good" | "ok" | "miss";
export interface Note {
  time: number;
  lane: number;
  judged: boolean;
}
export interface Track {
  id: string;
  title: string;
  subtitle: string;
  bpm: number;
  offset: number;
  duration: number;
  file: string;
  color: string;
  icon: string;
  isrc: string;
}
export const TRACKS: Track[] = [
  {
    id: "pixel",
    title: "Pixel Peeker Polka",
    subtitle: "O show do Cebolinha",
    bpm: 145,
    offset: 0.03,
    duration: 90,
    file: "pixel.mp3",
    color: "#ffd578",
    icon: "✦",
    isrc: "USUAN1100833",
  },
  {
    id: "cipher",
    title: "Cipher",
    subtitle: "Nós dois, em outro universo",
    bpm: 150,
    offset: 0.035,
    duration: 90,
    file: "cipher.mp3",
    color: "#b8a0ef",
    icon: "☾",
    isrc: "USUAN1100844",
  },
  {
    id: "pamgaea",
    title: "Pamgaea",
    subtitle: "Um encontro na pista",
    bpm: 94,
    offset: 0.195,
    duration: 90,
    file: "pamgaea.mp3",
    color: "#8ed8cc",
    icon: "♡",
    isrc: "USUAN1300036",
  },
];
export const HIT_WINDOW = 0.16;
export const APPROACH = 1.65;
const PATTERNS = [
  [0, 1, 2, 3, 2, 1, 0, 2],
  [3, 2, 0, 1, 2, 3, 1, 0],
  [0, 2, 1, 3, 1, 2, 0, 3],
];

export function makeChart(track: Track, difficulty: Difficulty): Note[] {
  const beat = 60 / track.bpm;
  const notes: Note[] = [];
  // Musical phrases repeat predictably; the first four beats leave room to listen.
  for (let i = 4; track.offset + i * beat < track.duration - 2; i++) {
    if (difficulty === "easy" && i % 2) continue;
    const phrase = Math.floor(i / 16);
    const lane = PATTERNS[phrase % PATTERNS.length][i % 8];
    notes.push({ time: track.offset + i * beat, lane, judged: false });
    if (difficulty === "hard" && i % 4 >= 2) {
      notes.push({
        time: track.offset + (i + 0.5) * beat,
        lane: (lane + 1) % 4,
        judged: false,
      });
    }
  }
  return notes;
}

export function gradeHit(delta: number): Grade {
  const distance = Math.abs(delta);
  return distance <= 0.055
    ? "perfect"
    : distance <= 0.105
      ? "good"
      : distance <= HIT_WINDOW
        ? "ok"
        : "miss";
}

export class Round {
  score = 0;
  combo = 0;
  maxCombo = 0;
  counts: Record<Grade, number> = { perfect: 0, good: 0, ok: 0, miss: 0 };
  constructor(readonly notes: Note[]) {}

  hit(lane: number, time: number): Grade | null {
    const note = this.notes.find(
      (n) =>
        !n.judged && n.lane === lane && Math.abs(n.time - time) <= HIT_WINDOW,
    );
    if (!note) return null;
    const grade = gradeHit(time - note.time);
    this.judge(note, grade);
    return grade;
  }

  expire(time: number): number {
    let missed = 0;
    for (const note of this.notes) {
      if (note.time >= time - HIT_WINDOW) break;
      if (!note.judged) {
        this.judge(note, "miss");
        missed++;
      }
    }
    return missed;
  }

  private judge(note: Note, grade: Grade) {
    note.judged = true;
    this.counts[grade]++;
    this.combo = grade === "miss" ? 0 : this.combo + 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += { perfect: 1000, good: 700, ok: 400, miss: 0 }[grade];
  }

  get accuracy() {
    const total = Object.values(this.counts).reduce((sum, n) => sum + n, 0);
    return total ? this.score / (total * 10) : 100;
  }
  get rank() {
    return this.accuracy >= 95
      ? "S"
      : this.accuracy >= 85
        ? "A"
        : this.accuracy >= 70
          ? "B"
          : "C";
  }
}

import crypto from "crypto";

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ENCODING_LENGTH = ENCODING.length;
const TIME_LENGTH = 10;
const RANDOM_LENGTH = 16;

function encodeTime(timeMs: number): string {
  let value = Math.max(0, Math.floor(timeMs));
  let encoded = "";
  for (let i = 0; i < TIME_LENGTH; i += 1) {
    encoded = ENCODING[value % ENCODING_LENGTH] + encoded;
    value = Math.floor(value / ENCODING_LENGTH);
  }
  return encoded;
}

function randomChars(): number[] {
  const bytes = crypto.randomBytes(10); // 80 bits
  const chars: number[] = new Array(RANDOM_LENGTH);
  let buffer = 0;
  let bits = 0;
  let idx = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5 && idx < RANDOM_LENGTH) {
      bits -= 5;
      chars[idx] = (buffer >> bits) & 0b11111;
      idx += 1;
    }
  }

  // Should always fill 16 chars; fallback zeros if entropy ever underflows.
  while (idx < RANDOM_LENGTH) {
    chars[idx] = 0;
    idx += 1;
  }

  return chars;
}

function incrementChars(chars: number[]): number[] {
  const next = chars.slice();
  for (let i = RANDOM_LENGTH - 1; i >= 0; i -= 1) {
    if (next[i] < ENCODING_LENGTH - 1) {
      next[i] += 1;
      for (let j = i + 1; j < RANDOM_LENGTH; j += 1) {
        next[j] = 0;
      }
      return next;
    }
  }
  throw new Error("ULID monotonic overflow");
}

function encodeChars(chars: number[]): string {
  return chars.map((c) => ENCODING[c]).join("");
}

export class UlidGenerator {
  private lastTime = -1;
  private lastRandom: number[] = randomChars();

  generate(timeMs: number = Date.now()): string {
    const timePart = encodeTime(timeMs);
    if (timeMs === this.lastTime) {
      this.lastRandom = incrementChars(this.lastRandom);
    } else {
      this.lastRandom = randomChars();
      this.lastTime = timeMs;
    }
    const randPart = encodeChars(this.lastRandom);
    return `${timePart}${randPart}`;
  }
}

export const ulidGenerator = new UlidGenerator();

export function ulid(timeMs?: number): string {
  return ulidGenerator.generate(timeMs);
}

import { describe, expect, it } from "vitest";
import { milliseconds2text, text2lines } from "./utils";

function timeConfig2milliseconds({
  hours,
  minutes,
  seconds,
  milliseconds,
}: {
  hours?: number,
  minutes?: number,
  seconds?: number,
  milliseconds?: number,
}) {
  const msPerSecond = 1000;
  const msPerMinute = msPerSecond * 60;
  const msPerHour = msPerMinute * 60;
  hours = hours || 0;
  minutes = minutes || 0;
  seconds = seconds || 0;
  milliseconds = milliseconds || 0;
  return hours * msPerHour + minutes * msPerMinute + seconds * msPerSecond + milliseconds;
}

describe('test milliseconds2text', () => {
  it('converts 10ms', () => {
    const text = milliseconds2text(timeConfig2milliseconds({
      milliseconds: 10,
    }));
    expect(text).toBe('10 millisecond(s)');
  });

  it('converts when 1s', () => {
    const text = milliseconds2text(timeConfig2milliseconds({
      seconds: 1,
    }));
    expect(text).toBe('1 second(s)');
  });

  it('converts when 1s,10ms', () => {
    const text = milliseconds2text(timeConfig2milliseconds({
      seconds: 1,
      milliseconds: 10,
    }));
    expect(text).toBe('1 second(s)');
  });

  it('converts when 10m,1s,10ms', () => {
    const text = milliseconds2text(timeConfig2milliseconds({
      minutes: 10,
      seconds: 1,
      milliseconds: 10,
    }));
    expect(text).toBe('10 minute(s) and 1 second(s)');
  });

  it('converts when 1hr,10m,1s,10ms', () => {
    const text = milliseconds2text(timeConfig2milliseconds({
      hours: 1,
      minutes: 10,
      seconds: 1,
      milliseconds: 10,
    }));
    expect(text).toBe('1 hour(s), 10 minute(s), and 1 second(s)');
  });

  it('converts when 1hr,20s', () => {
    const text = milliseconds2text(timeConfig2milliseconds({
      hours: 1,
      seconds: 20,
    }));
    expect(text).toBe('1 hour(s) and 20 second(s)');
  });
});


describe('test text2lines', () => {
  it.each([
    'I am a cat. As yet I have no name.',
    'Tu fui, ego eris',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa bbbbbbbbbbbbbbbbbbbbb',
    'Writing tests are for normies',
  ])('breaks text="%s" into lines of length <= 10 when line break is 10', (text) => {
    const lineBreak = 10;
    const lines = text2lines(text, lineBreak);
    for (const l of lines) {
      expect(l.length).toBeLessThanOrEqual(lineBreak);
    }
    expect(lines.join('').replace(/\s/g, '')).toBe(text.replace(/\s/g, ''));
  });
});
const MAX_INT = Number.MAX_SAFE_INTEGER;

function zeroPad(value: number, targetLen: number) {
  const pad = targetLen - `${value}`.length;
  if (pad < 0) {
    return `${value}`;
  }
  return "0".repeat(pad) + `${value}`;
}

export function timestamp2key(timestamp: number) {
  const targetLen = `${MAX_INT}`.length;
  return zeroPad(timestamp, targetLen);
}

export function key2timestamp(key: string) {
  const timestamp = parseInt(key);
  if (timestamp < 0 || timestamp > MAX_INT) {
    throw new Error('timestamp is out of range');
  }
  return timestamp;
}

export function milliseconds2text(milliseconds: number) {
  const msPerSecond = 1000;
  const msPerMinute = msPerSecond * 60;
  const msPerHour = msPerMinute * 60;

  const timeUnitsConfig = [
    {
      name: 'hour',
      msPerTimeUnit: msPerHour,
    },
    {
      name: 'minute',
      msPerTimeUnit: msPerMinute,
    },
    {
      name: 'second',
      msPerTimeUnit: msPerSecond,
    },
  ];

  const timeUnits = new Array(timeUnitsConfig.length).map((_) => 0);
  for (let i = 0; i < timeUnitsConfig.length; i++) {
    const { msPerTimeUnit } = timeUnitsConfig[i];
    if (milliseconds >= msPerTimeUnit) {
      timeUnits[i] = Math.floor(milliseconds / msPerTimeUnit);
      milliseconds -= timeUnits[i] * msPerTimeUnit;
    }
  }

  const textChunks = timeUnits
    .map((v, i) => {
      return {
        name: timeUnitsConfig[i].name,
        time: v,
      }
    })
    .filter(({ time }) => time > 0)
    .map(({ time, name }) => `${time} ${name}(s)`);

  if (textChunks.length === 0) {
    return `${milliseconds} millisecond(s)`;
  } else if (textChunks.length === 1) {
    return textChunks[0];
  } else if (textChunks.length === 2) {
    return `${textChunks[0]} and ${textChunks[1]}`;
  } else {
    return textChunks.slice(0, textChunks.length - 1).join(', ') + `, and ${textChunks[textChunks.length - 1]}`;
  }
}

export function text2lines(text: string, lineBreak: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line: string[] = [];
  for (const w of words) {
    const updatedLine = [...line, w];
    const updatedLineLen = updatedLine.map((w) => w.length).reduce((a, b) => a + b, 0) + Math.max(updatedLine.length - 1, 0);
    if (updatedLineLen > lineBreak) {
      lines.push(line.join(' '));
      line = [];
    }
    const subLines = word2lines(w, lineBreak);
    if (subLines.length > 0) {
      for (let i = 0; i < subLines.length - 1; i++) {
        lines.push(subLines[i]);
      }
      line.push(subLines[subLines.length - 1]);
    }
  }
  if (line.length > 0) {
    lines.push(line.join(' '));
  }
  return lines;
}

function word2lines(text: string, lineBreak: number): string[] {
  const lines: string[] = [];
  let p = 0;
  let q = 0;
  while (q < text.length) {
    if (q - p >= lineBreak) {
      lines.push(text.slice(p, q));
      p = q;
    }
    q++;
  }
  if (p < q) {
    lines.push(text.slice(p, q));
  }
  return lines
}
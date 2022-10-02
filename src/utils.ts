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
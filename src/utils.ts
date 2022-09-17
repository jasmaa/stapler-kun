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
/** Trailing moving average; the head uses partial windows; output length === input length. */
export function movingAverage(values: readonly number[], window: number): number[] {
  if (!Number.isInteger(window) || window < 1) {
    throw new Error(`movingAverage(window=${window}): window must be a positive integer`);
  }
  const out: number[] = new Array(values.length);
  let windowSum = 0;
  for (let i = 0; i < values.length; i++) {
    windowSum += values[i] as number;
    if (i >= window) windowSum -= values[i - window] as number;
    out[i] = windowSum / Math.min(window, i + 1);
  }
  return out;
}

import { DISTANCE_DIFF_DICT } from './constants';

export const formatDiff = (meters: number): string => {
  if (meters < 0) return "-";
  const m = meters / 2.5; // Roughly convert to horse bodies for check
  
  if (m > 10) return "大差";
  if (m > 1) return Math.round(m) + "马身";
  
  // Find closest in dict
  let best = DISTANCE_DIFF_DICT[0];
  let minDiff = 999;
  for (const entry of DISTANCE_DIFF_DICT) {
      if (entry.diff > 2.5) continue; // skip huge ones handled above
      const d = Math.abs(entry.diff - m * 2.5); // entry.diff is in meters? No, strict check
      // C# code: entry.diff in meters. "1马身" = 2.5m.
      const diffVal = Math.abs(entry.diff - meters);
      if (diffVal < minDiff) {
          minDiff = diffVal;
          best = entry;
      }
  }
  return best.text;
};

export const shuffle = <T>(array: T[]): T[] => {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
};
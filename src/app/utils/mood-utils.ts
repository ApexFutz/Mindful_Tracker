export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-blue-500';
  if (score >= 4) return 'text-yellow-600';
  return 'text-red-500';
}

export function getMoodDescription(score: number): string {
  if (score === 1) return 'Deep Distress / Crisis';
  if (score <= 3) return 'Very Low / Struggling';
  if (score <= 5) return 'Neutral / Stable';
  if (score <= 7) return 'Good / Positive';
  if (score <= 9) return 'Very Happy / Energized';
  if (score === 10) return 'Peak State / Excellent';
  return '';
}

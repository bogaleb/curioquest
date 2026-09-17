export function questSizeForGoal(goal: number) {
  return Math.max(3, Math.min(10, Math.floor(goal / 2)));
}

export function getSerializedScope(scope: string[]): string {
  if (scope.length === 0) return 'default';

  return scope.join('#');
}

export function getSerializedKeys(keys: string[]): string {
  if (keys.length === 0) return 'default';

  return keys.join('#');
}

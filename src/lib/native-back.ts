export type NativeBackAction = 'exit' | 'back' | 'minimize';

/** Decide how Android's system Back button should behave in the native shell. */
export function resolveNativeBackAction(pathname: string, canGoBack: boolean): NativeBackAction {
  if (pathname === '/') return 'exit';
  return canGoBack ? 'back' : 'minimize';
}

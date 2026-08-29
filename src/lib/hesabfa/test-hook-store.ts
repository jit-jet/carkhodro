import type { HesabfaWebhookPayload } from './types';

export type HesabfaTestHookStatus = 'received' | 'processed' | 'failed';

export interface HesabfaTestHookEvent {
  id: number;
  receivedAt: string;
  status: HesabfaTestHookStatus;
  payload: Omit<HesabfaWebhookPayload, 'Password'> & {
    Password?: '[redacted]';
  };
  result?: Record<string, unknown>;
  error?: string;
}

interface HesabfaTestHookStore {
  nextId: number;
  events: HesabfaTestHookEvent[];
}

const MAX_EVENTS = 200;

declare global {
  var __hesabfaTestHookStore: HesabfaTestHookStore | undefined;
}

function store(): HesabfaTestHookStore {
  globalThis.__hesabfaTestHookStore ??= { nextId: 1, events: [] };
  return globalThis.__hesabfaTestHookStore;
}

function publicPayload(
  payload: Partial<HesabfaWebhookPayload>,
): HesabfaTestHookEvent['payload'] {
  const { Password, ...rest } = payload;
  return {
    ...rest,
    ...(typeof Password === 'string' ? { Password: '[redacted]' as const } : {}),
  } as HesabfaTestHookEvent['payload'];
}

export function recordHesabfaTestHook(
  payload: Partial<HesabfaWebhookPayload>,
): HesabfaTestHookEvent {
  const state = store();
  const event: HesabfaTestHookEvent = {
    id: state.nextId++,
    receivedAt: new Date().toISOString(),
    status: 'received',
    payload: publicPayload(payload),
  };

  state.events.unshift(event);
  state.events.length = Math.min(state.events.length, MAX_EVENTS);
  return event;
}

export function finishHesabfaTestHook(
  id: number,
  update:
    | { status: 'processed'; result: Record<string, unknown> }
    | { status: 'failed'; error: string },
): void {
  const event = store().events.find((candidate) => candidate.id === id);
  if (event) Object.assign(event, update);
}

export function listHesabfaTestHooks(): HesabfaTestHookEvent[] {
  return store().events.map((event) => ({ ...event, payload: { ...event.payload } }));
}

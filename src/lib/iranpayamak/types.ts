/**
 * IranPayamak (FarazSMS) API envelope types.
 * @see https://docs.iranpayamak.com/
 */

export type ApiStatus = 'success' | 'error';

/** Docs allow string | string[] | record | null. */
export type ApiMessage =
  | string
  | string[]
  | Record<string, string | string[]>
  | null;

export interface ApiResult<T> {
  status: ApiStatus;
  data: T;
  messages: ApiMessage;
}

export interface PatternSendBody {
  code: string;
  recipient: string;
  attributes?: Record<string, string>;
  line_number: string;
  number_format: 'english ' | 'persian';
  schedule?: string | null;
}

export interface SimpleSendBody {
  text: string;
  line_number: string;
  recipients: string[];
  /** Docs example: english | persian */
  number_format: 'english' | 'persian';
  schedule: string | null;
}

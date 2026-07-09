/** Zibal IPG API types — https://help.zibal.ir/ipg/ */

export const ZIBAL_GATEWAY_BASE = 'https://gateway.zibal.ir';

/** Result code 100 = success for request / verify / inquiry. */
export const ZIBAL_RESULT_OK = 100;
/** Verify result 201 = transaction was already verified. */
export const ZIBAL_RESULT_ALREADY_VERIFIED = 201;

export interface ZibalRequestPayload {
  merchant: string;
  amount: number;
  callbackUrl: string;
  description?: string;
  orderId?: string;
  mobile?: string;
}

export interface ZibalRequestResponse {
  trackId?: number;
  result: number;
  message: string;
}

export interface ZibalVerifyPayload {
  merchant: string;
  trackId: number;
}

export interface ZibalVerifyResponse {
  paidAt?: string;
  cardNumber?: string;
  status?: number;
  amount?: number;
  refNumber?: number;
  description?: string;
  orderId?: string;
  result: number;
  message: string;
}

export interface ZibalCallbackParams {
  success: string | null;
  trackId: string | null;
  orderId: string | null;
  status: string | null;
}

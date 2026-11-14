export type ReceiptErrorCode = 'UNAUTHENTICATED' | 'FORBIDDEN' | 'VALIDATION' | 'INVALID_STATE' | 'STALE_REVISION' | 'IDEMPOTENCY_CONFLICT' | 'AMOUNT_EXCEEDS_AVAILABLE' | 'INVITE_INVALID' | 'HOUSEHOLD_FULL' | 'UPLOAD_INVALID' | 'BACKEND_UNAVAILABLE';

const messages: Record<ReceiptErrorCode, string> = {
  UNAUTHENTICATED: 'Please sign in again.',
  FORBIDDEN: 'You do not have access to this receipt.',
  VALIDATION: 'The request is invalid.',
  INVALID_STATE: 'The expense cannot be changed in its current state.',
  STALE_REVISION: 'The expense changed. Refresh it and try again.',
  IDEMPOTENCY_CONFLICT: 'This request key was already used for a different request.',
  AMOUNT_EXCEEDS_AVAILABLE: 'The amount exceeds the available balance.',
  INVITE_INVALID: 'The invitation is invalid or expired.',
  HOUSEHOLD_FULL: 'This household already has two parents.',
  UPLOAD_INVALID: 'Choose a JPG, PNG, or WEBP image no larger than 5 MiB.',
  BACKEND_UNAVAILABLE: 'The receipt service is temporarily unavailable. Please try again.',
};

export class ReceiptError extends Error {
  readonly code: ReceiptErrorCode;
  readonly status: number;
  constructor(code: ReceiptErrorCode, status?: number) {
    super(messages[code]);
    this.name = 'ReceiptError';
    this.code = code;
    this.status = status ?? (code === 'UNAUTHENTICATED' ? 401 : code === 'FORBIDDEN' ? 403 : code === 'BACKEND_UNAVAILABLE' ? 503 : ['INVALID_STATE', 'STALE_REVISION', 'IDEMPOTENCY_CONFLICT'].includes(code) ? 409 : 400);
  }
}

/** A recognized SQL exception means the RPC transaction was rejected, not an unknown transport outcome. */
export class RpcRejection extends ReceiptError {}

export function rpcError(value: unknown): ReceiptError {
  const message = typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string' ? value.message : '';
  const match = /^(UNAUTHENTICATED|FORBIDDEN|VALIDATION|INVALID_STATE|STALE_REVISION|IDEMPOTENCY_CONFLICT|AMOUNT_EXCEEDS_AVAILABLE|INVITE_INVALID|HOUSEHOLD_FULL|UPLOAD_INVALID|BACKEND_UNAVAILABLE)(?:\b|:)/.exec(message);
  return match ? new RpcRejection(match[1] as ReceiptErrorCode) : new ReceiptError('BACKEND_UNAVAILABLE');
}

import { ReceiptError } from '../_shared/errors.ts';
import { callRpc, defaultRuntime, handleReceiptRequest, isUuid, readBoundedBody, readJson, requestBackend, serve, serviceHeaders } from '../_shared/http.ts';
import type { ReceiptRuntime } from '../_shared/http.ts';

export async function handleAccess(request: Request, runtime: ReceiptRuntime = defaultRuntime): Promise<Response> {
  return handleReceiptRequest(request, runtime, async (context) => {
    if (!(request.headers.get('Content-Type') ?? '').toLowerCase().startsWith('application/json')) throw new ReceiptError('VALIDATION');
    const bytes = await readBoundedBody(request, 1024, 'VALIDATION');
    let input: unknown;
    try { input = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new ReceiptError('VALIDATION'); }
    if (typeof input !== 'object' || input === null || Array.isArray(input) || Object.keys(input).length !== 1 || !('receiptId' in input) || !isUuid(input.receiptId)) throw new ReceiptError('VALIDATION');
    const receipt = await callRpc<{ objectPath: string; mimeType: string }>(context, 'ledger_receipt_lookup', { p_actor_id: context.actorId, p_receipt_id: input.receiptId });
    if (!receipt || typeof receipt.objectPath !== 'string' || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(receipt.objectPath) || !['image/jpeg', 'image/png', 'image/webp'].includes(receipt.mimeType)) throw new ReceiptError('BACKEND_UNAVAILABLE');
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const response = await requestBackend(context, `${context.config.url}/storage/v1/object/sign/receipts/${receipt.objectPath}`, {
      method: 'POST', headers: { ...serviceHeaders(context.config), 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60 }),
    });
    if (!response.ok) throw new ReceiptError('BACKEND_UNAVAILABLE');
    const signed = await readJson(response);
    if (typeof signed !== 'object' || signed === null || !('signedURL' in signed) || typeof signed.signedURL !== 'string') throw new ReceiptError('BACKEND_UNAVAILABLE');
    const url = new URL(`${context.config.url}/storage/v1${signed.signedURL}`);
    if (!signed.signedURL.startsWith(`/object/sign/receipts/${receipt.objectPath}?`) || !url.searchParams.get('token')) throw new ReceiptError('BACKEND_UNAVAILABLE');
    return { url: url.href, expiresAt };
  });
}

serve(handleAccess);

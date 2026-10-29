// src/modules/merchant-payouts/payouts.controller.ts
import { Request, Response } from 'express';
import * as svc from './payouts.service';

export async function unsettled(req: Request, res: Response) {
  res.json({ data: await svc.listUnsettledOrders(req.params.merchantId) });
}
export async function balance(req: Request, res: Response) {
  res.json({ data: await svc.getBalance(req.params.merchantId) });
}
export async function createPayout(req: Request, res: Response) {
  res.status(201).json({ data: await svc.createPayout(req.auth!.sub, req.body) });
}
export async function markPaid(req: Request, res: Response) {
  res.json({ data: await svc.markPaid(req.auth!.sub, req.params.id, req.body.paymentReference) });
}
export async function cancelPayout(req: Request, res: Response) {
  res.json({ data: await svc.cancelPayout(req.auth!.sub, req.params.id) });
}

// src/modules/payments/payments.controller.ts
import { Request, Response } from 'express';
import * as service from './payments.service';

export async function listPayments(req: Request, res: Response) {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const payments = await service.listPayments(status);
  res.json({ success: true, data: payments });
}

export async function confirm(req: Request, res: Response) {
  const payment = await service.confirmBankTransfer(
    req.auth!.sub,
    req.params.id,
    req.body.reference,
  );
  res.json({ success: true, data: payment });
}

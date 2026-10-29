// src/modules/driver-payments/driver-payments.controller.ts
import { Request, Response } from 'express';
import * as svc from './driver-payments.service';

export async function generate(req: Request, res: Response) {
  res.status(201).json({ data: await svc.generate(req.auth!.sub, req.body) });
}

export async function pay(req: Request, res: Response) {
  res.json({ data: await svc.pay(req.auth!.sub, req.params.id, req.body.paymentReference) });
}

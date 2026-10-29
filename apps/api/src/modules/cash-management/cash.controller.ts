// src/modules/cash-management/cash.controller.ts
import { Request, Response } from 'express';
import * as svc from './cash.service';

export async function pendingCollections(req: Request, res: Response) {
  const limit = typeof req.query.limit === 'number' ? req.query.limit : undefined;
  const offset = typeof req.query.offset === 'number' ? req.query.offset : undefined;
  res.json({ data: await svc.listPendingCollections(req.auth!.sub, { limit, offset }) });
}

export async function handovers(req: Request, res: Response) {
  const limit = typeof req.query.limit === 'number' ? req.query.limit : undefined;
  const offset = typeof req.query.offset === 'number' ? req.query.offset : undefined;
  res.json({ data: await svc.listHandovers(req.auth!.sub, { limit, offset }) });
}

export async function createHandover(req: Request, res: Response) {
  res.status(201).json({ data: await svc.createHandover(req.auth!.sub, req.body.items) });
}

export async function verifyHandover(req: Request, res: Response) {
  const { amountVerified, notes } = req.body;
  res.json({ data: await svc.verifyHandover(req.auth!.sub, req.params.id, amountVerified, notes) });
}
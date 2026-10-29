// src/modules/drivers/driver.controller.ts
import { Request, Response } from 'express';
import * as service from './driver.service';
import * as cashService from '../cash-management/cash.service';

// Controllers are THIN: parse input → call service → send JSON. No business logic here.
export async function listMyOrders(req: Request, res: Response) {
  res.json({ data: await service.listMyOrders(req.auth!.sub) });
}

export async function getDriverOrder(req: Request, res: Response) {
  res.json({ data: await service.getOrderForDriver(req.auth!.sub, req.params.id) });
}

export async function advanceStatus(req: Request, res: Response) {
  res.json({ data: await service.advanceStatus(req.auth!.sub, req.params.id, req.body.status) });
}

export async function recordCashCollection(req: Request, res: Response) {
  res.status(201).json({
    data: await service.recordCashCollection(req.auth!.sub, req.params.id, req.body.amountCollected),
  });
}

export async function availableOrders(_req: Request, res: Response) {
  res.json({ data: await service.listAvailableOrders() });
}

export async function claimOrder(req: Request, res: Response) {
  res.json({ data: await service.claimOrder(req.auth!.sub, req.params.id) });
}

export async function weeklyPayments(req: Request, res: Response) {
  res.json({ data: await service.listWeeklyPayments(req.auth!.sub) });
}

export async function pendingCollections(req: Request, res: Response) {
  res.json({ data: await cashService.listPendingCollections(req.auth!.sub) });
}

export async function createHandover(req: Request, res: Response) {
  res.status(201).json({
    data: await cashService.createHandover(req.auth!.sub, req.body.items),
  });
}
import { Request, Response } from 'express';
import { OrderStatus } from '../../database/models/Order';
import * as svc from './orders.service';
import * as quoteSvc from './quote.service';
import * as checkoutSvc from './checkout.service';
import { listOrdersQuerySchema } from './orders.validation';

export async function quote(req: Request, res: Response) {
  const { lines, distanceKm } = req.body;
  res.json({ data: await quoteSvc.quote(req.auth!.sub, lines, distanceKm) });
}

export async function checkout(req: Request, res: Response) {
  const order = await checkoutSvc.checkout(req.auth!.sub, req.body);
  res.status(201).json({ data: order });
}

export async function getOrder(req: Request, res: Response) {
  res.json({ data: await svc.getOrderScoped(req.auth!, req.params.id) });
}

export async function listOrders(req: Request, res: Response) {
  const query = listOrdersQuerySchema.parse(req.query);
  res.json({ data: await svc.listAllOrders(query.status) });
}

export async function updateStatus(req: Request, res: Response) {
  const { status, cancellationReason } = req.body;
  res.json({ data: await svc.updateStatus(req.auth!.sub, req.params.id, status, cancellationReason) });
}

export async function assignDriver(req: Request, res: Response) {
  res.json({ data: await svc.assignDriver(req.params.id, req.body.driverId) });
}

export async function setDistance(req: Request, res: Response) {
  res.json({ data: await svc.setDeliveryDistance(req.auth!.sub, req.params.id, req.body.distanceKm) });
}
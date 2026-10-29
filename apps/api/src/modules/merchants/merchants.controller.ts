// src/modules/merchants/merchants.controller.ts
import { Request, Response } from 'express';
import { Merchant } from '../../database/models/Merchant';
import { CatalogItem } from '../../database/models/CatalogItem';
import { ApiError } from '../../utils/ApiError';
import { listMerchantsQuerySchema } from './merchants.validation';

export async function listMerchants(req: Request, res: Response) {
  const query = listMerchantsQuerySchema.parse(req.query);
  const where: any = {};

  // Public/Customer app only sees active merchants
  const isStaff = req.auth?.kind === 'staff';
  if (!isStaff) {
    where.status = 'active';
  }

  if (query.type) {
    where.merchantType = query.type;
  }
  if (query.partnerOnly === 'true') {
    where.isPartner = true;
  } else if (query.partnerOnly === 'false') {
    where.isPartner = false;
  }

  const merchants = await Merchant.findAll({
    where,
    order: [
      ['isPartner', 'DESC'],
      ['name', 'ASC'],
    ],
  });

  res.json({ success: true, data: merchants });
}

export async function getMerchant(req: Request, res: Response) {
  const merchant = await Merchant.findByPk(req.params.id);
  if (!merchant) throw ApiError.notFound('Merchant not found');

  // Enforce consistent public visibility: non-staff cannot view inactive merchants
  const isStaff = req.auth?.kind === 'staff';
  if (!isStaff && merchant.status !== 'active') {
    throw ApiError.notFound('Merchant not found');
  }

  res.json({ success: true, data: merchant });
}

export async function listMerchantItems(req: Request, res: Response) {
  const merchant = await Merchant.findByPk(req.params.id);
  if (!merchant) throw ApiError.notFound('Merchant not found');

  // Non-staff cannot retrieve catalog data of an inactive merchant
  const isStaff = req.auth?.kind === 'staff';
  if (!isStaff && merchant.status !== 'active') {
    throw ApiError.notFound('Merchant not found');
  }

  const where: any = { merchantId: req.params.id };
  if (!isStaff) {
    where.isAvailable = true;
  }

  const items = await CatalogItem.findAll({
    where,
    order: [['name', 'ASC']],
  });

  res.json({
    success: true,
    data: {
      merchant,
      items,
    },
  });
}

export async function createMerchant(req: Request, res: Response) {
  // Allowlisted creation from validated request body
  const {
    name,
    merchantType,
    storeType,
    description,
    phone,
    address,
    latitude,
    longitude,
    status,
    isPartner,
    partnerSince,
  } = req.body;

  const merchant = await Merchant.create({
    name,
    merchantType,
    storeType: storeType ?? null,
    description: description ?? null,
    phone: phone ?? null,
    address: address ?? null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    status: status ?? 'pending',
    isPartner: Boolean(isPartner),
    partnerSince: partnerSince ? new Date(partnerSince) : null,
  });

  res.status(201).json({ success: true, data: merchant });
}

export async function updateMerchant(req: Request, res: Response) {
  const merchant = await Merchant.findByPk(req.params.id);
  if (!merchant) throw ApiError.notFound('Merchant not found');

  const {
    name,
    merchantType,
    storeType,
    description,
    phone,
    address,
    latitude,
    longitude,
    status,
    isPartner,
    partnerSince,
  } = req.body;

  await merchant.update({
    ...(name !== undefined ? { name } : {}),
    ...(merchantType !== undefined ? { merchantType } : {}),
    ...(storeType !== undefined ? { storeType } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(address !== undefined ? { address } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(isPartner !== undefined ? { isPartner } : {}),
    ...(partnerSince !== undefined ? { partnerSince: partnerSince ? new Date(partnerSince) : null } : {}),
  });

  res.json({ success: true, data: merchant });
}

export async function createCatalogItem(req: Request, res: Response) {
  const { merchantId, name, description, imageUrl, currentPrice, isAvailable } = req.body;

  const merchant = await Merchant.findByPk(merchantId);
  if (!merchant) throw ApiError.notFound('Merchant not found for this catalog item');

  const item = await CatalogItem.create({
    merchantId,
    name,
    description: description ?? null,
    imageUrl: imageUrl ?? null,
    currentPrice,
    isAvailable: isAvailable ?? true,
  });

  res.status(201).json({ success: true, data: item });
}

export async function updateCatalogItem(req: Request, res: Response) {
  const item = await CatalogItem.findByPk(req.params.id);
  if (!item) throw ApiError.notFound('Catalog item not found');

  const { name, description, imageUrl, currentPrice, isAvailable } = req.body;

  await item.update({
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
    ...(currentPrice !== undefined ? { currentPrice } : {}),
    ...(isAvailable !== undefined ? { isAvailable } : {}),
  });

  res.json({ success: true, data: item });
}

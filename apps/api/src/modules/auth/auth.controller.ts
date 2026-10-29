// src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import * as authService from './auth.service';

/**
 * POST /api/v1/auth/telegram
 * Handles Telegram WebApp initData authentication for customers and drivers.
 */
export async function telegramLogin(req: Request, res: Response) {
  const result = await authService.authenticateTelegram(req.body);
  res.json({ data: result });
}

/**
 * POST /api/v1/auth/staff/login
 * Handles email + password authentication for operations staff (admin and finance).
 */
export async function staffLogin(req: Request, res: Response) {
  const result = await authService.authenticateStaff(req.body);
  res.json({ data: result });
}

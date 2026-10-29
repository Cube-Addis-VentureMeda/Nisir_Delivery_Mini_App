// src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import { ApiError } from '../../utils/ApiError';
import { signToken } from '../../utils/jwt';
import { Customer } from '../../database/models/Customer';
import { Driver } from '../../database/models/Driver';
import { StaffUser } from '../../database/models/StaffUser';
import { verifyTelegramInitData, extractChatId } from './telegram.service';
import { TelegramLoginInput, StaffLoginInput } from './auth.validation';

export interface CustomerAuthDto {
  id: string;
  telegramUserId: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  status: string;
}

export interface DriverAuthDto {
  id: string;
  fullName: string;
  phone: string;
  status: string;
}

export interface StaffAuthDto {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'finance';
}

export interface AuthResult<T> {
  token: string;
  role: 'customer' | 'driver' | 'staff';
  user: T;
}

/**
 * Authenticates Telegram Mini App users (Customer or Driver).
 */
export async function authenticateTelegram(dto: TelegramLoginInput) {
  const { initData, role } = dto;
  const { telegramUserId, firstName } = verifyTelegramInitData(initData);

  if (role === 'driver') {
    // Driver accounts must be pre-registered by admin/operations
    const driver = await Driver.findOne({ where: { telegramUserId } });
    if (!driver) {
      throw new ApiError(
        403,
        'NOT_REGISTERED',
        'No driver account is linked to this Telegram user. Contact operations.',
      );
    }

    if (driver.status !== 'active') {
      throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Driver account is suspended');
    }

    // Safely extract chat ID and update atomically if not set
    const chatId = extractChatId(initData);
    if (chatId && driver.telegramChatId !== chatId) {
      await Driver.update(
        { telegramChatId: chatId },
        { where: { id: driver.id } },
      );
    }

    const token = signToken({ sub: String(driver.id), kind: 'driver' });
    const driverDto: DriverAuthDto = {
      id: String(driver.id),
      fullName: driver.fullName,
      phone: driver.phone,
      status: driver.status,
    };

    return {
      token,
      role: 'driver' as const,
      driver: driverDto,
    };
  }

  // ── Customer flow ──
  const [customer] = await Customer.findOrCreate({
    where: { telegramUserId },
    defaults: { telegramUserId, firstName },
  });

  if (customer.status !== 'active') {
    throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'This account is suspended');
  }

  const token = signToken({ sub: String(customer.id), kind: 'customer' });
  const customerDto: CustomerAuthDto = {
    id: String(customer.id),
    telegramUserId: customer.telegramUserId,
    firstName: customer.firstName,
    lastName: customer.lastName ?? null,
    phone: customer.phone ?? null,
    status: customer.status,
  };

  return {
    token,
    role: 'customer' as const,
    customer: customerDto,
  };
}

/**
 * Authenticates staff with email and password.
 */
export async function authenticateStaff(dto: StaffLoginInput) {
  const email = dto.email.trim().toLowerCase();
  const staff = await StaffUser.findOne({ where: { email } });

  if (!staff || !(await bcrypt.compare(dto.password, staff.passwordHash))) {
    throw new ApiError(401, 'AUTH_FAILED', 'Invalid email or password');
  }

  if (staff.status !== 'active') {
    throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Staff account is suspended');
  }

  // Enforce defined staff roles: admin | finance
  const staffRole = staff.role as 'admin' | 'finance';
  const token = signToken({ sub: String(staff.id), kind: 'staff', role: staffRole });

  const staffDto: StaffAuthDto = {
    id: String(staff.id),
    fullName: staff.fullName,
    email: staff.email,
    role: staffRole,
  };

  return {
    token,
    staff: staffDto,
  };
}

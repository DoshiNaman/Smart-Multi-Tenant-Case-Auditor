import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';

interface SeedFirm {
  name: string;
  slug: string;
  users: Array<{
    email: string;
    name: string;
    role: UserRole;
    password: string;
  }>;
}

const FIRMS: SeedFirm[] = [
  {
    name: 'Acme Legal',
    slug: 'acme-legal',
    users: [
      {
        email: 'partner@acme.test',
        name: 'Alice Acme (Partner)',
        role: UserRole.Partner,
        password: 'password123',
      },
      {
        email: 'associate@acme.test',
        name: 'Andy Acme (Associate)',
        role: UserRole.Associate,
        password: 'password123',
      },
    ],
  },
  {
    name: 'Brightline LLP',
    slug: 'brightline-llp',
    users: [
      {
        email: 'partner@brightline.test',
        name: 'Bea Brightline (Partner)',
        role: UserRole.Partner,
        password: 'password123',
      },
      {
        email: 'associate@brightline.test',
        name: 'Ben Brightline (Associate)',
        role: UserRole.Associate,
        password: 'password123',
      },
    ],
  },
];

async function run() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const tenants = app.get(TenantsService);
    const users = app.get(UsersService);

    for (const firm of FIRMS) {
      const tenant = await tenants.createIfMissing(firm.name, firm.slug);
      logger.log(`Tenant: ${tenant.name} (${tenant.slug})`);

      for (const u of firm.users) {
        await users.createIfMissing({
          tenantId: tenant._id,
          email: u.email,
          password: u.password,
          name: u.name,
          role: u.role,
        });
        logger.log(`  └─ User: ${u.email} [${u.role}]`);
      }
    }

    logger.log('Seed completed successfully');
    logger.log('Demo credentials (password: password123):');
    for (const firm of FIRMS) {
      for (const u of firm.users) {
        logger.log(`  ${u.email}  →  ${firm.name} / ${u.role}`);
      }
    }
  } catch (err) {
    logger.error('Seed failed', err instanceof Error ? err.stack : err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void run();

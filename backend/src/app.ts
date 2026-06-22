import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

import { env } from '@/config/env';
import { swaggerSpec } from '@/config/swagger';
import { notFoundHandler, errorHandler } from '@/middlewares/errorHandler';

import authRoutes from '@/modules/auth/auth.routes';
import organizationRoutes from '@/modules/organizations/organization.routes';
import userRoutes from '@/modules/users/user.routes';
import clientRoutes from '@/modules/clients/client.routes';
import serviceRoutes from '@/modules/services/service.routes';
import quoteRoutes from '@/modules/quotes/quote.routes';
import activityRoutes from '@/modules/activities/activity.routes';
import reminderRoutes from '@/modules/reminders/reminder.routes';
import notificationRoutes from '@/modules/notifications/notification.routes';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';
import aiRoutes from '@/modules/ai/ai.routes';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isProd ? 'combined' : 'dev'));

const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Archivos estáticos (logos, firmas, PDFs) cuando STORAGE_DRIVER=local
app.use('/uploads', express.static(path.join(process.cwd(), env.storage.localPath)));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const apiV1 = express.Router();
apiV1.use('/auth', authRoutes);
apiV1.use('/organizations', organizationRoutes);
apiV1.use('/users', userRoutes);
apiV1.use('/clients', clientRoutes);
apiV1.use('/services', serviceRoutes);
apiV1.use('/quotes', quoteRoutes);
apiV1.use('/activities', activityRoutes);
apiV1.use('/reminders', reminderRoutes);
apiV1.use('/notifications', notificationRoutes);
apiV1.use('/dashboard', dashboardRoutes);
apiV1.use('/ai', aiRoutes);

app.use('/api/v1', apiV1);

app.use(notFoundHandler);
app.use(errorHandler);

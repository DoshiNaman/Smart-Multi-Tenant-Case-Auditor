import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigModule } from '../config/app-config.module';
import { AppConfigService } from '../config/app-config.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const logger = new Logger('MongooseModule');
        return {
          uri: config.mongodbUri,
          autoIndex: !config.isProduction,
          connectionFactory: (connection: {
            on: (event: string, cb: (err?: unknown) => void) => void;
          }) => {
            connection.on('connected', () =>
              logger.log('MongoDB connection established'),
            );
            connection.on('disconnected', () =>
              logger.warn('MongoDB connection lost'),
            );
            connection.on('error', (err) =>
              logger.error('MongoDB connection error', err),
            );
            return connection;
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}

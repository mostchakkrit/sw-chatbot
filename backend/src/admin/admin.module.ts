import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ConversationsController } from './conversations/conversations.controller';
import { ConversationsService } from './conversations/conversations.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AuthController, ConversationsController],
  providers: [AuthService, JwtAuthGuard, ConversationsService],
})
export class AdminModule {}

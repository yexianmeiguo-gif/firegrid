import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EquipmentModule } from './equipment/equipment.module';
import { TendersModule } from './tenders/tenders.module';
import { AIModule } from './ai/ai.module';
import { ArticlesModule } from './articles/articles.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EquipmentModule,
    TendersModule,
    AIModule,
    ArticlesModule,
  ],
})
export class AppModule {}
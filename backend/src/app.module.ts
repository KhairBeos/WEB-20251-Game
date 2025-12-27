import { Module } from '@nestjs/common';
import { CatsController } from './cat.controller';
import { GameModule } from './websockets/game.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GameModule,
    AuthModule,
  ],
  controllers: [CatsController],
  providers: [],
})
export class AppModule {}

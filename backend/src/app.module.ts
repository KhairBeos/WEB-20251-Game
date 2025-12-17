import { Module } from '@nestjs/common';
import { CatsController } from './cat.controller';
import { GameModule } from './websockets/game.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GameModule,
  ],
  controllers: [CatsController],
  providers: [],
})
export class AppModule {}

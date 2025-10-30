import { Module } from '@nestjs/common';
import { CatsController } from './cat.controller';
import { GameModule } from './websockets/game.module';

@Module({
  imports: [GameModule],
  controllers: [CatsController],
  providers: [],
})
export class AppModule {}

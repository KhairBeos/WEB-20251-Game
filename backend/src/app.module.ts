import { Module } from '@nestjs/common';
import { CatsController } from './cat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GameModule } from './websockets/game.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule
      useFactory: (configService: ConfigService) => ({
        // Lấy link database từ file .env
        uri: configService.get<string>('DATABASE_URL')!,
      }),
      inject: [ConfigService], // Tiêm ConfigService vào factory
    }),
    AuthModule,
    UserModule,
    GameModule],
  controllers: [CatsController],
  providers: [],
})
export class AppModule {}

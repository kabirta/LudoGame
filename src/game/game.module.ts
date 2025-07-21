import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { Game } from './entities/game.entity';
import { Player } from './entities/player.entity';
import { GameGateway } from './game.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Player])],
  controllers: [GameController],
  providers: [GameService, GameGateway],
})
export class GameModule {}

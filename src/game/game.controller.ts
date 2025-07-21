import { Controller, Post, Body } from '@nestjs/common';
import { GameService } from './game.service';

class JoinMatchmakingDto {
  name: string;
  phoneNumber: string;
}

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('matchmaking')
  async joinMatchmaking(@Body() joinMatchmakingDto: JoinMatchmakingDto) {
    return this.gameService.joinMatchmaking(joinMatchmakingDto);
  }
}

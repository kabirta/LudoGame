import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { Player } from './entities/player.entity';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';

@Injectable()
export class GameService {
  private twilioClient: Twilio.Twilio;

  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    private configService: ConfigService,
  ) {
    this.twilioClient = Twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN'),
    );
  }

  async joinMatchmaking(playerData: { name: string; phoneNumber: string }): Promise<Player> {
    // Create new player
    const player = this.playerRepository.create(playerData);
    await this.playerRepository.save(player);

    // Find another unmatched player
    const unmatchedPlayer = await this.playerRepository.findOne({
      where: { isMatched: false, id: player.id },
    });

    if (unmatchedPlayer) {
      // Create a new game with both players
      const game = this.gameRepository.create({
        player1Id: unmatchedPlayer.id,
        player2Id: player.id,
        status: 'waiting',
      });
      await this.gameRepository.save(game);

      // Mark both players as matched
      unmatchedPlayer.isMatched = true;
      player.isMatched = true;
      await this.playerRepository.save([unmatchedPlayer, player]);

      return player;
    }

    // If no match found, send SMS
    await this.sendNoMatchSMS(player.phoneNumber);
    return player;
  }

  private async sendNoMatchSMS(phoneNumber: string) {
    try {
      await this.twilioClient.messages.create({
        body: 'No opponent found at the moment. Please try again later.',
        to: phoneNumber,
        from: this.configService.get('TWILIO_PHONE_NUMBER'),
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  }
}

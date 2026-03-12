import { Module } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import { MatchmakingController } from './matchmaking.controller';

@Module({
  providers: [MatchmakingService],
  controllers: [MatchmakingController],
})
export class MatchmakingModule {}
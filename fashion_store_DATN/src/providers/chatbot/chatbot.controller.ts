import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ChatbotService } from '@providers/chatbot/chatbot.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatBotDto } from '@providers/chatbot/dto/chatbot.dto';
import { OptionalAuthGuard } from '@modules/auth/optional-auth.guard';

@ApiBearerAuth()
@UseGuards(OptionalAuthGuard)
@ApiTags('CHATBOT')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async sendMessage(@Body() dto: ChatBotDto, @Req() req: any) {
    console.log(req.user);
    const sessionId = req.user?.sub
      ? `user:${req.user.sub}`
      : `guest:${dto.guestId}`;
    const response = await this.chatbotService.sendMessage(
      sessionId,
      dto.message,
    );
    return { response };
  }
}

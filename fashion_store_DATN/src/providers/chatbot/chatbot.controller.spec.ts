// TC-BE-CHATBOT-CTRL: Unit tests for ChatbotController

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

describe('ChatbotController', () => {
  let controller: ChatbotController;
  const mockService = { sendMessage: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatbotController],
      providers: [{ provide: ChatbotService, useValue: mockService }],
    }).compile();

    controller = module.get<ChatbotController>(ChatbotController);
    jest.clearAllMocks();
  });

  // TC-BE-CHATBOT-CTRL-01
  it('should call sendMessage with user session when req.user.sub present', async () => {
    mockService.sendMessage.mockResolvedValue('ANS');
    const dto = { message: 'hello', guestId: 'g1' } as any;
    const req = { user: { sub: 42 } } as any;

    const res = await controller.sendMessage(dto, req);
    expect(mockService.sendMessage).toHaveBeenCalledWith('user:42', 'hello');
    expect(res).toEqual({ response: 'ANS' });
  });

  // TC-BE-CHATBOT-CTRL-02
  it('should call sendMessage with guest session when no user', async () => {
    mockService.sendMessage.mockResolvedValue('GANS');
    const dto = { message: 'hi', guestId: 'guest123' } as any;
    const req = {} as any;

    const res = await controller.sendMessage(dto, req);
    expect(mockService.sendMessage).toHaveBeenCalledWith('guest:guest123', 'hi');
    expect(res).toEqual({ response: 'GANS' });
  });

  // TC-BE-CHATBOT-CTRL-03
  it('should propagate errors from service', async () => {
    mockService.sendMessage.mockRejectedValue(new Error('Service fail'));
    const dto = { message: 'x', guestId: 'g' } as any;
    const req = {} as any;
    await expect(controller.sendMessage(dto, req)).rejects.toThrow('Service fail');
  });

  // TC-BE-CHATBOT-CTRL-04
  it('should build guest session when guestId missing (negative)', async () => {
    const dto = { message: 'hi' } as any;
    const req = {} as any;
    await expect(controller.sendMessage(dto, req)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockService.sendMessage).not.toHaveBeenCalled();
  });
});

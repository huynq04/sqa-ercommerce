import { Injectable, HttpException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { config } from '@config';
import { ChatbotRagService } from '@providers/chatbot/chatbot.rag.service';
import { RedisService } from '@base/db/redis/redis.service';

@Injectable()
export class ChatbotService {
  private readonly apiKey = config.CHATBOT.API_KEY;
  private readonly axiosInstance: AxiosInstance;

  constructor(
    private readonly ragService: ChatbotRagService,
    private readonly redisService: RedisService,
  ) {
    this.axiosInstance = axios.create({
      baseURL: config.CHATBOT.CHATBOT_URL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(sessionId: string, userMessage: string): Promise<string> {
    try {
      const redisKey = `chat:${sessionId}`;
      const history =
        (await this.redisService.get<
          { role: 'user' | 'assistant'; content: string }[]
        >(redisKey)) || [];
      const context = await this.ragService.getRelevantContext(userMessage);
      console.log(history);

      const response = await this.axiosInstance.post('/chat/completions', {
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Bạn là chatbot tư vấn sản phẩm cho shop Fashion Store. 
            Dưới đây là thông tin nội bộ của shop (sản phẩm, chính sách...):
            ${context}
            
            Nếu thông tin không có trong dữ liệu, hãy trả lời:
            "Xin lỗi, hiện tôi chưa có thông tin này."`,
          },
          ...history,
          { role: 'user', content: userMessage },
        ],
      });

      // return response.data.choices[0].message.content;
      const answer = response.data.choices[0].message.content;
      const newHistory = [
        ...history,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: answer },
      ].slice(-10);

      await this.redisService.set(redisKey, newHistory, 60 * 1000);

      return answer;
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      throw new HttpException('Failed to call Gemini API', 500);
    }
  }
}

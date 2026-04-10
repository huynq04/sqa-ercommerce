# Chatbot với Vector Search (RAG)

## Tổng quan

Chatbot sử dụng RAG (Retrieval Augmented Generation) với Vector Search để tìm kiếm sản phẩm và chính sách dựa trên ngữ nghĩa thay vì từ khóa chính xác.

**Sử dụng Gemini Embedding API** (`gemini-embedding-001`) - cùng API key với chatbot để đồng bộ và đơn giản hóa.

## Setup

### 1. Cài đặt Gemini API Key

Đảm bảo đã có Gemini API key trong file `.env` (cùng key với chatbot):

```env
API_KEY=your_gemini_api_key_here
CHATBOT_URL=https://generativelanguage.googleapis.com/v1beta
```

**Lưu ý**: Không cần API key riêng cho embeddings, dùng chung API key với chatbot!

### 2. Generate Embeddings cho dữ liệu hiện có

Chạy script để generate embeddings cho tất cả products và policies:

```bash
# Build project
npm run build

# Run script
node dist/src/providers/chatbot/scripts/generate-embeddings.js
```

Hoặc dùng ts-node:

```bash
npx ts-node src/providers/chatbot/scripts/generate-embeddings.ts
```

### 3. Migration Database

Entity `AiVector` đã được cập nhật. Cần chạy migration để cập nhật database schema:

- Thêm cột `type` (enum: 'product', 'policy')
- Thêm cột `entity_id` (int)
- Thêm cột `content` (text)
- Cập nhật cột `vector` (json)
- Thêm unique index trên (`type`, `entity_id`)

## Cách hoạt động

1. **Embedding**: Khi user hỏi, câu hỏi được convert thành embedding vector
2. **Vector Search**: So sánh embedding của câu hỏi với embeddings của products/policies trong DB
3. **Cosine Similarity**: Tính độ tương đồng (0-1) giữa các vectors
4. **Retrieval**: Lấy top K results có similarity cao nhất
5. **Generation**: Đưa context vào LLM (Gemini) để generate câu trả lời

## Tự động tạo embeddings

Khi tạo/sửa product hoặc policy, cần gọi:

```typescript
// Trong AdminProductService hoặc AdminPolicyService
await vectorSearchService.upsertProductVector(product);
await vectorSearchService.upsertPolicyVector(policy);
```

## API

### POST /api/v1/chatbot/message

```json
{
  "message": "có áo thun nam không"
}
```

Response:
```json
{
  "response": "Có, chúng tôi có nhiều áo thun nam..."
}
```

## Tuning

- **minSimilarity**: Điều chỉnh ngưỡng similarity (mặc định: 0.6) trong `ChatbotRagService`
- **limit**: Số lượng results tối đa (mặc định: 5)
- **Embedding Model**: Đang dùng `gemini-embedding-001` - model embedding chuyên dụng của Google

## Lưu ý

- **Gemini API** có rate limits, script đã tự động delay giữa các requests khi generate embeddings
- Với dữ liệu lớn (>10k vectors), nên xem xét dùng vector database (Pinecone, Weaviate, pgvector)
- **Cost**: Gemini Embedding miễn phí trong free tier, rất rẻ trong paid tier
- **Multilingual**: Gemini Embedding hỗ trợ hơn 100 ngôn ngữ, rất tốt cho tiếng Việt
- **Token limit**: Gemini Embedding hỗ trợ tối đa 2048 tokens (~8000 ký tự) cho mỗi text

## Ưu điểm của Gemini Embedding

✅ **Đồng bộ**: Dùng chung API key với chatbot (Gemini)  
✅ **Multilingual**: Hỗ trợ tốt tiếng Việt và hơn 100 ngôn ngữ  
✅ **Hiệu suất cao**: Được đánh giá cao trên MTEB Multilingual benchmark  
✅ **Miễn phí**: Free tier rộng rãi  
✅ **Đơn giản**: Không cần setup phức tạp


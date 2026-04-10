# Fashion Store E-Commerce Platform

Dự án thương mại điện tử thời trang sử dụng NestJS (Backend) và React (Frontend).

## Công nghệ sử dụng

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: MySQL 8.0
- **Cache**: Redis 7.2
- **Storage**: MinIO (S3-compatible)
- **ORM**: TypeORM

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM

## Yêu cầu hệ thống

- Node.js >= 18.x
- Docker và Docker Compose
- npm hoặc yarn

## Hướng dẫn cài đặt và chạy dự án

### Bước 1: Khởi động các services với Docker

Khởi động MySQL, Redis và MinIO bằng Docker Compose:

```bash
# Di chuyển đến thư mục backend
cd fashion_store_DATN

# Khởi động các services
docker-compose up -d

# Kiểm tra trạng thái các container
docker-compose ps
```

Các services sẽ chạy trên các port sau:
- **MySQL**: `localhost:3306`
- **Redis**: `localhost:6379`
- **MinIO**: `localhost:9000` (API), `localhost:9001` (Console)

Thông tin đăng nhập:
- **MySQL**:
  - User: `root`
  - Password: `12345678`
  - Database: `fashion_store_finals`
- **MinIO**:
  - User: `ROOTUSER`
  - Password: `CHANGEME123`

### Bước 2: Import dữ liệu SQL vào MySQL

Có 3 cách để import file `data.sql` vào MySQL đang chạy trong Docker:

#### Cách 1: Sử dụng docker exec (Khuyên dùng)

```bash
# Copy file SQL vào container
docker cp data.sql mysql:/tmp/data.sql

# Import SQL vào database
docker exec -i mysql mysql -uroot -p12345678 fashion_store_finals < data.sql

# Hoặc trực tiếp import mà không cần copy
cat data.sql | docker exec -i mysql mysql -uroot -p12345678 fashion_store_finals
```

#### Cách 2: Sử dụng MySQL Client bên ngoài

```bash
# Đảm bảo bạn đã cài đặt mysql-client (macOS)
brew install mysql-client

# Import SQL
mysql -h 127.0.0.1 -P 3306 -uroot -p12345678 fashion_store_finals < data.sql
```

#### Cách 3: Vào MySQL Shell trong container

```bash
# Vào MySQL shell
docker exec -it mysql mysql -uroot -p12345678 fashion_store_finals

# Trong MySQL shell, chạy:
SOURCE /tmp/data.sql;

# Hoặc
\. /tmp/data.sql

# Thoát MySQL shell
exit;
```

#### Kiểm tra dữ liệu đã import

```bash
# Vào MySQL shell
docker exec -it mysql mysql -uroot -p12345678 fashion_store_finals

# Kiểm tra các bảng
SHOW TABLES;

# Kiểm tra dữ liệu mẫu
SELECT * FROM users LIMIT 5;

# Thoát
exit;
```

### Bước 3: Cài đặt dependencies cho Backend

```bash
# Đảm bảo đang ở thư mục backend
cd fashion_store_DATN

# Cài đặt packages
npm install

# Hoặc sử dụng yarn
yarn install
```

### Bước 4: Cấu hình môi trường Backend

Tạo file `.env` trong thư mục `fashion_store_DATN`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=12345678
DB_NAME=fashion_store_finals

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO/S3
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=ROOTUSER
MINIO_SECRET_KEY=CHANGEME123
MINIO_BUCKET=fashion-store

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

### Bước 5: Chạy Backend Server

```bash
# Development mode với hot reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

Backend sẽ chạy tại: `http://localhost:3000`

API Documentation (Swagger): `http://localhost:3000/api`

### Bước 6: Cài đặt và chạy Frontend

```bash
# Di chuyển đến thư mục frontend
cd ../e-commerce-fashion-shop

# Cài đặt packages
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## Project setup

## Các lệnh hữu ích

### Docker Commands

```bash
# Khởi động tất cả services
docker-compose up -d

# Dừng tất cả services
docker-compose down

# Xem logs
docker-compose logs -f

# Xem logs của một service cụ thể
docker-compose logs -f mysql

# Restart một service
docker-compose restart mysql

# Xóa tất cả volumes (CẢNH BÁO: Mất hết dữ liệu)
docker-compose down -v
```

### Backend Development

```bash
# Cài đặt dependencies
npm install

# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Frontend Development

```bash
# Cài đặt dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Xử lý sự cố

### MySQL không kết nối được

```bash
# Kiểm tra container MySQL có chạy không
docker ps | grep mysql

# Kiểm tra logs
docker logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Port đã được sử dụng

```bash
# Kiểm tra port nào đang được sử dụng (macOS)
lsof -i :3306  # MySQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# Kill process đang sử dụng port
kill -9 <PID>
```

### Import SQL bị lỗi

```bash
# Kiểm tra encoding của file SQL
file -I data.sql

# Convert encoding nếu cần (UTF-8)
iconv -f ISO-8859-1 -t UTF-8 data.sql > data_utf8.sql

# Import lại file đã convert
cat data_utf8.sql | docker exec -i mysql mysql -uroot -p12345678 fashion_store_finals
```

### Reset toàn bộ database

```bash
# Dừng và xóa tất cả volumes
docker-compose down -v

# Khởi động lại
docker-compose up -d

# Đợi MySQL khởi động hoàn toàn (khoảng 30 giây)
sleep 30

# Import lại dữ liệu
cat data.sql | docker exec -i mysql mysql -uroot -p12345678 fashion_store_finals
```

## Cấu trúc dự án

### Backend (fashion_store_DATN)

```
src/
├── base/                 # Base classes và utilities
│   ├── db/              # Database configurations
│   ├── dtos/            # Data Transfer Objects
│   ├── exception/       # Custom exceptions
│   ├── filters/         # Exception filters
│   ├── interceptors/    # Response interceptors
│   ├── logging/         # Logging service
│   ├── mail/            # Email service
│   ├── middleware/      # Custom middlewares
│   ├── s3/              # MinIO/S3 service
│   └── utils/           # Utility functions
├── config/              # Configuration modules
├── modules/             # Feature modules
│   ├── auth/           # Authentication
│   ├── ecommerce/      # E-commerce features
│   └── user/           # User management
└── providers/           # External providers
    ├── chatbot/        # Chatbot integration
    ├── ghn/            # GHN shipping
    └── vnpay/          # VNPay payment
```

### Frontend (e-commerce-fashion-shop)

```
src/
├── api/                # API service layer
├── assets/             # Static assets
├── components/         # Reusable components
├── pages/              # Page components
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## API Documentation

Sau khi khởi động backend, truy cập Swagger UI tại:

```
http://localhost:3000/apidoc

tk=admin
mk=FASHION@2025
```

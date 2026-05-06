import { Test, TestingModule } from '@nestjs/testing';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

jest.mock('crypto', () => {
  const actualCrypto = jest.requireActual('crypto') as typeof import('crypto');
  return {
    ...actualCrypto,
    randomUUID: jest.fn(() => 'fixed-uuid-123'),
  };
});

import { UploadService } from './s3.service';

describe('UploadService', () => {
  let service: UploadService;

  type UploadTestFile = Parameters<UploadService['uploadFile']>[0];

  // Mock S3 client de unit test khong phu thuoc network hay MinIO that.
  const s3ClientMock = {
    send: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const buildMockFile = (overrides: Partial<UploadTestFile> = {}) => {
    return {
      fieldname: 'file',
      originalname: 'product-image.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 128,
      destination: '',
      filename: '',
      path: '',
      stream: undefined as any,
      buffer: Buffer.from('dummy-file-content'),
      ...overrides,
    } as UploadTestFile;
  };

  beforeEach(async () => {
    // Lam sach lich su mock truoc moi testcase.
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: 'S3_CLIENT',
          useValue: s3ClientMock,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    // Rollback mock state sau moi testcase.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_S3_SERVICE_001
  it('[TC_S3_SERVICE_001] uploadFile phải gọi S3 PutObjectCommand đúng payload và trả về fileUrl hợp lệ', async () => {
    const file = buildMockFile();

    const expectedKey = 'uploads/fixed-uuid-123-product-image.png';

    const expectedBucket = 'sqa-ercommerce';

    s3ClientMock.send.mockResolvedValue({ ETag: 'etag-001' });

    const result = await service.uploadFile(file);

    // Assert flow execution
    expect(s3ClientMock.send).toHaveBeenCalledTimes(1);

    const commandArg = s3ClientMock.send.mock
      .calls[0][0] as PutObjectCommand & {
      input?: Record<string, any>;
    };

    expect(commandArg).toBeInstanceOf(PutObjectCommand);

    // verify payload gửi lên S3 đúng cấu trúc
    expect(commandArg.input).toEqual({
      Bucket: expectedBucket,
      Key: expectedKey,
      Body: file.buffer,
      ContentType: 'image/png',
    });

    expect(result).toEqual({
      message: 'Upload success',
      fileUrl: `http://34.87.35.175:9000/${expectedBucket}/${expectedKey}`,
    });
  });

  // Test Case ID: TC_S3_SERVICE_002
  it('[TC_S3_SERVICE_002] uploadFile phải giữ nguyên originalname trong S3 key (uuid + filename)', async () => {
    const originalName = 'ao-khoac-mua-dong.jpg';

    const file = buildMockFile({
      originalname: originalName,
    });

    const expectedKey = 'uploads/fixed-uuid-123-ao-khoac-mua-dong.jpg';

    s3ClientMock.send.mockResolvedValue({});

    const result = await service.uploadFile(file);

    // Assert flow execution
    expect(s3ClientMock.send).toHaveBeenCalledTimes(1);

    const commandArg = s3ClientMock.send.mock
      .calls[0][0] as PutObjectCommand & {
      input?: Record<string, any>;
    };

    // verify key giữ nguyên original filename
    expect(commandArg.input?.Key).toBe(expectedKey);

    // Assert output consistency
    expect(result.fileUrl).toContain(expectedKey);
  });

  // Test Case ID: TC_S3_SERVICE_003
  it('[TC_S3_SERVICE_003] uploadFile phải throw lỗi khi S3 client send thất bại', async () => {
    const file = buildMockFile();

    const s3Error = new Error('S3 unavailable');
    s3ClientMock.send.mockRejectedValue(s3Error);

    await expect(service.uploadFile(file)).rejects.toThrow('S3 unavailable');

    // verify S3 vẫn được gọi 1 lần trước khi fail
    expect(s3ClientMock.send).toHaveBeenCalledTimes(1);
  });
});

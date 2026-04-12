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
  it('uploadFile gui PutObjectCommand dung payload va tra ve fileUrl', async () => {
    // Muc tieu: xac minh luong upload thanh cong.
    // Input: file hop le voi originalname/buffer/mimetype.
    // Ky vong:
    // - s3Client.send duoc goi voi PutObjectCommand dung Bucket/Key/Body/ContentType
    // - tra ve message + fileUrl dung key da tao.
    const file = buildMockFile();
    s3ClientMock.send.mockResolvedValue({ ETag: 'etag-001' });

    const result = await service.uploadFile(file);

    expect(s3ClientMock.send).toHaveBeenCalledTimes(1);
    const commandArg = s3ClientMock.send.mock
      .calls[0][0] as PutObjectCommand & {
      input?: Record<string, any>;
    };

    expect(commandArg).toBeInstanceOf(PutObjectCommand);
    // CheckDB/ExternalCall: xac minh payload gui len S3 dung theo yeu cau.
    expect(commandArg.input).toEqual({
      Bucket: 'sqa-ercommerce',
      Key: 'uploads/fixed-uuid-123-product-image.png',
      Body: file.buffer,
      ContentType: 'image/png',
    });

    expect(result).toEqual({
      message: 'Upload success',
      fileUrl:
        'http://34.87.35.175:9000/sqa-ercommerce/uploads/fixed-uuid-123-product-image.png',
    });
  });

  // Test Case ID: TC_S3_SERVICE_002
  it('uploadFile van giu nguyen ten file goc trong key', async () => {
    // Muc tieu: bao phu quy tac tao key gom uuid + originalname.
    const file = buildMockFile({ originalname: 'ao-khoac-mua-dong.jpg' });
    s3ClientMock.send.mockResolvedValue({});

    const result = await service.uploadFile(file);

    const commandArg = s3ClientMock.send.mock
      .calls[0][0] as PutObjectCommand & {
      input?: Record<string, any>;
    };
    expect(commandArg.input?.Key).toBe(
      'uploads/fixed-uuid-123-ao-khoac-mua-dong.jpg',
    );
    expect(result.fileUrl).toContain(
      'uploads/fixed-uuid-123-ao-khoac-mua-dong.jpg',
    );
  });

  // Test Case ID: TC_S3_SERVICE_003
  it('uploadFile throw lai loi khi S3 client send that bai', async () => {
    // Muc tieu: dam bao service khong nuot loi tu S3.
    // Input: s3Client.send reject.
    // Ky vong: exception duoc throw ra cho layer tren xu ly.
    const file = buildMockFile();
    s3ClientMock.send.mockRejectedValue(new Error('S3 unavailable'));

    await expect(service.uploadFile(file)).rejects.toThrow('S3 unavailable');
  });
});

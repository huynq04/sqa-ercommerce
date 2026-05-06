import { Test, TestingModule } from '@nestjs/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { UploadController } from './s3.controller';
import { UploadService } from './s3.service';

describe('UploadController', () => {
  let controller: UploadController;

  const uploadServiceMock = {
    uploadFile: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  type UploadTestFile = Parameters<UploadService['uploadFile']>[0];

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
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: uploadServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  afterEach(() => {
    // Rollback mock state sau moi testcase.
    jest.restoreAllMocks();
  });

  // Test Case ID: TC_S3_CONTROLLER_001
  it('[TC_S3_CONTROLLER_001] upload gọi UploadService.uploadFile đúng tham số và trả về kết quả', async () => {
    const file = buildMockFile();

    const serviceResult = {
      message: 'Upload success',
      fileUrl: 'http://example.com/bucket/uploads/abc.png',
    };

    uploadServiceMock.uploadFile.mockResolvedValue(serviceResult);

    const result = await controller.upload(file);

    expect(uploadServiceMock.uploadFile).toHaveBeenCalledTimes(1);
    expect(uploadServiceMock.uploadFile).toHaveBeenCalledWith(file);
    expect(result).toEqual(serviceResult);
  });

  // Test Case ID: TC_S3_CONTROLLER_002
  it('[TC_S3_CONTROLLER_002] upload phải throw lỗi khi UploadService.uploadFile thất bại', async () => {
    const file = buildMockFile();

    uploadServiceMock.uploadFile.mockRejectedValue(new Error('S3 unavailable'));

    await expect(controller.upload(file)).rejects.toThrow('S3 unavailable');

    expect(uploadServiceMock.uploadFile).toHaveBeenCalledTimes(1);
    expect(uploadServiceMock.uploadFile).toHaveBeenCalledWith(file);
  });
});

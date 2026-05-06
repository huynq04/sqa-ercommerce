import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { UploadController } from './s3.controller';
import { UploadService } from './s3.service';

describe('UploadController', () => {
  let controller: UploadController;
  const uploadServiceMock = {
    uploadFile: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UploadController(uploadServiceMock as unknown as UploadService);
  });

  it('delegates upload to service', async () => {
    const file = {
      originalname: 'shirt.png',
      mimetype: 'image/png',
      buffer: Buffer.from('x'),
    } as any;
    const uploaded = { fileUrl: 'http://localhost/file.png' };
    uploadServiceMock.uploadFile.mockResolvedValue(uploaded);

    const result = await controller.upload(file);

    expect(uploadServiceMock.uploadFile).toHaveBeenCalledWith(file);
    expect(result).toEqual(uploaded);
  });
});

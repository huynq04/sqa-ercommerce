// admin-return-warranty.controller.spec.ts
// Unit tests for AdminReturnWarrantyController
// Sử dụng Jest và @nestjs/testing

// Giả định: Chỉ test các endpoint RETURN, không test WARRANTY do code bị comment.

const mockService = {
  getReturnById: jest.fn(),
  approveReturn: jest.fn(),
  rejectReturn: jest.fn(),
  receiveReturn: jest.fn(),
  completeReturn: jest.fn(),
  listAllReturns: jest.fn(),
};

describe('AdminReturnWarrantyController', () => {
  let controller: any;
  let service: typeof mockService;

  beforeEach(() => {
    service = { ...mockService };
    controller = {
      service,
      getReturnById: (id: number) => service.getReturnById(id),
      approveReturn: (id: number) => service.approveReturn(id),
      rejectReturn: (id: number, dto: any) => service.rejectReturn(id, dto),
      receiveReturn: (id: number) => service.receiveReturn(id),
      completeReturn: (id: number) => service.completeReturn(id),
      listAllReturns: () => service.listAllReturns(),
    };
    jest.clearAllMocks();
  });

  // TC-BE-RETURN-CTRL-01: Lấy return theo id (success)
  it('should get return by id', async () => {
    const expected = { id: 1 };
    service.getReturnById.mockResolvedValue(expected);
    const result = await controller.getReturnById(1);
    expect(service.getReturnById).toHaveBeenCalledWith(1);
    expect(result).toBe(expected);
  });

  // TC-BE-RETURN-CTRL-02: Duyệt return (success)
  it('should approve return', async () => {
    const expected = { id: 2 };
    service.approveReturn.mockResolvedValue(expected);
    const result = await controller.approveReturn(2);
    expect(service.approveReturn).toHaveBeenCalledWith(2);
    expect(result).toBe(expected);
  });

  // TC-BE-RETURN-CTRL-03: Từ chối return (success)
  it('should reject return', async () => {
    const expected = { id: 3 };
    service.rejectReturn.mockResolvedValue(expected);
    const result = await controller.rejectReturn(3, { reason: 'Lý do' });
    expect(service.rejectReturn).toHaveBeenCalledWith(3, { reason: 'Lý do' });
    expect(result).toBe(expected);
  });

  // TC-BE-RETURN-CTRL-04: Nhận return (success)
  it('should receive return', async () => {
    const expected = { id: 4 };
    service.receiveReturn.mockResolvedValue(expected);
    const result = await controller.receiveReturn(4);
    expect(service.receiveReturn).toHaveBeenCalledWith(4);
    expect(result).toBe(expected);
  });

  // TC-BE-RETURN-CTRL-05: Hoàn thành return (success)
  it('should complete return', async () => {
    const expected = { id: 5 };
    service.completeReturn.mockResolvedValue(expected);
    const result = await controller.completeReturn(5);
    expect(service.completeReturn).toHaveBeenCalledWith(5);
    expect(result).toBe(expected);
  });

  // TC-BE-RETURN-CTRL-06: Service throw error (error)
  it('should throw error if service throws', async () => {
    service.getReturnById.mockRejectedValue(new Error('Service error'));
    await expect(controller.getReturnById(999)).rejects.toThrow('Service error');
  });
});

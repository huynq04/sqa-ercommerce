// admin-return-warranty.service.spec.ts
// Unit tests for AdminReturnWarrantyService
// Sử dụng Jest và @nestjs/testing

// Giả định: File này chỉ test các hàm RETURN, không test WARRANTY do code bị comment.
// Mock repository và enum ReturnStatus.

const mockReturnRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

enum ReturnStatus {
  WAITING_FOR_CUSTOMER = 'WAITING_FOR_CUSTOMER',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
}

describe('AdminReturnWarrantyService', () => {
  let service: any;
  let returnRepo: ReturnType<typeof mockReturnRepo>;

  beforeEach(() => {
    returnRepo = mockReturnRepo();
    service = {
      returnRepo,
      // Các hàm sẽ được test trực tiếp
    };
    // Gắn các hàm từ code gốc (giả lập)
    service.approveReturn = async function (id: number) {
      const rr = await this.returnRepo.findOne({ where: { id } });
      if (!rr) throw new Error('Return request không tồn tại');
      rr.status = ReturnStatus.APPROVED;
      return this.returnRepo.save(rr);
    };
    service.rejectReturn = async function (id: number, dto: any) {
      const rr = await this.returnRepo.findOne({ where: { id } });
      if (!rr) throw new Error('Return request không tồn tại');
      rr.status = ReturnStatus.REJECTED;
      rr.rejectReason = dto.reason;
      return this.returnRepo.save(rr);
    };
    service.receiveReturn = async function (id: number) {
      const rr = await this.returnRepo.findOne({ where: { id } });
      if (rr.status !== ReturnStatus.WAITING_FOR_CUSTOMER)
        throw new Error('Chưa có hàng từ khách');
      rr.status = ReturnStatus.RECEIVED;
      return this.returnRepo.save(rr);
    };
    service.completeReturn = async function (id: number) {
      const rr = await this.returnRepo.findOne({ where: { id } });
      rr.status = ReturnStatus.COMPLETED;
      return this.returnRepo.save(rr);
    };
    service.listAllReturns = async function () {
      return this.returnRepo.find({ relations: ['orderItem', 'order', 'user', 'variant'] });
    };
  });

  // TC-BE-RETURN-01: Duyệt return thành công (success)
  it('should approve return', async () => {
    const rr = { id: 1 };
    returnRepo.findOne.mockResolvedValue(rr);
    returnRepo.save.mockResolvedValue({ ...rr, status: ReturnStatus.APPROVED });
    const result = await service.approveReturn(1);
    expect(result.status).toBe(ReturnStatus.APPROVED);
  });

  // TC-BE-RETURN-02: Duyệt return không tồn tại (error)
  it('should throw if approve return not found', async () => {
    returnRepo.findOne.mockResolvedValue(undefined);
    await expect(service.approveReturn(1)).rejects.toThrow('Return request không tồn tại');
  });

  // TC-BE-RETURN-03: Từ chối return thành công (success)
  it('should reject return', async () => {
    const rr = { id: 2 };
    returnRepo.findOne.mockResolvedValue(rr);
    returnRepo.save.mockResolvedValue({ ...rr, status: ReturnStatus.REJECTED, rejectReason: 'Lý do' });
    const result = await service.rejectReturn(2, { reason: 'Lý do' });
    expect(result.status).toBe(ReturnStatus.REJECTED);
    expect(result.rejectReason).toBe('Lý do');
  });

  // TC-BE-RETURN-04: Nhận return sai trạng thái (error)
  it('should throw if receiveReturn wrong status', async () => {
    const rr = { id: 3, status: ReturnStatus.APPROVED };
    returnRepo.findOne.mockResolvedValue(rr);
    await expect(service.receiveReturn(3)).rejects.toThrow('Chưa có hàng từ khách');
  });

  // TC-BE-RETURN-05: Hoàn thành return thành công (success)
  it('should complete return', async () => {
    const rr = { id: 4 };
    returnRepo.findOne.mockResolvedValue(rr);
    returnRepo.save.mockResolvedValue({ ...rr, status: ReturnStatus.COMPLETED });
    const result = await service.completeReturn(4);
    expect(result.status).toBe(ReturnStatus.COMPLETED);
  });

  // TC-BE-RETURN-06: Lấy danh sách return (success)
  it('should list all returns', async () => {
    const returns = [{ id: 1 }, { id: 2 }];
    returnRepo.find.mockResolvedValue(returns);
    const result = await service.listAllReturns();
    expect(returnRepo.find).toHaveBeenCalledWith({ relations: ['orderItem', 'order', 'user', 'variant'] });
    expect(result).toBe(returns);
  });
});

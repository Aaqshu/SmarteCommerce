import { Test } from '@nestjs/testing';
import { CategoriesService } from '../src/catalog/categories.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('CategoriesService (unit, mocked pool)', () => {
  let service: CategoriesService;
  let mockPool: { query: jest.Mock };

  const mockTenantDb = {
    getDb: jest.fn(),
  };

  beforeEach(async () => {
    mockPool = { query: jest.fn() };
    mockTenantDb.getDb.mockReturnValue(mockPool);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: TenantDbService, useValue: mockTenantDb },
      ],
    }).compile();

    service = moduleRef.get(CategoriesService);
  });

  it('lists categories with product counts', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { CategoryId: 'c1', Name: 'Rings', Slug: 'rings', ProductCount: '2' },
        { CategoryId: 'c2', Name: 'Necklaces', Slug: 'necklaces', ProductCount: '3' },
      ],
    });

    const result = await service.listCategories('tenant_demo');
    expect(result).toHaveLength(2);
    expect(result[0].Name).toBe('Rings');
    expect(result[0].ProductCount).toBe('2');
    expect(mockPool.query.mock.calls[0][0]).toContain('Categories');
    expect(mockPool.query.mock.calls[0][0]).toContain('COUNT');
  });

  it('creates a category', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ CategoryId: 'c1', Name: 'Bangles', Slug: 'bangles' }],
    });

    const result = await service.createCategory('tenant_demo', {
      name: 'Bangles',
      slug: 'bangles',
    });
    expect(result.CategoryId).toBe('c1');
    expect(mockPool.query.mock.calls[0][1]).toEqual(['Bangles', 'bangles', null, 0]);
  });

  it('creates a subcategory with parentId', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ CategoryId: 'c2', Name: 'Gold Bangles', Slug: 'gold-bangles' }],
    });

    await service.createCategory('tenant_demo', {
      name: 'Gold Bangles',
      slug: 'gold-bangles',
      parentId: 'c1',
    });
    expect(mockPool.query.mock.calls[0][1]).toEqual(['Gold Bangles', 'gold-bangles', 'c1', 0]);
  });

  it('lists brands', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ BrandId: 'b1', Name: 'Zainab' }],
    });

    const result = await service.listBrands('tenant_demo');
    expect(result).toHaveLength(1);
    expect(result[0].Name).toBe('Zainab');
  });

  it('creates a brand', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ BrandId: 'b1', Name: 'Zainab' }],
    });

    const result = await service.createBrand('tenant_demo', { name: 'Zainab' });
    expect(result.BrandId).toBe('b1');
  });
});

import { NotFoundException } from '@nestjs/common';
import { Category } from '../../domain/entities/category.entity';
import { Product } from '../../domain/entities/product.entity';
import { Supplier } from '../../domain/entities/supplier.entity';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { SupplierRepository } from '../../domain/ports/supplier.repository.port';
import { CreateProductUseCase } from './create-product.use-case';
import { GetProductsBySupplierUseCase } from './get-products-by-supplier.use-case';
import { UpdateProductUseCase } from './update-product.use-case';

class InMemoryProductRepo extends ProductRepository {
  products: Product[] = [];

  async create(product: Product): Promise<Product> {
    this.products.push(product);
    return product;
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Product | null> {
    return (
      this.products.find(
        (product) => product.id === id && product.companyId === companyId,
      ) ?? null
    );
  }

  async update(product: Product): Promise<Product> {
    this.products = this.products.map((current) =>
      current.id === product.id ? product : current,
    );
    return product;
  }

  async findAllByCompanyId(companyId: string): Promise<Product[]> {
    return this.products.filter((product) => product.companyId === companyId);
  }

  async findAllByCompanyIdAndSupplierId(
    companyId: string,
    supplierId: string,
  ): Promise<Product[]> {
    return this.products.filter(
      (product) =>
        product.companyId === companyId && product.supplierId === supplierId,
    );
  }

  async findActiveByCompanyId(): Promise<Product[]> {
    return [];
  }

  async searchActiveByCompanyId(): Promise<Product[]> {
    return [];
  }

  async findByApproximateName(): Promise<Product[]> {
    return [];
  }

  async filterByPriceRange(): Promise<Product[]> {
    return [];
  }

  async findActiveByCategory(): Promise<Product[]> {
    return [];
  }

  async searchByCategoryOrText(): Promise<Product[]> {
    return [];
  }

  async filterByCategoryAndPrice(): Promise<Product[]> {
    return [];
  }
}

class InMemorySupplierRepo extends SupplierRepository {
  suppliers: Supplier[] = [];

  async create(supplier: Supplier): Promise<Supplier> {
    this.suppliers.push(supplier);
    return supplier;
  }

  async update(supplier: Supplier): Promise<Supplier> {
    this.suppliers = this.suppliers.map((current) =>
      current.id === supplier.id ? supplier : current,
    );
    return supplier;
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Supplier | null> {
    return (
      this.suppliers.find(
        (supplier) => supplier.id === id && supplier.companyId === companyId,
      ) ?? null
    );
  }

  async findAllByCompanyId(companyId: string): Promise<Supplier[]> {
    return this.suppliers.filter((supplier) => supplier.companyId === companyId);
  }
}

class FakeCategoryRepo extends CategoryRepository {
  async create(category: Category): Promise<Category> {
    return category;
  }
  async update(category: Category): Promise<Category> {
    return category;
  }
  async findById(): Promise<Category | null> {
    return null;
  }
  async findAllByCompanyId(): Promise<Category[]> {
    return [];
  }
  async findActiveByCompanyId(): Promise<Category[]> {
    return [];
  }
  async findByExactName(): Promise<Category | null> {
    return null;
  }
  async searchByName(): Promise<Category[]> {
    return [];
  }
}

describe('Product-Supplier relation use cases', () => {
  const companyA = 'company-a';
  const companyB = 'company-b';
  const supplierAId = '11111111-1111-4111-8111-111111111111';
  const supplierBId = '22222222-2222-4222-8222-222222222222';
  const productId = '33333333-3333-4333-8333-333333333333';

  const build = () => {
    const productRepo = new InMemoryProductRepo();
    const supplierRepo = new InMemorySupplierRepo();
    const categoryRepo = new FakeCategoryRepo();

    supplierRepo.suppliers = [
      new Supplier(supplierAId, companyA, 'Proveedor A'),
      new Supplier(supplierBId, companyB, 'Proveedor B'),
    ];

    const createProductUseCase = new CreateProductUseCase(productRepo, supplierRepo);
    const updateProductUseCase = new UpdateProductUseCase(
      productRepo,
      categoryRepo,
      supplierRepo,
    );
    const getProductsBySupplierUseCase = new GetProductsBySupplierUseCase(
      supplierRepo,
      productRepo,
    );

    return {
      productRepo,
      supplierRepo,
      createProductUseCase,
      updateProductUseCase,
      getProductsBySupplierUseCase,
    };
  };

  it('creates product with valid supplierId from same company', async () => {
    const { createProductUseCase } = build();

    const result = await createProductUseCase.execute({
      name: 'Producto A',
      price: 1000,
      stock: 10,
      companyId: companyA,
      supplierId: supplierAId,
    });

    expect(result.supplierId).toBe(supplierAId);
  });

  it('rejects create when supplierId does not exist', async () => {
    const { createProductUseCase } = build();

    await expect(
      createProductUseCase.execute({
        name: 'Producto B',
        price: 1000,
        stock: 10,
        companyId: companyA,
        supplierId: '99999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects create when supplierId belongs to another company', async () => {
    const { createProductUseCase } = build();

    await expect(
      createProductUseCase.execute({
        name: 'Producto C',
        price: 1000,
        stock: 10,
        companyId: companyA,
        supplierId: supplierBId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows create without supplierId', async () => {
    const { createProductUseCase } = build();

    const result = await createProductUseCase.execute({
      name: 'Producto D',
      price: 1000,
      stock: 10,
      companyId: companyA,
    });

    expect(result.supplierId).toBeNull();
  });

  it('allows removing supplierId with null on update', async () => {
    const { productRepo, updateProductUseCase } = build();

    productRepo.products = [
      new Product(
        productId,
        'Producto E',
        null,
        1200,
        5,
        companyA,
        true,
        null,
        null,
        null,
        null,
        null,
        'COP',
        0,
        null,
        null,
        new Date(),
        new Date(),
        supplierAId,
      ),
    ];

    const updated = await updateProductUseCase.execute({
      id: productId,
      companyId: companyA,
      supplierId: null,
    });

    expect(updated.supplierId).toBeNull();
  });

  it('GET suppliers/:id/products returns only products from same tenant', async () => {
    const { productRepo, getProductsBySupplierUseCase } = build();

    productRepo.products = [
      new Product(
        'p-a-1',
        'Producto A1',
        null,
        100,
        1,
        companyA,
        true,
        null,
        null,
        null,
        null,
        null,
        'COP',
        0,
        null,
        null,
        new Date(),
        new Date(),
        supplierAId,
      ),
      new Product(
        'p-a-2',
        'Producto A2',
        null,
        200,
        2,
        companyA,
        true,
        null,
        null,
        null,
        null,
        null,
        'COP',
        0,
        null,
        null,
        new Date(),
        new Date(),
        null,
      ),
      new Product(
        'p-b-1',
        'Producto B1',
        null,
        300,
        3,
        companyB,
        true,
        null,
        null,
        null,
        null,
        null,
        'COP',
        0,
        null,
        null,
        new Date(),
        new Date(),
        supplierBId,
      ),
    ];

    const products = await getProductsBySupplierUseCase.execute(
      companyA,
      supplierAId,
    );

    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('p-a-1');
  });
});


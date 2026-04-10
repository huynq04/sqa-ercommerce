import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '@modules/ecommerce/entities/cart.entity';
import { CartItem } from '@modules/ecommerce/entities/cartItem.entity';
import { ProductVariant } from '@modules/ecommerce/entities/productVariant.entity';
import { AddToCartDto, UpdateCartDto } from '../dtos/cart.dto';

@Injectable()
export class UserCartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
  ) {}

  /**  Lấy giỏ hàng của user */
  async getUserCart(userId: number) {
    let cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.color',
        'items.variant.size',
      ],
    });

    if (!cart) {
      cart = this.cartRepo.create({ user: { id: userId } });
      await this.cartRepo.save(cart);
    }

    // đảm bảo tính tổng mỗi lần lấy
    await this.updateCartTotal(cart.id);
    return this.cartRepo.findOne({
      where: { id: cart.id },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.color',
        'items.variant.size',
      ],
    });
  }

  /**  Thêm item vào giỏ */
  async addItem(userId: number, dto: AddToCartDto) {
    if (!dto.variantId)
      throw new NotFoundException('Thiếu thông tin biến thể sản phẩm');

    const cart = await this.getUserCart(userId);

    const variant = await this.variantRepo.findOne({
      where: { id: dto.variantId },
      relations: ['product'],
    });
    if (!variant) throw new NotFoundException('Không tìm thấy biến thể');

    const existing = await this.cartItemRepo.findOne({
      where: {
        cart: { id: cart.id },
        variant: { id: variant.id },
      },
      relations: ['cart'],
    });

    if (existing) {
      existing.quantity += dto.quantity;
      await this.cartItemRepo.save(existing);
    } else {
      const item = this.cartItemRepo.create({
        cart,
        variant,
        quantity: dto.quantity,
        price: variant.price,
      });
      await this.cartItemRepo.save(item);
    }

    // Cập nhật tổng tiền
    await this.updateCartTotal(cart.id);
    return this.getUserCart(userId);
  }

  /**  Cập nhật số lượng */
  async updateItem(id: number, dto: UpdateCartDto) {
    const item = await this.cartItemRepo.findOne({
      where: { id },
      relations: ['cart', 'cart.user'],
    });
    if (!item) throw new NotFoundException('Không tìm thấy item');

    item.quantity = dto.quantity;
    await this.cartItemRepo.save(item);
    await this.updateCartTotal(item.cart.id);
    return this.getUserCart(item.cart.user.id);
  }

  /**  Xóa một item */
  async removeItem(id: number) {
    const item = await this.cartItemRepo.findOne({
      where: { id },
      relations: ['cart'],
    });
    if (!item) throw new NotFoundException('Không tìm thấy item');

    const cartId = item.cart.id;
    await this.cartItemRepo.remove(item);

    //  Cập nhật tổng tiền
    await this.updateCartTotal(cartId);
    return { message: 'Đã xóa sản phẩm khỏi giỏ hàng' };
  }

  /**  Xóa toàn bộ giỏ */
  async clearCart(userId: number) {
    const cart = await this.getUserCart(userId);
    await this.cartItemRepo.remove(cart.items);

    cart.totalPrice = 0;
    await this.cartRepo.save(cart);

    return { message: 'Đã xóa toàn bộ giỏ hàng' };
  }

  /**  Cập nhật tổng tiền giỏ hàng */
  private async updateCartTotal(cartId: number) {
    const cart = await this.cartRepo.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
    if (!cart) return;

    const total = cart.items.reduce((sum, i) => {
      const price = Number(i.price) || 0;
      return sum + price * i.quantity;
    }, 0);

    cart.totalPrice = total;
    await this.cartRepo.save(cart);
  }
}

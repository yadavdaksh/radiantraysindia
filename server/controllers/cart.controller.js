import { orderService } from "../services/order.service.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCart = asyncHandler(async (req, res) => {
  const cart = await orderService.getCart(req.user.id);
  res.json(new ApiResponsive(200, cart, "Cart retrieved successfully"));
});

export const addToCart = asyncHandler(async (req, res) => {
  const cart = await orderService.addToCart(req.user.id, req.body);
  res.json(new ApiResponsive(200, cart, "Item added to cart"));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const cart = await orderService.updateCartItem(req.user.id, id, quantity);
  res.json(new ApiResponsive(200, cart, "Cart item updated"));
});

export const deleteCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cart = await orderService.deleteCartItem(req.user.id, id);
  res.json(new ApiResponsive(200, cart, "Item removed from cart"));
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await orderService.clearCart(req.user.id);
  res.json(new ApiResponsive(200, cart, "Cart cleared successfully"));
});

export const mergeGuestCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;
  const customerId = req.user.id;

  for (const item of items) {
    if (item.productId) {
      try {
        await orderService.addToCart(customerId, {
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: Number(item.quantity) || 1,
        });
      } catch (err) {
        console.warn(`Failed to add guest item ${item.productId} to cart:`, err.message);
      }
    }
  }

  const cart = await orderService.getCart(customerId);
  res.json(new ApiResponsive(200, cart, "Cart merged successfully"));
});

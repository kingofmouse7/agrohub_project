from django.contrib import admin
from .models import Profile, Category, Product, Rental, Auction, Cart, CartItem, Order, OrderItem, Wallet, AuctionBid

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'bonus_points']
    list_filter = ['role']
    search_fields = ['user__username']

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'created_at']
    search_fields = ['user__username']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'id']
    search_fields = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'seller', 'category', 'price', 'stock', 'is_available']
    list_filter = ['category', 'is_available', 'seller']
    search_fields = ['name', 'description']
    list_editable = ['price', 'stock', 'is_available']

@admin.register(Rental)
class RentalAdmin(admin.ModelAdmin):
    list_display = ['name', 'seller', 'price_per_day', 'deposit', 'is_available']
    list_filter = ['is_available', 'seller']
    search_fields = ['name', 'description']
    list_editable = ['price_per_day', 'deposit', 'is_available']
    fieldsets = (
        ('Основная информация', {
            'fields': ('seller', 'category', 'name', 'description', 'image')
        }),
        ('Цены', {
            'fields': ('price_per_day', 'deposit')
        }),
        ('Статус', {
            'fields': ('is_available',)
        }),
    )

@admin.register(Auction)
class AuctionAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'seller', 'starting_price', 'current_price', 'end_date', 'is_active']
    list_filter = ['is_active', 'seller']
    search_fields = ['product_name', 'description']
    list_editable = ['current_price', 'is_active']
    fieldsets = (
        ('Основная информация', {
            'fields': ('seller', 'product_name', 'description', 'image')
        }),
        ('Цены', {
            'fields': ('starting_price', 'current_price')
        }),
        ('Даты', {
            'fields': ('end_date',)
        }),
        ('Статус', {
            'fields': ('is_active', 'winner')
        }),
    )

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'created_at']

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'quantity']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total_price', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username']

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'price']

@admin.register(AuctionBid)
class AuctionBidAdmin(admin.ModelAdmin):
    list_display = ['auction', 'user', 'amount', 'created_at']
    list_filter = ['created_at']
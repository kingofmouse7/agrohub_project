from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Profile, Product, Category, Rental, Auction, 
    Cart, CartItem, Order, OrderItem, AuctionBid
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'bonus_points', 'phone', 'address']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'seller', 'seller_name', 'category', 'category_name', 
                  'name', 'description', 'price', 'image', 'stock', 'is_available', 'created_at']

class RentalSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    
    class Meta:
        model = Rental
        fields = ['id', 'seller', 'seller_name', 'category', 'name', 'description', 
                  'price_per_day', 'deposit', 'image', 'is_available']

class AuctionSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    
    class Meta:
        model = Auction
        fields = ['id', 'seller', 'seller_name', 'product_name', 'description', 
                  'starting_price', 'current_price', 'end_date', 'image', 'is_active']

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    total = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'total']
    
    def get_total(self, obj):
        if obj.product:
            return obj.product.price * obj.quantity
        return 0

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total', 'created_at']
    
    def get_total(self, obj):
        total = 0
        for item in obj.items.all():
            if item.product:
                total += item.product.price * item.quantity
        return total

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'user_name', 'total_price', 'bonus_used', 
                  'bonus_earned', 'status', 'created_at', 'items']

class AuctionBidSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AuctionBid
        fields = ['id', 'auction', 'user', 'user_name', 'amount', 'created_at']
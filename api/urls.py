from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'rentals', RentalViewSet)
router.register(r'auctions', AuctionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('logout/', logout, name='logout'),
    path('me/', get_current_user, name='me'),
    path('cart/', cart_view, name='cart'),
    path('checkout/', checkout, name='checkout'),
    path('my-orders/', my_orders, name='my-orders'),
    path('my-rentals/', my_rentals, name='my-rentals'),
    path('my-auctions/', my_auctions, name='my-auctions'),
    path('won-auctions/', won_auctions, name='won-auctions'),
    path('my-products/', my_products, name='my-products'),
    path('delete-my-product/<int:product_id>/', delete_my_product, name='delete-my-product'),
    path('search/', search_all, name='search-all'),
    path('wallet/', get_wallet, name='wallet'),
    path('add-funds/', add_funds, name='add-funds'),
    path('admin/product/<int:product_id>/', admin_delete_product, name='admin-delete-product'),
    path('admin/update-product/<int:product_id>/', admin_update_product, name='admin-update-product'),
    path('products/<int:product_id>/reviews/', get_product_reviews, name='product-reviews'),
    path('products/<int:product_id>/add-review/', add_product_review, name='add-product-review'),
    path('rentals/<int:rental_id>/reviews/', get_rental_reviews, name='rental-reviews'),
    path('rentals/<int:rental_id>/add-review/', add_rental_review, name='add-rental-review'),
]
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from decimal import Decimal
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta
from .models import (
    Profile, Product, Category, Rental, Auction, 
    Cart, CartItem, Order, OrderItem, AuctionBid, Wallet,
    RentalOrder, UserAuction, Review  # <--- ДОБАВЛЕН Review
)
from .serializers import (
    UserSerializer, ProfileSerializer, ProductSerializer, 
    CategorySerializer, RentalSerializer, AuctionSerializer,
    CartSerializer, OrderSerializer
)

# Регистрация
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    print("Register request:", request.data)
    
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    role = request.data.get('role', 'buyer')
    
    if not username or not password:
        return Response(
            {'error': 'Username и password обязательны'}, 
            status=400
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Пользователь уже существует'}, 
            status=400
        )
    
    try:
        user = User.objects.create_user(
            username=username, 
            password=password, 
            email=email
        )
        
        user.profile.role = role
        user.profile.save()
        
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Регистрация успешна',
            'token': token.key,
            'user': UserSerializer(user).data,
            'profile': ProfileSerializer(user.profile).data
        }, status=201)
        
    except Exception as e:
        print("Registration error:", str(e))
        return Response({'error': str(e)}, status=400)

# Логин
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username и password обязательны'}, status=400)
    
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response({'error': 'Неверные учетные данные'}, status=401)
    
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
        'profile': ProfileSerializer(user.profile).data
    })

# Выход
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
    except:
        pass
    return Response({'message': 'Выход выполнен'})

# Текущий пользователь
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    return Response({
        'user': UserSerializer(request.user).data,
        'profile': ProfileSerializer(request.user.profile).data
    })

# Товары
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_available=True)
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

# Категории
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

# Аренда
class RentalViewSet(viewsets.ModelViewSet):
    queryset = Rental.objects.filter(is_available=True)
    serializer_class = RentalSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
    
    @action(detail=True, methods=['post'])
    @permission_classes([IsAuthenticated])
    def rent(self, request, pk=None):
        try:
            rental = self.get_object()
            days = int(request.data.get('days', 1))
            
            if days < 1:
                return Response({'error': 'Количество дней должно быть больше 0'}, status=400)
            
            if not rental.is_available:
                return Response({'error': 'Товар недоступен для аренды'}, status=400)
            
            total_price = rental.price_per_day * days
            wallet = Wallet.objects.get(user=request.user)
            
            required_amount = total_price + rental.deposit
            if wallet.balance < required_amount:
                return Response({
                    'error': f'Недостаточно средств. На счету: {wallet.balance}₽. Нужно: {required_amount}₽'
                }, status=400)
            
            # Списываем деньги
            wallet.balance -= Decimal(str(required_amount))
            wallet.save()
            
            # Создаем запись об аренде
            end_date = timezone.now() + timedelta(days=days)
            rental_order = RentalOrder.objects.create(
                user=request.user,
                rental=rental,
                days=days,
                total_price=total_price,
                deposit=rental.deposit,
                end_date=end_date,
                status='active'
            )
            
            return Response({
                'message': f'✅ Техника "{rental.name}" арендована на {days} дней до {end_date.strftime("%d.%m.%Y")}',
                'total': float(total_price),
                'deposit': float(rental.deposit),
                'balance': float(wallet.balance),
                'order_id': rental_order.id
            })
        except Exception as e:
            print("Rent error:", str(e))
            return Response({'error': str(e)}, status=400)

# Торги
class AuctionViewSet(viewsets.ModelViewSet):
    queryset = Auction.objects.filter(is_active=True)
    serializer_class = AuctionSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(seller=self.request.user, current_price=self.request.data.get('starting_price', 0))
    
    @action(detail=True, methods=['post'])
    @permission_classes([IsAuthenticated])
    def place_bid(self, request, pk=None):
        try:
            auction = self.get_object()
            amount = float(request.data.get('amount', 0))
            
            if not auction.is_active:
                return Response({'error': 'Торги завершены'}, status=400)
            
            if amount <= float(auction.current_price):
                return Response({
                    'error': f'Ставка должна быть выше текущей цены ({auction.current_price})'
                }, status=400)
            
            # Проверяем баланс
            wallet = Wallet.objects.get(user=request.user)
            if wallet.balance < amount:
                return Response({
                    'error': f'Недостаточно средств. На счету: {wallet.balance}₽'
                }, status=400)
            
            old_price = auction.current_price
            old_winner = None
            
            # Если была предыдущая ставка, находим победителя
            if old_price > auction.starting_price:
                prev_bids = UserAuction.objects.filter(auction=auction).order_by('-bid_amount')
                if prev_bids.exists():
                    old_winner = prev_bids.first().user
            
            # Списываем деньги с нового победителя
            wallet.balance -= Decimal(str(amount))
            wallet.save()
            
            # Обновляем цену аукциона
            auction.current_price = amount
            auction.save()
            
            # Сохраняем ставку в историю
            user_auction = UserAuction.objects.create(
                user=request.user,
                auction=auction,
                bid_amount=amount,
                is_winner=True
            )
            
            # Если был предыдущий победитель, возвращаем ему деньги
            if old_winner and old_winner != request.user:
                try:
                    old_wallet = Wallet.objects.get(user=old_winner)
                    old_wallet.balance += old_price
                    old_wallet.save()
                    
                    # Обновляем статус предыдущей ставки
                    prev_ua = UserAuction.objects.filter(auction=auction, user=old_winner).first()
                    if prev_ua:
                        prev_ua.is_winner = False
                        prev_ua.save()
                except Exception as e:
                    print("Error returning money:", str(e))
            
            # Добавляем запись о ставке
            AuctionBid.objects.create(auction=auction, user=request.user, amount=amount)
            
            return Response({
                'message': f'✅ Ставка {amount}₽ принята!',
                'current_price': float(auction.current_price),
                'balance': float(wallet.balance)
            })
        except Exception as e:
            print("Bid error:", str(e))
            return Response({'error': str(e)}, status=400)
# Корзина
@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def cart_view(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id, is_available=True)
            cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
            if not created:
                cart_item.quantity += quantity
            else:
                cart_item.quantity = quantity
            cart_item.save()
            return Response({'message': 'Товар добавлен в корзину'})
        except Product.DoesNotExist:
            return Response({'error': 'Товар не найден'}, status=404)
    
    elif request.method == 'DELETE':
        item_id = request.data.get('item_id')
        CartItem.objects.filter(id=item_id, cart=cart).delete()
        return Response({'message': 'Товар удалён'})

# Оформление заказа
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request):
    try:
        cart = Cart.objects.get(user=request.user)
        if not cart.items.exists():
            return Response({'error': 'Корзина пуста'}, status=400)
        
        # Рассчитываем общую сумму
        total = Decimal('0')
        for item in cart.items.all():
            if not item.product.is_available:
                return Response({'error': f'Товар "{item.product.name}" недоступен'}, status=400)
            if item.product.stock < item.quantity:
                return Response({'error': f'Недостаточно товара "{item.product.name}". Доступно: {item.product.stock}'}, status=400)
            total += item.product.price * item.quantity
        
        # Получаем бонусы для списания
        bonus_to_use = int(request.data.get('bonus_used', 0))
        profile = request.user.profile
        
        # Проверяем, что бонусов достаточно
        if bonus_to_use > profile.bonus_points:
            bonus_to_use = profile.bonus_points
        
        final_total = total - Decimal(str(bonus_to_use))
        if final_total < 0:
            final_total = Decimal('0')
            bonus_to_use = int(total)
        
        # Проверяем баланс кошелька
        wallet = Wallet.objects.get(user=request.user)
        if wallet.balance < final_total:
            return Response({'error': f'Недостаточно средств. На счету: {wallet.balance}₽. Нужно: {final_total}₽'}, status=400)
        
        # СПИСЫВАЕМ ДЕНЬГИ
        wallet.balance -= Decimal(str(final_total))
        wallet.save()
        
        # СПИСЫВАЕМ БОНУСЫ
        profile.bonus_points -= bonus_to_use
        profile.save()
        
        # Создаем заказ
        order = Order.objects.create(
            user=request.user,
            total_price=final_total,
            bonus_used=bonus_to_use,
            bonus_earned=0,
            status='paid'
        )
        
        # Создаем элементы заказа и обновляем склад
        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )
            item.product.stock -= item.quantity
            item.product.save()
        
        # НАЧИСЛЯЕМ БОНУСЫ (5% от ИСХОДНОЙ суммы)
        bonus_earned = int(total * Decimal('0.05'))
        profile.bonus_points += bonus_earned
        profile.save()
        
        # Обновляем заказ с начисленными бонусами
        order.bonus_earned = bonus_earned
        order.save()
        
        # ОЧИЩАЕМ КОРЗИНУ
        cart.items.all().delete()
        
        return Response({
            'message': f'✅ Заказ #{order.id} успешно оформлен! Списано бонусов: {bonus_to_use}, начислено: {bonus_earned}',
            'order_id': order.id,
            'bonus_used': bonus_to_use,
            'bonus_earned': bonus_earned,
            'total': float(final_total),
            'balance': float(wallet.balance),
            'bonus_points': profile.bonus_points
        }, status=200)
        
    except Cart.DoesNotExist:
        return Response({'error': 'Корзина не найдена'}, status=400)
    except Exception as e:
        print("Checkout error:", str(e))
        return Response({'error': str(e)}, status=400)

# Мои заказы
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

# Кошелек
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wallet(request):
    wallet = Wallet.objects.get(user=request.user)
    return Response({'balance': wallet.balance})

# Пополнить кошелек
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_funds(request):
    amount = Decimal(request.data.get('amount', 0))
    if amount <= 0:
        return Response({'error': 'Сумма должна быть больше 0'}, status=400)
    
    wallet = Wallet.objects.get(user=request.user)
    wallet.balance += amount
    wallet.save()
    
    return Response({
        'message': f'Счет пополнен на {amount}₽',
        'balance': wallet.balance
    })

# Поиск по всем категориям
@api_view(['GET'])
@permission_classes([AllowAny])
def search_all(request):
    query = request.query_params.get('q', '').strip()
    print(f"Search query: {query}")
    
    if not query:
        return Response({
            'products': [],
            'rentals': [],
            'auctions': []
        })
    
    products = Product.objects.filter(
        Q(name__icontains=query) | Q(description__icontains=query),
        is_available=True
    )
    
    rentals = Rental.objects.filter(
        Q(name__icontains=query) | Q(description__icontains=query),
        is_available=True
    )
    
    auctions = Auction.objects.filter(
        Q(product_name__icontains=query) | Q(description__icontains=query),
        is_active=True
    )
    
    print(f"Found: products={products.count()}, rentals={rentals.count()}, auctions={auctions.count()}")
    
    return Response({
        'products': ProductSerializer(products, many=True).data,
        'rentals': RentalSerializer(rentals, many=True).data,
        'auctions': AuctionSerializer(auctions, many=True).data
    })

# Админские методы
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_product(request, product_id):
    if request.user.profile.role != 'admin':
        return Response({'error': 'Доступ запрещен'}, status=403)
    
    try:
        product = Product.objects.get(id=product_id)
        product.delete()
        return Response({'message': 'Товар удален'})
    except Product.DoesNotExist:
        return Response({'error': 'Товар не найден'}, status=404)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_update_product(request, product_id):
    if request.user.profile.role != 'admin':
        return Response({'error': 'Доступ запрещен'}, status=403)
    
    try:
        product = Product.objects.get(id=product_id)
        product.name = request.data.get('name', product.name)
        product.price = request.data.get('price', product.price)
        product.stock = request.data.get('stock', product.stock)
        product.is_available = request.data.get('is_available', product.is_available)
        product.save()
        serializer = ProductSerializer(product)
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'error': 'Товар не найден'}, status=404)

# Мои товары для продавца
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_products(request):
    if request.user.profile.role not in ['seller', 'admin']:
        return Response({'error': 'Доступ только для продавцов'}, status=403)
    
    products = Product.objects.filter(seller=request.user)
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

# Удалить свой товар
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_my_product(request, product_id):
    try:
        product = Product.objects.get(id=product_id, seller=request.user)
        product.delete()
        return Response({'message': 'Товар удалён'})
    except Product.DoesNotExist:
        return Response({'error': 'Товар не найден'}, status=404)

# История аренды
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_rentals(request):
    rentals = RentalOrder.objects.filter(user=request.user).order_by('-start_date')
    data = []
    for rental in rentals:
        data.append({
            'id': rental.id,
            'name': rental.rental.name,
            'days': rental.days,
            'total_price': float(rental.total_price),
            'deposit': float(rental.deposit),
            'start_date': rental.start_date,
            'end_date': rental.end_date,
            'status': rental.status,
            'is_active': rental.end_date > timezone.now() and rental.status == 'active'
        })
    return Response(data)

# Мои ставки
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_auctions(request):
    user_auctions = UserAuction.objects.filter(user=request.user).order_by('-created_at')
    data = []
    for ua in user_auctions:
        data.append({
            'id': ua.id,
            'product_name': ua.auction.product_name,
            'bid_amount': float(ua.bid_amount),
            'is_winner': ua.is_winner,
            'is_active': ua.auction.is_active,
            'end_date': ua.auction.end_date,
            'current_price': float(ua.auction.current_price),
            'created_at': ua.created_at
        })
    return Response(data)

# Выигранные торги
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def won_auctions(request):
    won = UserAuction.objects.filter(user=request.user, is_winner=True).order_by('-created_at')
    data = []
    for w in won:
        data.append({
            'id': w.id,
            'product_name': w.auction.product_name,
            'winning_bid': float(w.bid_amount),
            'end_date': w.auction.end_date
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_reviews(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        reviews = Review.objects.filter(product=product).order_by('-created_at')
        data = []
        for review in reviews:
            data.append({
                'id': review.id,
                'user': review.user.username,
                'rating': review.rating,
                'comment': review.comment,
                'created_at': review.created_at
            })
        return Response(data)
    except Product.DoesNotExist:
        return Response({'error': 'Товар не найден'}, status=404)

# Добавить отзыв на товар
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_product_review(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        rating = request.data.get('rating')
        comment = request.data.get('comment')
        
        if not rating or not comment:
            return Response({'error': 'Рейтинг и комментарий обязательны'}, status=400)
        
        # Проверяем, покупал ли пользователь этот товар
        has_purchased = OrderItem.objects.filter(
            order__user=request.user,
            product=product
        ).exists()
        
        if not has_purchased:
            return Response({'error': 'Вы можете оставить отзыв только на купленные товары'}, status=400)
        
        # Проверяем, не оставлял ли уже отзыв
        existing_review = Review.objects.filter(user=request.user, product=product).first()
        if existing_review:
            return Response({'error': 'Вы уже оставляли отзыв на этот товар'}, status=400)
        
        # Создаем отзыв
        review = Review.objects.create(
            user=request.user,
            product=product,
            rating=rating,
            comment=comment,
            bonus_awarded=False
        )
        
        # Начисляем бонусы за отзыв (50 бонусов)
        profile = request.user.profile
        profile.bonus_points += 50
        profile.save()
        
        review.bonus_awarded = True
        review.save()
        
        return Response({
            'message': '✅ Отзыв добавлен! Вам начислено 50 бонусов',
            'bonus_points': profile.bonus_points
        }, status=201)
        
    except Product.DoesNotExist:
        return Response({'error': 'Товар не найден'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

# Получить отзывы на аренду
@api_view(['GET'])
@permission_classes([AllowAny])
def get_rental_reviews(request, rental_id):
    try:
        rental = Rental.objects.get(id=rental_id)
        reviews = Review.objects.filter(rental=rental).order_by('-created_at')
        data = []
        for review in reviews:
            data.append({
                'id': review.id,
                'user': review.user.username,
                'rating': review.rating,
                'comment': review.comment,
                'created_at': review.created_at
            })
        return Response(data)
    except Rental.DoesNotExist:
        return Response({'error': 'Аренда не найдена'}, status=404)

# Добавить отзыв на аренду
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_rental_review(request, rental_id):
    try:
        rental = Rental.objects.get(id=rental_id)
        rating = request.data.get('rating')
        comment = request.data.get('comment')
        
        if not rating or not comment:
            return Response({'error': 'Рейтинг и комментарий обязательны'}, status=400)
        
        # Проверял ли пользователь арендовал эту технику
        has_rented = RentalOrder.objects.filter(
            user=request.user,
            rental=rental,
            status='completed'
        ).exists()
        
        if not has_rented:
            return Response({'error': 'Вы можете оставить отзыв только после завершения аренды'}, status=400)
        
        # Проверяем, не оставлял ли уже отзыв
        existing_review = Review.objects.filter(user=request.user, rental=rental).first()
        if existing_review:
            return Response({'error': 'Вы уже оставляли отзыв на эту аренду'}, status=400)
        
        # Создаем отзыв
        review = Review.objects.create(
            user=request.user,
            rental=rental,
            rating=rating,
            comment=comment,
            bonus_awarded=False
        )
        
        # Начисляем бонусы за отзыв (50 бонусов)
        profile = request.user.profile
        profile.bonus_points += 50
        profile.save()
        
        review.bonus_awarded = True
        review.save()
        
        return Response({
            'message': '✅ Отзыв добавлен! Вам начислено 50 бонусов',
            'bonus_points': profile.bonus_points
        }, status=201)
        
    except Rental.DoesNotExist:
        return Response({'error': 'Аренда не найдена'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
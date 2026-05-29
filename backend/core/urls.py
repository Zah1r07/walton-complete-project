from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ClaimViewSet, CurrentUserView, FeedbackViewSet, ProductViewSet, RegistrationViewSet, UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='users')
router.register('products', ProductViewSet, basename='products')
router.register('registrations', RegistrationViewSet, basename='registrations')
router.register('claims', ClaimViewSet, basename='claims')
router.register('feedback', FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('auth/login/', TokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/me/', CurrentUserView.as_view()),
    path('', include(router.urls)),
]

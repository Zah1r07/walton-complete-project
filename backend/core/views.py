from django.core.mail import send_mail
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from .models import Claim, Feedback, Product, Registration, User
from .permissions import AdminOnly, OwnerOrAdminPermission, ProductPermission, is_admin
from .serializers import ClaimSerializer, FeedbackSerializer, ProductSerializer, RegistrationSerializer, UserSerializer


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ["list", "create", "destroy"]:
            return [AdminOnly()]
        return [OwnerOrAdminPermission()]

    def get_queryset(self):
        if is_admin(self.request.user):
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [ProductPermission]
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.all()


class RegistrationViewSet(viewsets.ModelViewSet):
    permission_classes = [OwnerOrAdminPermission]
    serializer_class = RegistrationSerializer

    def get_queryset(self):
        if is_admin(self.request.user):
            return Registration.objects.all()
        return Registration.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if is_admin(self.request.user):
            serializer.save()
        else:
            serializer.save(user=self.request.user)


class ClaimViewSet(viewsets.ModelViewSet):
    permission_classes = [OwnerOrAdminPermission]
    serializer_class = ClaimSerializer

    def get_queryset(self):
        if is_admin(self.request.user):
            return Claim.objects.all()
        return Claim.objects.filter(registration__user=self.request.user)

    def perform_create(self, serializer):
        claim = serializer.save()
        send_mail("Claim Created", f"Claim #{claim.id} created", "noreply@test.com", ["test@test.com"])

    @action(detail=True, methods=["patch"], permission_classes=[AdminOnly])
    def update_status(self, request, pk=None):
        claim = self.get_object()
        serializer = self.get_serializer(claim, data={"status": request.data.get("status")}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class FeedbackViewSet(viewsets.ModelViewSet):
    permission_classes = [OwnerOrAdminPermission]
    serializer_class = FeedbackSerializer

    def get_queryset(self):
        if is_admin(self.request.user):
            return Feedback.objects.all()
        return Feedback.objects.filter(claim__registration__user=self.request.user)

    def perform_create(self, serializer):
        analyzer = SentimentIntensityAnalyzer()
        score = analyzer.polarity_scores(serializer.validated_data.get("comment", ""))["compound"]
        sentiment = "positive" if score > 0.05 else "negative" if score < -0.05 else "neutral"
        serializer.save(sentiment=sentiment)

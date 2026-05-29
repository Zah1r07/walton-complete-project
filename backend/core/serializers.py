from rest_framework import serializers
from .models import Claim, Feedback, Product, Registration, User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"


class RegistrationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="user.username", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_serial = serializers.CharField(source="product.serial", read_only=True)

    class Meta:
        model = Registration
        fields = "__all__"

    def validate_user(self, value):
        request = self.context.get("request")
        if request and request.user.role != User.ROLE_ADMIN and value != request.user:
            raise serializers.ValidationError("Customers can only register products for themselves.")
        return value


class ClaimSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="registration.product.name", read_only=True)
    product_serial = serializers.CharField(source="registration.product.serial", read_only=True)
    customer_name = serializers.CharField(source="registration.user.username", read_only=True)

    class Meta:
        model = Claim
        fields = "__all__"

    def validate_registration(self, value):
        request = self.context.get("request")
        if request and request.user.role != User.ROLE_ADMIN and value.user != request.user:
            raise serializers.ValidationError("You cannot create a claim for this registration.")
        return value


class FeedbackSerializer(serializers.ModelSerializer):
    sentiment = serializers.CharField(read_only=True)

    class Meta:
        model = Feedback
        fields = "__all__"

    def validate_claim(self, value):
        request = self.context.get("request")
        if request and request.user.role != User.ROLE_ADMIN and value.registration.user != request.user:
            raise serializers.ValidationError("You cannot review this claim.")
        return value

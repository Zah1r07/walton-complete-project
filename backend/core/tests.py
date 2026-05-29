from rest_framework import status
from rest_framework.test import APITestCase
from .models import Claim, Product, Registration, User


class WarrantyApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin-test', password='admin-pass', role='admin')
        self.customer = User.objects.create_user(username='customer-test', password='customer-pass', role='customer')
        self.other = User.objects.create_user(username='other-test', password='other-pass', role='customer')
        self.product = Product.objects.create(serial='TEST-001', name='Test Product')
        self.registration = Registration.objects.create(user=self.customer, product=self.product)
        self.claim = Claim.objects.create(registration=self.registration, description='Screen issue')

    def test_login_returns_tokens(self):
        response = self.client.post('/api/auth/login/', {'username': 'customer-test', 'password': 'customer-pass'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_api_requires_authentication(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_can_only_see_own_claims(self):
        other_registration = Registration.objects.create(user=self.other, product=self.product)
        Claim.objects.create(registration=other_registration, description='Other claim')
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/claims/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['description'], 'Screen issue')

    def test_customer_cannot_update_status(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.patch(f'/api/claims/{self.claim.id}/update_status/', {'status': 'approved'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_status(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/claims/{self.claim.id}/update_status/', {'status': 'approved'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.claim.refresh_from_db()
        self.assertEqual(self.claim.status, 'approved')

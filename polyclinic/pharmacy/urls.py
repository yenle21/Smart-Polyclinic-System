# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('categories', views.CategoryViewSet, basename='category')
router.register('medicines', views.MedicineViewSet, basename='medicine')
router.register('stock-transactions', views.StockTransactionViewSet, basename='stock-transaction')
router.register('prescriptions', views.PrescriptionViewSet, basename='prescription')
router.register('inventory', views.InventoryViewSet, basename='inventory')

urlpatterns = [
    path('',include(router.urls))
]
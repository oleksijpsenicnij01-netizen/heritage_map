from django.urls import path
from . import views # Імпортуємо всі функції із views.py

urlpatterns = [
    # Визначаємо, що кореневий маршрут додатку ('') веде на функцію views.index
    path('', views.index, name='index'), 
]
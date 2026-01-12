from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/me/', views.me, name='api_me'),
    path('api/profile/', views.api_profile, name='api_profile'),
    path('api/password/', views.api_password, name='api_password'),
    path('api/password/set/', views.api_password_set, name='api_password_set'),

    path('api/my-results/', views.api_results_by_region, name='api_my_results'),
    path('api/results/submit/', views.api_submit_game_result, name='api_submit_game_result'),
    path('api/results/regions/', views.api_results_regions, name='api_results_regions'),

    path('auth/login/', views.ajax_login, name='ajax_login'),
    path('auth/signup/', views.ajax_signup, name='ajax_signup'),

    path('api/suggestions/submit/', views.api_submit_image_suggestion, name='api_submit_image_suggestion'),
    path("api/monuments/images/", views.api_monument_images, name="api_monument_images"),
    path("api/monuments/images/<int:pk>/delete/", views.api_delete_monument_image, name="api_delete_monument_image"),
]

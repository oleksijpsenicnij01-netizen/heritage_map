from django.conf import settings
from django.db import models


class GameResult(models.Model):
    GAME_CHOICES = [
        ("cards", "Картки"),
        ("match_photo", "Співпадання: Назва та Фото"),
        ("match_description", "Співпадання: Назва та Опис"),
        ("chronology", "Хронологія"),
        ("location", "Де знаходиться?"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="game_results")
    region = models.CharField(max_length=120)
    game_key = models.CharField(max_length=40, choices=GAME_CHOICES)

    best_score = models.IntegerField(default=0)
    best_time_seconds = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "region", "game_key"], name="uniq_user_region_game")
        ]


class MonumentPhoto(models.Model):
    region = models.CharField(max_length=120)
    monument_id = models.CharField(max_length=120)

    image = models.ImageField(upload_to="monuments/photos/")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["region", "monument_id"]),
        ]


class MonumentImageSuggestion(models.Model):
    STATUS_CHOICES = [
        ("pending", "Очікує модерації"),
        ("approved", "Схвалено"),
        ("rejected", "Відхилено"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="image_suggestions")

    region = models.CharField(max_length=120)
    monument_id = models.CharField(max_length=120)

    user_comment = models.TextField(blank=True, default="")

    image = models.ImageField(upload_to="monuments/suggestions/")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_image_suggestions"
    )
    review_note = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["region", "monument_id"]),
        ]

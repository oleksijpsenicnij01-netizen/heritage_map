from django.contrib import admin
from django.utils import timezone
from django.utils.text import slugify

from .models import (
    GameResult,
    Monument,
    MonumentSuggestion,
    MonumentImageSuggestion,
    MonumentPhoto,
)


@admin.register(GameResult)
class GameResultAdmin(admin.ModelAdmin):
    list_display = ("user", "region", "game_key", "best_score", "best_time_seconds", "updated_at")
    list_filter = ("region", "game_key")
    search_fields = ("user__username", "user__email", "region")


@admin.register(Monument)
class MonumentAdmin(admin.ModelAdmin):
    list_display = ("id", "region", "monument_id", "name", "created_by", "created_at")
    list_filter = ("region",)
    search_fields = ("region", "monument_id", "name", "created_by__username", "created_by__email")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)


@admin.register(MonumentPhoto)
class MonumentPhotoAdmin(admin.ModelAdmin):
    list_display = ("id", "region", "monument_id", "created_at")
    list_filter = ("region",)
    search_fields = ("region", "monument_id")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)


def _unique_monument_id(region: str, name: str) -> str:
    base = slugify(name) or "monument"
    candidate = base
    i = 2
    while Monument.objects.filter(region=region, monument_id=candidate).exists():
        candidate = f"{base}-{i}"
        i += 1
    return candidate


@admin.register(MonumentSuggestion)
class MonumentSuggestionAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "region", "name", "user", "created_at", "reviewed_at", "reviewed_by")
    list_filter = ("status", "region")
    search_fields = ("name", "user__username", "user__email", "region")
    readonly_fields = ("created_at", "reviewed_at", "reviewed_by")
    actions = ("approve_selected", "reject_selected")

    def approve_selected(self, request, queryset):
        now = timezone.now()
        for s in queryset:
            if s.status == "approved":
                continue

            monument_id = _unique_monument_id(s.region, s.name)

            monument = Monument.objects.create(
                region=s.region,
                monument_id=monument_id,
                name=s.name,
                description=s.description,
                lat=s.lat,
                lng=s.lng,
                main_image=s.image,
                created_by=s.user,
            )

            MonumentPhoto.objects.create(region=monument.region, monument_id=monument.monument_id, image=s.image)

            s.status = "approved"
            s.reviewed_by = request.user
            s.reviewed_at = now
            s.save(update_fields=["status", "reviewed_by", "reviewed_at"])

    def reject_selected(self, request, queryset):
        now = timezone.now()
        for s in queryset:
            if s.status == "rejected":
                continue
            s.status = "rejected"
            s.reviewed_by = request.user
            s.reviewed_at = now
            s.save(update_fields=["status", "reviewed_by", "reviewed_at"])

    def save_model(self, request, obj, form, change):
        if change:
            old = MonumentSuggestion.objects.filter(pk=obj.pk).first()
            if old and old.status != obj.status:
                obj.reviewed_by = request.user
                obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)


@admin.register(MonumentImageSuggestion)
class MonumentImageSuggestionAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "region", "monument_id", "user", "created_at", "reviewed_at", "reviewed_by")
    list_filter = ("status", "region")
    search_fields = ("monument_id", "user__username", "user__email", "region")
    readonly_fields = ("created_at", "reviewed_at", "reviewed_by")
    actions = ("approve_selected", "reject_selected")

    def approve_selected(self, request, queryset):
        now = timezone.now()
        for s in queryset:
            if s.status == "approved":
                continue
            MonumentPhoto.objects.create(region=s.region, monument_id=s.monument_id, image=s.image)
            s.status = "approved"
            s.reviewed_by = request.user
            s.reviewed_at = now
            s.save(update_fields=["status", "reviewed_by", "reviewed_at"])

    def reject_selected(self, request, queryset):
        now = timezone.now()
        for s in queryset:
            if s.status == "rejected":
                continue
            s.status = "rejected"
            s.reviewed_by = request.user
            s.reviewed_at = now
            s.save(update_fields=["status", "reviewed_by", "reviewed_at"])

    def save_model(self, request, obj, form, change):
        if change:
            old = MonumentImageSuggestion.objects.filter(pk=obj.pk).first()
            if old and old.status != obj.status:
                obj.reviewed_by = request.user
                obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)

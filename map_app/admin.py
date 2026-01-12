from django.contrib import admin
from django.utils import timezone
from .models import GameResult, MonumentImageSuggestion, MonumentPhoto


@admin.register(GameResult)
class GameResultAdmin(admin.ModelAdmin):
    list_display = ("user", "region", "game_key", "best_score", "best_time_seconds", "updated_at")
    list_filter = ("region", "game_key")
    search_fields = ("user__username", "user__email", "region")


@admin.register(MonumentPhoto)
class MonumentPhotoAdmin(admin.ModelAdmin):
    list_display = ("id", "region", "monument_id", "created_at")
    list_filter = ("region",)
    search_fields = ("region", "monument_id")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)


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
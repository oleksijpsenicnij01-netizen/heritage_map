import json

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_http_methods

from django.contrib.auth import get_user_model, login as django_login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash

from django.utils import timezone
from .models import GameResult, MonumentImageSuggestion, Monument, MonumentSuggestion



from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_protect
from django.shortcuts import get_object_or_404


@ensure_csrf_cookie
def index(request):
    return render(request, "index.html")


def me(request):
    user = request.user

    if user.is_authenticated:
        return JsonResponse({
            "is_authenticated": True,
            "username": user.get_username(),
            "email": user.email,
        })

    return JsonResponse({"is_authenticated": False})


@require_POST
def ajax_signup(request):
    User = get_user_model()

    username = (request.POST.get("username") or "").strip()
    email = (request.POST.get("email") or "").strip()
    password1 = request.POST.get("password1") or ""
    password2 = request.POST.get("password2") or ""

    errors = {}

    if not username:
        errors["username"] = ["Вкажіть логін."]
    elif User.objects.filter(username=username).exists():
        errors["username"] = ["Такий логін уже зайнятий."]

    if password1 != password2:
        errors["password2"] = ["Паролі не співпадають."]

    if not password1:
        errors["password1"] = ["Вкажіть пароль."]

    if not errors:
        try:
            validate_password(password1)
        except ValidationError as e:
            errors["password1"] = list(e.messages)

    if errors:
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email if email else "",
        password=password1,
    )

    django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    return JsonResponse({"ok": True})


@require_POST
def ajax_login(request):
    User = get_user_model()

    login_value = (request.POST.get("login") or "").strip()
    password = request.POST.get("password") or ""

    errors = {}

    if not login_value:
        errors["login"] = ["Вкажіть логін або email."]
    if not password:
        errors["password"] = ["Вкажіть пароль."]

    if errors:
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    user = None

    user_qs = User.objects.filter(username=login_value)
    if user_qs.exists():
        candidate = user_qs.first()
        if candidate.check_password(password):
            user = candidate
    else:
        email_qs = User.objects.filter(email__iexact=login_value)
        if email_qs.exists():
            candidate = email_qs.first()
            if candidate.check_password(password):
                user = candidate

    if not user:
        return JsonResponse(
            {"ok": False, "errors": {"__all__": ["Неправильний логін/email або пароль."]}},
            status=400
        )

    if not user.is_active:
        return JsonResponse(
            {"ok": False, "errors": {"__all__": ["Акаунт вимкнено."]}},
            status=400
        )

    django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    return JsonResponse({"ok": True})


@require_http_methods(["GET", "POST"])
def api_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "unauthorized"}, status=401)

    if request.method == "GET":
        return JsonResponse({
            "ok": True,
            "username": request.user.get_username(),
            "email": request.user.email or "",
        })

    User = get_user_model()

    username = (request.POST.get("username") or "").strip()
    email = (request.POST.get("email") or "").strip()

    errors = {}

    if not username:
        errors["username"] = ["Вкажіть логін."]
    else:
        if User.objects.filter(username=username).exclude(pk=request.user.pk).exists():
            errors["username"] = ["Такий логін уже зайнятий."]

    if errors:
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    request.user.username = username
    request.user.email = email
    request.user.save(update_fields=["username", "email"])

    return JsonResponse({"ok": True})


@require_POST
def api_password(request):
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "unauthorized"}, status=401)

    old_password = request.POST.get("old_password") or ""
    new_password1 = request.POST.get("new_password1") or ""
    new_password2 = request.POST.get("new_password2") or ""

    errors = {}

    if not request.user.check_password(old_password):
        errors["old_password"] = ["Старий пароль неправильний."]

    if not new_password1:
        errors["new_password1"] = ["Вкажіть новий пароль."]

    if new_password1 != new_password2:
        errors["new_password2"] = ["Паролі не співпадають."]

    if not errors:
        try:
            validate_password(new_password1, user=request.user)
        except ValidationError as e:
            errors["new_password1"] = list(e.messages)

    if errors:
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    request.user.set_password(new_password1)
    request.user.save()
    update_session_auth_hash(request, request.user)

    return JsonResponse({"ok": True})


@require_POST
@login_required
def ajax_password(request):
    user = request.user

    old_password = request.POST.get("old_password") or ""
    new1 = request.POST.get("new_password1") or ""
    new2 = request.POST.get("new_password2") or ""

    errors = {}

    if not new1:
        errors["new_password1"] = ["Вкажіть новий пароль."]
    if new1 != new2:
        errors["new_password2"] = ["Паролі не співпадають."]

    if user.has_usable_password():
        if not old_password:
            errors["old_password"] = ["Вкажіть старий пароль."]
        elif not user.check_password(old_password):
            errors["old_password"] = ["Старий пароль неправильний."]

    if not errors:
        try:
            validate_password(new1, user=user)
        except ValidationError as e:
            errors["new_password1"] = list(e.messages)

    if errors:
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    user.set_password(new1)
    user.save()
    update_session_auth_hash(request, user)

    return JsonResponse({"ok": True})


@require_POST
@login_required
def api_password_set(request):
    user = request.user

    if user.has_usable_password():
        return JsonResponse(
            {"ok": False, "errors": {"__all__": ["Пароль уже існує. Використайте 'Змінити пароль'."]}},
            status=400
        )

    new1 = request.POST.get("new_password1") or ""
    new2 = request.POST.get("new_password2") or ""

    errors = {}

    if not new1:
        errors["new_password1"] = ["Вкажіть новий пароль."]
    if new1 != new2:
        errors["new_password2"] = ["Паролі не співпадають."]

    if not errors:
        try:
            validate_password(new1, user=user)
        except ValidationError as e:
            errors["new_password1"] = list(e.messages)

    if errors:
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    user.set_password(new1)
    user.save()
    update_session_auth_hash(request, user)

    return JsonResponse({"ok": True})


def _get_payload(request):
    ct = request.META.get("CONTENT_TYPE", "") or ""
    if "application/json" in ct:
        try:
            return json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            return {}
    return request.POST


@login_required
@require_http_methods(["POST"])
def api_submit_game_result(request):
    data = _get_payload(request)

    region = (data.get("region") or "").strip()
    game_key = (data.get("game_key") or "").strip()

    score_raw = data.get("score", 0)
    time_raw = data.get("time_seconds", None)

    try:
        score = int(score_raw)
    except Exception:
        score = 0

    time_seconds = None
    if time_raw is not None and str(time_raw).strip() != "":
        try:
            time_seconds = float(time_raw)
        except Exception:
            time_seconds = None

    valid_game_keys = {k for (k, _) in GameResult.GAME_CHOICES}
    errors = {}

    if not region:
        errors["region"] = ["Вкажіть область."]
    if game_key not in valid_game_keys:
        errors["game_key"] = ["Невірний тип гри."]

    if errors:
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    obj, created = GameResult.objects.get_or_create(
        user=request.user,
        region=region,
        game_key=game_key,
        defaults={"best_score": 0, "best_time_seconds": None},
    )

    improved = False

    if score > obj.best_score:
        obj.best_score = score
        obj.best_time_seconds = time_seconds
        improved = True
    elif score == obj.best_score and time_seconds is not None:
        if obj.best_time_seconds is None or time_seconds < obj.best_time_seconds:
            obj.best_time_seconds = time_seconds
            improved = True

    if improved:
        obj.save(update_fields=["best_score", "best_time_seconds", "updated_at"])

    return JsonResponse({
        "ok": True,
        "improved": improved,
        "best_score": obj.best_score,
        "best_time_seconds": obj.best_time_seconds,
    })


@login_required
@require_http_methods(["GET"])
def api_results_regions(request):
    regions = list(
        GameResult.objects.filter(user=request.user)
        .values_list("region", flat=True)
        .distinct()
        .order_by("region")
    )

    return JsonResponse({"ok": True, "regions": regions})


@login_required
@require_http_methods(["GET"])
def api_results_by_region(request):
    region = (request.GET.get("region") or "").strip()
    if not region:
        return JsonResponse({"ok": False, "errors": {"region": ["Вкажіть область."]}}, status=400)

    results_qs = GameResult.objects.filter(user=request.user, region=region)

    label_map = {k: v for (k, v) in GameResult.GAME_CHOICES}
    results = []
    for r in results_qs:
        results.append({
            "game_key": r.game_key,
            "game_name": label_map.get(r.game_key, r.game_key),
            "best_score": r.best_score,
            "best_time_seconds": r.best_time_seconds,
            "updated_at": r.updated_at.isoformat(),
        })

    return JsonResponse({"ok": True, "region": region, "results": results})

@login_required
@require_POST
def api_submit_image_suggestion(request):
    region = (request.POST.get("region") or "").strip()
    monument_id = (request.POST.get("monument_id") or "").strip()
    comment = (request.POST.get("comment") or "").strip()

    image = request.FILES.get("image") or request.FILES.get("file")

    errors = {}

    if not region:
        errors["region"] = ["Вкажіть область."]
    if not monument_id:
        errors["monument_id"] = ["Оберіть пам’ятку."]
    if not image:
        errors["image"] = ["Оберіть файл зображення."]

    if image:
        ct = (getattr(image, "content_type", "") or "").lower()
        ok_types = {"image/jpeg", "image/png", "image/webp"}
        if ct not in ok_types:
            errors["image"] = ["Непідтримуваний формат. Дозволено: JPG, PNG, WEBP."]

        if image.size and image.size > 5 * 1024 * 1024:
            errors["image"] = ["Файл завеликий. Максимум 5 MB."]

    if errors:
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    obj = MonumentImageSuggestion.objects.create(
        user=request.user,
        region=region,
        monument_id=monument_id,
        image=image,
        status="pending",
        reviewed_by=None,
        reviewed_at=None,
        review_note=comment,
    )

    return JsonResponse({
        "ok": True,
        "id": obj.id,
        "status": obj.status,
        "created_at": obj.created_at.isoformat(),
    })

@require_GET
def api_monument_images(request):
    region = (request.GET.get("region") or "").strip()
    monument_id = (request.GET.get("monument_id") or "").strip()

    if not region or not monument_id:
        return JsonResponse({"ok": False, "errors": {"__all__": ["region і monument_id обовʼязкові."]}}, status=400)

    qs = MonumentImageSuggestion.objects.filter(
        region=region,
        monument_id=monument_id,
        status="approved",
    ).order_by("-created_at")

    images = []
    for obj in qs:
        images.append({
            "id": obj.id,
            "url": obj.image.url,
            "created_at": obj.created_at.isoformat(),
        })

    return JsonResponse({
        "ok": True,
        "region": region,
        "monument_id": monument_id,
        "images": images,
        "can_delete": request.user.is_authenticated and request.user.is_staff,
    })


@require_POST
@csrf_protect
def api_delete_monument_image(request, pk: int):

    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({"ok": False, "error": "forbidden"}, status=403)

    obj = get_object_or_404(MonumentImageSuggestion, pk=pk)


    if obj.image:
        obj.image.delete(save=False)

    obj.delete()
    return JsonResponse({"ok": True})



@login_required
@require_POST
def api_submit_monument_suggestion(request):
    region = (request.POST.get("region") or "").strip()
    name = (request.POST.get("name") or "").strip()
    description = (request.POST.get("description") or "").strip()
    lat_raw = (request.POST.get("lat") or "").strip()
    lng_raw = (request.POST.get("lng") or "").strip()

    image = request.FILES.get("image") or request.FILES.get("file")

    errors = {}

    if not region:
        errors["region"] = ["Вкажіть область."]
    if not name:
        errors["name"] = ["Вкажіть назву."]
    if not lat_raw:
        errors["lat"] = ["Вкажіть широту."]
    if not lng_raw:
        errors["lng"] = ["Вкажіть довготу."]
    if not image:
        errors["image"] = ["Оберіть файл зображення."]

    lat = None
    lng = None

    if lat_raw:
        try:
            lat = float(lat_raw.replace(",", "."))
        except Exception:
            errors["lat"] = ["Широта має бути числом."]
    if lng_raw:
        try:
            lng = float(lng_raw.replace(",", "."))
        except Exception:
            errors["lng"] = ["Довгота має бути числом."]

    if image:
        ct = (getattr(image, "content_type", "") or "").lower()
        ok_types = {"image/jpeg", "image/png", "image/webp"}
        if ct not in ok_types:
            errors["image"] = ["Непідтримуваний формат. Дозволено: JPG, PNG, WEBP."]

        if image.size and image.size > 5 * 1024 * 1024:
            errors["image"] = ["Файл завеликий. Максимум 5 MB."]

    if errors:
        return JsonResponse({"ok": False, "errors": errors}, status=400)

    obj = MonumentSuggestion.objects.create(
        user=request.user,
        region=region,
        name=name,
        description=description,
        lat=lat,
        lng=lng,
        image=image,
        status="pending",
        reviewed_by=None,
        reviewed_at=None,
        review_note="",
    )

    return JsonResponse({"ok": True, "id": obj.id, "status": obj.status, "created_at": obj.created_at.isoformat()})


@require_GET
def api_user_monuments(request):
    region = (request.GET.get("region") or "").strip()
    if not region:
        return JsonResponse({"ok": False, "errors": {"region": ["Вкажіть область."]}}, status=400)

    qs = Monument.objects.filter(region=region).order_by("-created_at")

    monuments = []
    for m in qs:
        desc = (m.description or "").strip()
        details = f"<p>{desc}</p>" if desc else ""

        monuments.append({
            "id": m.monument_id,
            "name": m.name,
            "lat": m.lat,
            "lng": m.lng,
            "imagePath": (m.main_image.url if m.main_image else ""),
            "imageAlt": m.name,
            "details": details,
        })

    return JsonResponse({"ok": True, "region": region, "monuments": monuments})

from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from django.utils.text import slugify
from allauth.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)

        email = (data.get("email") or "").strip()
        base = email.split("@")[0] if email else "user"
        base = slugify(base)[:20] or "user"

        User = get_user_model()
        candidate = base
        i = 1
        while User.objects.filter(username=candidate).exists():
            candidate = f"{base}-{i}"
            i += 1

        user.username = candidate
        return user

    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return

        user = sociallogin.user
        if not getattr(user, "username", None):
            email = (user.email or "").strip()
            base = email.split("@")[0] if email else "user"
            base = slugify(base)[:20] or "user"

            User = get_user_model()
            candidate = base
            i = 1
            while User.objects.filter(username=candidate).exists():
                candidate = f"{base}-{i}"
                i += 1

            user.username = candidate

        try:
            sociallogin.save(request)
            raise ImmediateHttpResponse(redirect("/"))
        except Exception:
            return

from django.contrib import admin

from .models import ChangeRequest, TableMembership


@admin.register(TableMembership)
class TableMembershipAdmin(admin.ModelAdmin):
    list_display = ("table", "user", "role", "created_at")
    list_filter = ("role",)


@admin.register(ChangeRequest)
class ChangeRequestAdmin(admin.ModelAdmin):
    list_display = ("table", "session", "requester", "status", "created_at", "resolved_at")
    list_filter = ("status",)

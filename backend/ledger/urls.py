from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TableViewSet, SessionViewSet
from .me_views import MeView
from .ingest_views import IngestView
from .share_views import SharedTableView, SharedTableJoinView

router = DefaultRouter()
router.register(r"tables", TableViewSet, basename="table")
router.register(r"sessions", SessionViewSet, basename="session")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("me/ingest/", IngestView.as_view(), name="me-ingest"),
    path("shared/<str:token>/", SharedTableView.as_view(), name="shared-table"),
    path("shared/<str:token>/join/", SharedTableJoinView.as_view(), name="shared-table-join"),
    path("", include(router.urls)),
]

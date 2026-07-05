from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse
from django.views import View

FRONTEND_ROOT = settings.BASE_DIR / "static" / "frontend"


class FrontendAssetView(View):
    def get(self, request, path):
        file_path = (FRONTEND_ROOT / "assets" / path).resolve()
        if not str(file_path).startswith(str((FRONTEND_ROOT / "assets").resolve())):
            raise Http404
        if not file_path.is_file():
            raise Http404
        return FileResponse(open(file_path, "rb"))


class FrontendFileView(View):
    def get(self, request, path):
        file_path = (FRONTEND_ROOT / path).resolve()
        if not str(file_path).startswith(str(FRONTEND_ROOT.resolve())):
            raise Http404
        if not file_path.is_file():
            raise Http404
        return FileResponse(open(file_path, "rb"))


class SPAView(View):
    def get(self, request, *args, **kwargs):
        index = FRONTEND_ROOT / "index.html"
        if not index.is_file():
            return HttpResponse(
                "Frontend not built. Run ./build.sh from the project root.",
                status=503,
                content_type="text/plain",
            )
        return FileResponse(open(index, "rb"), content_type="text/html")

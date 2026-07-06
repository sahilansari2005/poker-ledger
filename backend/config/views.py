import mimetypes

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from django.views import View

FRONTEND_ROOT = settings.BASE_DIR / "static" / "frontend"

FRONTEND_CONTENT_TYPES = {
    "manifest.webmanifest": "application/manifest+json",
    "sw.js": "application/javascript",
    "registerSW.js": "application/javascript",
}


class HealthView(View):
    def get(self, request):
        return JsonResponse({"status": "ok"})


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
        content_type = FRONTEND_CONTENT_TYPES.get(
            path,
            mimetypes.guess_type(path)[0] or "application/octet-stream",
        )
        return FileResponse(open(file_path, "rb"), content_type=content_type)


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

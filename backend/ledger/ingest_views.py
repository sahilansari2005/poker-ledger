from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import cache_utils as cache
from .ingest import ingest_tables
from .serializers import IngestPayloadSerializer


class IngestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = IngestPayloadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = ingest_tables(
            request.user,
            serializer.validated_data["tables"],
            actor_id=str(request.user.pk),
        )
        cache.invalidate_tables_list(request.user.pk)
        return Response(result, status=status.HTTP_201_CREATED)

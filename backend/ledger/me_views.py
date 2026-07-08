from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LedgerUser
from .serializers import LedgerUserSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user, _ = LedgerUser.objects.get_or_create(user=request.user)
        return Response(LedgerUserSerializer(user).data)

    def patch(self, request):
        user, _ = LedgerUser.objects.get_or_create(user=request.user)
        serializer = LedgerUserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

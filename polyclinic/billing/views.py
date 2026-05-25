import hmac
import hashlib
import urllib.parse
import uuid

from django.conf import settings
from django.utils import timezone
from django.db import transaction

from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Invoice, PaymentTracking
from . import serializers
from .utils import (
    create_vnpay_payment_url,
    create_momo_payment_url,
    MOMO_ACCESS_KEY,
    MOMO_SECRET_KEY,
)


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    GET  /invoices/
    POST /invoices/
    GET  /invoices/{id}/
    PUT  /invoices/{id}/
    POST /invoices/{id}/pay/
    GET  /invoices/vnpay-return/
    POST /invoices/vnpay-ipn/
    GET  /invoices/momo-return/
    POST /invoices/momo-ipn/
    """

    queryset = Invoice.objects.select_related(
        'patient__user'
    ).prefetch_related(
        'items'
    ).order_by('-created_date')

    # =========================
    # SERIALIZER
    # =========================
    def get_serializer_class(self):
        if self.action == 'create':
            return serializers.InvoiceCreateSerializer
        if self.action == 'pay':
            return serializers.InvoicePaySerializer
        if self.action in ['update', 'partial_update']:
            return serializers.InvoiceUpdateSerializer
        return serializers.InvoiceSerializer

    # =========================
    # QUERYSET
    # =========================
    def get_queryset(self):

        # Fix Swagger
        if getattr(self, 'swagger_fake_view', False):
            return Invoice.objects.none()

        user = self.request.user

        if not user.is_authenticated:
            return Invoice.objects.none()

        query = self.queryset

        s              = self.request.query_params.get('status')
        patient_id     = self.request.query_params.get('patient_id')
        date_from      = self.request.query_params.get('date_from')
        date_to        = self.request.query_params.get('date_to')
        appointment_id = self.request.query_params.get('appointment_id')

        # =========================
        # ROLE FILTER
        # =========================
        if user.role == 'patient':
            query = query.filter(patient=user.patient_profile)

        elif user.role == 'doctor':
            query = query.filter(appointment__schedule__doctor__user=user)

        elif user.role in ['staff', 'admin']:
            pass  # xem tất cả

        else:
            return query.none()

        # =========================
        # FILTERS
        # =========================
        if s:
            query = query.filter(status=s)

        if patient_id:
            query = query.filter(patient_id=patient_id)

        if appointment_id:
            query = query.filter(appointment_id=appointment_id)

        if date_from:
            query = query.filter(created_date__date__gte=date_from)

        if date_to:
            query = query.filter(created_date__date__lte=date_to)

        return query

    # =========================
    # PAY INVOICE
    # =========================
    @action(detail=True, methods=['post'], url_path='pay')
    def pay(self, request, pk=None):

        invoice = self.get_object()

        if invoice.status == 'paid':
            return Response(
                {'error': 'Hóa đơn này đã được thanh toán.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment_method = request.data.get('payment_method')

        # ====================================
        # THANH TOÁN VNPAY
        # ====================================
        if payment_method == 'vnpay':

            tracking_order_id = f"INV_{invoice.id}_{uuid.uuid4().hex[:8].upper()}"

            PaymentTracking.objects.create(
                invoice=invoice,
                gateway='vnpay',
                order_id=tracking_order_id,
                amount=invoice.total_amount,
                status='pending'
            )

            payment_url = create_vnpay_payment_url(
                request=request,
                invoice_id=invoice.id,
                total_amount=invoice.total_amount,
                tracking_order_id=tracking_order_id
            )

            return Response({
                'message': 'Khởi tạo thanh toán VNPAY thành công.',
                'payment_url': payment_url
            })

        # ====================================
        # THANH TOÁN MOMO
        # ====================================
        if payment_method == 'momo':

            tracking_order_id = f"INV_{invoice.id}_{uuid.uuid4().hex[:8].upper()}"

            PaymentTracking.objects.create(
                invoice=invoice,
                gateway='momo',
                order_id=tracking_order_id,
                amount=invoice.total_amount,
                status='pending'
            )

            payment_url = create_momo_payment_url(
                invoice_id=invoice.id,
                total_amount=invoice.total_amount,
                tracking_order_id=tracking_order_id,
                redirect_url=settings.MOMO_REDIRECT_URL,
                ipn_url=settings.MOMO_IPN_URL,
            )

            return Response({
                'message': 'Khởi tạo thanh toán MoMo thành công.',
                'payment_url': payment_url
            })

        # ====================================
        # THANH TOÁN TẠI QUẦY / CHUYỂN KHOẢN
        # ====================================
        serializer = serializers.InvoicePaySerializer(
            invoice,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Thanh toán thành công.',
                'invoice_id': invoice.id,
                'total_amount': str(invoice.total_amount),
                'payment_method': invoice.payment_method,
                'paid_at': invoice.paid_at
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # =========================
    # VNPAY RETURN (redirect về app)
    # =========================
    @action(detail=False, methods=['get'], url_path='vnpay-return')
    def vnpay_return(self, request):

        raw_qs = request.META.get('QUERY_STRING', '')

        params = {}
        for part in raw_qs.split('&'):
            if '=' in part:
                k, v = part.split('=', 1)
                params[k] = v

        vnp_secure_hash = params.pop('vnp_SecureHash', None)
        params.pop('vnp_SecureHashType', None)

        sorted_data = dict(sorted(params.items()))
        hash_data = "&".join([f"{k}={v}" for k, v in sorted_data.items()])

        secure_hash = hmac.new(
            settings.VNPAY_HASH_SECRET.encode('utf-8'),
            hash_data.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()

        if secure_hash != vnp_secure_hash:
            return Response(
                {'status': 'error', 'message': 'Chữ ký không hợp lệ.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order_id       = urllib.parse.unquote_plus(params.get('vnp_TxnRef', ''))
        response_code  = urllib.parse.unquote_plus(params.get('vnp_ResponseCode', ''))
        transaction_no = urllib.parse.unquote_plus(params.get('vnp_TransactionNo', ''))

        try:
            tracking = PaymentTracking.objects.get(order_id=order_id)
            invoice  = tracking.invoice

            if response_code == '00':
                with transaction.atomic():
                    tracking.status         = 'success'
                    tracking.transaction_no = transaction_no
                    tracking.save()

                    if invoice.status != 'paid':
                        invoice.status         = 'paid'
                        invoice.payment_method = 'vnpay'
                        invoice.paid_at        = timezone.now()
                        invoice.save()

                return Response({
                    'status': 'success',
                    'invoice_id': invoice.id,
                    'message': f'Thanh toán thành công hóa đơn #{invoice.id}.'
                })

            tracking.status         = 'failed'
            tracking.transaction_no = transaction_no
            tracking.save()

            return Response(
                {'status': 'failed', 'message': 'Giao dịch thất bại hoặc đã bị hủy.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        except PaymentTracking.DoesNotExist:
            return Response(
                {'status': 'error', 'message': 'Không tìm thấy mã giao dịch.'},
                status=status.HTTP_404_NOT_FOUND
            )

    # =========================
    # VNPAY IPN (server-to-server)
    # =========================
    @action(
        detail=False,
        methods=['get', 'post'],
        url_path='vnpay-ipn',
        permission_classes=[]   # VNPAY gọi không có token
    )
    def vnpay_ipn(self, request):

        # VNPAY có thể gọi GET hoặc POST tùy cấu hình
        if request.method == 'POST':
            raw_qs = urllib.parse.urlencode(request.data)
        else:
            raw_qs = request.META.get('QUERY_STRING', '')

        params = {}
        for part in raw_qs.split('&'):
            if '=' in part:
                k, v = part.split('=', 1)
                params[k] = v

        vnp_secure_hash = params.pop('vnp_SecureHash', None)
        params.pop('vnp_SecureHashType', None)

        # Verify chữ ký
        sorted_data = dict(sorted(params.items()))
        hash_data = "&".join([f"{k}={v}" for k, v in sorted_data.items()])

        secure_hash = hmac.new(
            settings.VNPAY_HASH_SECRET.encode('utf-8'),
            hash_data.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()

        if secure_hash != vnp_secure_hash:
            # VNPAY yêu cầu trả đúng format này
            return Response({'RspCode': '97', 'Message': 'Invalid signature'})

        order_id       = urllib.parse.unquote_plus(params.get('vnp_TxnRef', ''))
        response_code  = urllib.parse.unquote_plus(params.get('vnp_ResponseCode', ''))
        transaction_no = urllib.parse.unquote_plus(params.get('vnp_TransactionNo', ''))
        vnp_amount     = urllib.parse.unquote_plus(params.get('vnp_Amount', '0'))

        try:
            tracking = PaymentTracking.objects.get(order_id=order_id)
            invoice  = tracking.invoice

            # Kiểm tra số tiền khớp không (VNPAY gửi x100)
            expected_amount = int(float(invoice.total_amount) * 100)
            if int(vnp_amount) != expected_amount:
                return Response({'RspCode': '04', 'Message': 'Invalid amount'})

            # Đã xử lý trước đó rồi
            if invoice.status == 'paid':
                return Response({'RspCode': '02', 'Message': 'Order already confirmed'})

            if response_code == '00':
                with transaction.atomic():
                    tracking.status         = 'success'
                    tracking.transaction_no = transaction_no
                    tracking.save()

                    invoice.status         = 'paid'
                    invoice.payment_method = 'vnpay'
                    invoice.paid_at        = timezone.now()
                    invoice.save()
            else:
                tracking.status         = 'failed'
                tracking.transaction_no = transaction_no
                tracking.save()

            # Luôn trả 00 để VNPAY biết đã nhận IPN
            return Response({'RspCode': '00', 'Message': 'Confirm Success'})

        except PaymentTracking.DoesNotExist:
            return Response({'RspCode': '01', 'Message': 'Order not found'})

    # =========================
    # MOMO RETURN (redirect)
    # =========================
    @action(detail=False, methods=['get'], url_path='momo-return')
    def momo_return(self, request):

        params = request.query_params.dict()

        order_id       = params.get('orderId', '')
        result_code    = params.get('resultCode', '')
        transaction_id = params.get('transId', '')

        raw_signature = (
            f"accessKey={MOMO_ACCESS_KEY}"
            f"&amount={params.get('amount', '')}"
            f"&extraData={params.get('extraData', '')}"
            f"&message={params.get('message', '')}"
            f"&orderId={order_id}"
            f"&orderInfo={params.get('orderInfo', '')}"
            f"&orderType={params.get('orderType', '')}"
            f"&partnerCode={params.get('partnerCode', '')}"
            f"&payType={params.get('payType', '')}"
            f"&requestId={params.get('requestId', '')}"
            f"&responseTime={params.get('responseTime', '')}"
            f"&resultCode={result_code}"
            f"&transId={transaction_id}"
        )

        signature = hmac.new(
            MOMO_SECRET_KEY.encode('utf-8'),
            raw_signature.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        if signature != params.get('signature', ''):
            return Response(
                {'error': 'Chữ ký không hợp lệ.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return self._process_momo_result(order_id, result_code, transaction_id)

    # =========================
    # MOMO IPN (server-to-server)
    # =========================
    @action(detail=False, methods=['post'], url_path='momo-ipn')
    def momo_ipn(self, request):

        params         = request.data
        order_id       = params.get('orderId', '')
        result_code    = str(params.get('resultCode', ''))
        transaction_id = str(params.get('transId', ''))

        return self._process_momo_result(order_id, result_code, transaction_id)

    # =========================
    # XỬ LÝ KẾT QUẢ CHUNG MOMO
    # =========================
    def _process_momo_result(self, order_id, result_code, transaction_id):

        try:
            tracking = PaymentTracking.objects.get(order_id=order_id)
            invoice  = tracking.invoice

            if result_code == '0':
                with transaction.atomic():
                    tracking.status         = 'success'
                    tracking.transaction_no = str(transaction_id)
                    tracking.save()

                    if invoice.status != 'paid':
                        invoice.status         = 'paid'
                        invoice.payment_method = 'momo'
                        invoice.paid_at        = timezone.now()
                        invoice.save()

                return Response({
                    'status': 'success',
                    'message': f'Thanh toán thành công hóa đơn #{invoice.id}.'
                })

            tracking.status         = 'failed'
            tracking.transaction_no = str(transaction_id)
            tracking.save()

            return Response(
                {'status': 'failed', 'message': 'Giao dịch thất bại hoặc bị hủy.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        except PaymentTracking.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy mã giao dịch.'},
                status=status.HTTP_404_NOT_FOUND
            )
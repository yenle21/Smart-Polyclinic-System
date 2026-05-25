import hmac
import hashlib
import urllib.parse
import uuid

from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.http import HttpResponse

from rest_framework import viewsets, status
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


def _vnpay_build_hash(params: dict, secret_key: str) -> str:
    inputData = sorted(params.items())
    hasData = ''
    seq = 0
    for key, val in inputData:
        if str(key).startswith('vnp_'):
            if seq == 1:
                hasData = hasData + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                hasData = str(key) + '=' + urllib.parse.quote_plus(str(val))

    byteKey  = secret_key.encode('utf-8')
    byteData = hasData.encode('utf-8')
    return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()




class InvoiceViewSet(viewsets.ModelViewSet):

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

        if user.role == 'patient':
            query = query.filter(patient=user.patient_profile)
        elif user.role == 'doctor':
            query = query.filter(appointment__schedule__doctor__user=user)
        elif user.role in ['staff', 'admin']:
            pass
        else:
            return query.none()

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

        # Thanh toán tại quầy / chuyển khoản
        serializer = serializers.InvoicePaySerializer(invoice, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Thanh toán thành công.',
                'invoice_id': invoice.id,
                'total_amount': str(invoice.total_amount),
                'payment_method': invoice.payment_method,
                'paid_at': invoice.paid_at
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # =========================
    # VNPAY RETURN
    # =========================
    @action(detail=False, methods=['get'], url_path='vnpay-return')
    def vnpay_return(self, request):

        params = request.GET.dict()
        vnp_secure_hash = params.pop('vnp_SecureHash', None)
        params.pop('vnp_SecureHashType', None)

        if not vnp_secure_hash:
            return _payment_result_page(False, 'Thiếu chữ ký xác thực.')

        computed_hash = _vnpay_build_hash(params, settings.VNPAY_HASH_SECRET)
        if computed_hash != vnp_secure_hash:
            return _payment_result_page(False, 'Chữ ký không hợp lệ.')

        order_id       = params.get('vnp_TxnRef', '')
        response_code  = params.get('vnp_ResponseCode', '')
        transaction_no = params.get('vnp_TransactionNo', '')

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

                return _payment_result_page(
                    True,
                    'Giao dịch của bạn đã được xử lý thành công.',
                    f'Mã hóa đơn: #{invoice.id}<br>Mã giao dịch: {transaction_no}'
                )

            tracking.status         = 'failed'
            tracking.transaction_no = transaction_no
            tracking.save()

            return _payment_result_page(
                False,
                'Giao dịch không thành công. Vui lòng thử lại.',
                f'Mã lỗi: {response_code}<br>Mã đơn hàng: {order_id}'
            )

        except PaymentTracking.DoesNotExist:
            return _payment_result_page(False, 'Không tìm thấy thông tin giao dịch.')

    # =========================
    # VNPAY IPN
    # =========================
    @action(
        detail=False,
        methods=['get', 'post'],
        url_path='vnpay-ipn',
        permission_classes=[]
    )
    def vnpay_ipn(self, request):

        if request.method == 'POST':
            params = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
        else:
            params = request.GET.dict()

        vnp_secure_hash = params.pop('vnp_SecureHash', None)
        params.pop('vnp_SecureHashType', None)

        if not vnp_secure_hash:
            return Response({'RspCode': '97', 'Message': 'Invalid signature'})

        computed_hash = _vnpay_build_hash(params, settings.VNPAY_HASH_SECRET)
        if computed_hash != vnp_secure_hash:
            return Response({'RspCode': '97', 'Message': 'Invalid signature'})

        order_id       = params.get('vnp_TxnRef', '')
        response_code  = params.get('vnp_ResponseCode', '')
        transaction_no = params.get('vnp_TransactionNo', '')
        vnp_amount     = params.get('vnp_Amount', '0')

        try:
            tracking = PaymentTracking.objects.get(order_id=order_id)
            invoice  = tracking.invoice

            expected_amount = int(float(invoice.total_amount) * 100)
            if int(vnp_amount) != expected_amount:
                return Response({'RspCode': '04', 'Message': 'Invalid amount'})

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

            return Response({'RspCode': '00', 'Message': 'Confirm Success'})

        except PaymentTracking.DoesNotExist:
            return Response({'RspCode': '01', 'Message': 'Order not found'})

    # =========================
    # MOMO RETURN
    # =========================
    @action(detail=False, methods=['get'], url_path='momo-return')
    def momo_return(self, request):

        params         = request.GET.dict()
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
            return _payment_result_page(False, 'Chữ ký không hợp lệ.')

        return self._process_momo_result(order_id, result_code, transaction_id, as_html=True)

    # =========================
    # MOMO IPN
    # =========================
    @action(detail=False, methods=['post'], url_path='momo-ipn')
    def momo_ipn(self, request):

        params         = request.data
        order_id       = params.get('orderId', '')
        result_code    = str(params.get('resultCode', ''))
        transaction_id = str(params.get('transId', ''))

        # IPN là server-to-server → trả JSON
        return self._process_momo_result(order_id, result_code, transaction_id, as_html=False)

    # =========================
    # XỬ LÝ KẾT QUẢ CHUNG MOMO
    # =========================
    def _process_momo_result(self, order_id, result_code, transaction_id, as_html=False):

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

                if as_html:
                    return _payment_result_page(
                        True,
                        'Giao dịch của bạn đã được xử lý thành công.',
                        f'Mã hóa đơn: #{invoice.id}<br>Mã giao dịch: {transaction_id}'
                    )
                return Response({
                    'status': 'success',
                    'message': f'Thanh toán thành công hóa đơn #{invoice.id}.'
                })

            tracking.status         = 'failed'
            tracking.transaction_no = str(transaction_id)
            tracking.save()

            if as_html:
                return _payment_result_page(
                    False,
                    'Giao dịch không thành công hoặc đã bị hủy.',
                    f'Mã đơn hàng: {order_id}'
                )
            return Response(
                {'status': 'failed', 'message': 'Giao dịch thất bại hoặc bị hủy.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        except PaymentTracking.DoesNotExist:
            if as_html:
                return _payment_result_page(False, 'Không tìm thấy thông tin giao dịch.')
            return Response(
                {'error': 'Không tìm thấy mã giao dịch.'},
                status=status.HTTP_404_NOT_FOUND
            )

def _payment_result_page(success: bool, message: str, detail: str = '') -> HttpResponse:
    """Trả về trang HTML thông báo kết quả thanh toán."""
    if success:
        icon        = '✅'
        title       = 'Thanh toán thành công'
        color       = '#22c55e'
        bg_color    = '#f0fdf4'
        border_color = '#bbf7d0'
    else:
        icon        = '❌'
        title       = 'Thanh toán thất bại'
        color       = '#ef4444'
        bg_color    = '#fef2f2'
        border_color = '#fecaca'

    html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title}</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f3f4f6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }}
        .card {{
            background: white;
            border-radius: 16px;
            padding: 40px 32px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }}
        .icon {{ font-size: 64px; margin-bottom: 16px; }}
        h1 {{
            font-size: 22px;
            font-weight: 700;
            color: {color};
            margin-bottom: 12px;
        }}
        .message {{
            font-size: 15px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 20px;
        }}
        .detail {{
            background: {bg_color};
            border: 1px solid {border_color};
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 13px;
            color: #444;
            line-height: 1.6;
        }}
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">{icon}</div>
        <h1>{title}</h1>
        <p class="message">{message}</p>
        {"<div class='detail'>" + detail + "</div>" if detail else ""}
    </div>
</body>
</html>"""
    return HttpResponse(html, content_type='text/html; charset=utf-8')

import hmac
import hashlib
import urllib.parse
import uuid
import json
import urllib.request
from datetime import datetime

from django.conf import settings


# ====================================
# MOMO CONSTANTS (Sandbox)
# ====================================
MOMO_PARTNER_CODE = "MOMO"
MOMO_ACCESS_KEY   = "F8BBA842ECF85"
MOMO_SECRET_KEY   = "K951B6PE1waDMi640xX08PD3vg6EkVlz"
MOMO_ENDPOINT     = "https://test-payment.momo.vn/v2/gateway/api/create"


# ====================================
# VNPAY
# ====================================
def create_vnpay_payment_url(request, invoice_id, total_amount, tracking_order_id):

    amount_vnd = int(round(float(total_amount)))
    amount_xu  = amount_vnd * 100

    vnp_params = {
        'vnp_Version':    '2.1.0',
        'vnp_Command':    'pay',
        'vnp_TmnCode':    settings.VNPAY_TMN_CODE,
        'vnp_Amount':     str(amount_xu),
        'vnp_CreateDate': datetime.now().strftime('%Y%m%d%H%M%S'),
        'vnp_CurrCode':   'VND',
        'vnp_IpAddr':     '1.1.1.1',
        'vnp_Locale':     'vn',
        'vnp_OrderInfo':  f'ThanhToanHoaDon{invoice_id}',
        'vnp_OrderType':  'other',
        'vnp_ReturnUrl':  settings.VNPAY_RETURN_URL,
        'vnp_TxnRef':     str(tracking_order_id),
    }

    # Bước 1: Sort A-Z
    inputData = sorted(vnp_params.items())

    # Bước 2 + 3: Build queryString dùng quote_plus — y chang vnpay.py gốc
    # queryString vừa dùng để tính hash, vừa dùng làm URL
    queryString = ''
    seq = 0
    for key, val in inputData:
        if seq == 1:
            queryString = queryString + "&" + key + '=' + urllib.parse.quote_plus(str(val))
        else:
            seq = 1
            queryString = key + '=' + urllib.parse.quote_plus(str(val))

    # Bước 4: HMAC-SHA512 trên queryString (đã encoded) — y chang get_payment_url gốc
    byteKey  = settings.VNPAY_HASH_SECRET.encode('utf-8')
    byteData = queryString.encode('utf-8')
    secure_hash = hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()

    return f"{settings.VNPAY_PAYMENT_URL}?{queryString}&vnp_SecureHash={secure_hash}"


# ====================================
# MOMO
# ====================================
def create_momo_payment_url(invoice_id, total_amount, tracking_order_id, redirect_url, ipn_url):

    order_id     = tracking_order_id
    order_info   = f"ThanhToanHoaDon{invoice_id}"
    amount       = str(int(round(float(total_amount))))
    request_id   = str(uuid.uuid4())
    request_type = "payWithMethod"
    extra_data   = ""

    raw_signature = (
        f"accessKey={MOMO_ACCESS_KEY}"
        f"&amount={amount}"
        f"&extraData={extra_data}"
        f"&ipnUrl={ipn_url}"
        f"&orderId={order_id}"
        f"&orderInfo={order_info}"
        f"&partnerCode={MOMO_PARTNER_CODE}"
        f"&redirectUrl={redirect_url}"
        f"&requestId={request_id}"
        f"&requestType={request_type}"
    )

    signature = hmac.new(
        MOMO_SECRET_KEY.encode('utf-8'),
        raw_signature.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    data = {
        "partnerCode": MOMO_PARTNER_CODE,
        "partnerName": "Test",
        "storeId":     "MomoTestStore",
        "requestId":   request_id,
        "amount":      amount,
        "orderId":     order_id,
        "orderInfo":   order_info,
        "redirectUrl": redirect_url,
        "ipnUrl":      ipn_url,
        "lang":        "vi",
        "autoCapture": True,
        "extraData":   extra_data,
        "requestType": request_type,
        "signature":   signature,
    }

    body = json.dumps(data).encode('utf-8')
    req  = urllib.request.Request(
        MOMO_ENDPOINT,
        data=body,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )

    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))

    return result.get('payUrl', '')
---
title: "How to get order status types"
source: https://docs.psrestful.com/guides/order-status/how-to-get-order-status-types
category: guide
crawled_at: 2026-01-22T11:27:50.643Z
---

[Guides](/guides "Guides")[Order Status](/guides/order-status/how-to-get-order-status-details "Order Status")How to get order status types

# Function getOrderStatusTypes

In order to get `all order status types` for a given supplier we need to use Order Status Service(ORDSTAT). Our API allows easy access by a `GET` request to our `order-status-types` endpoint.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/order-status-types/](https://api.psrestful.com/v1.0.0/suppliers/%7BSUPPLIER_CODE%7D/order-status-types/)[](#url-httpsapipsrestfulcomv100supplierssupplier_codeorder-status-types)

### Example Response:[](#example-response)

This is the response from calling with:  
`SUPPLIER_CODE` = `PCNA`

**COMPLETE URL**:

```
https://api.psrestful.com/v1.0.0/suppliers/PCNA/order-status-types/
```

```
{
    "StatusArray": {
        "Status": [
            {
                "id": 10,
                "name": "Order Received"
            },
            {
                "id": 20,
                "name": "Order Confirmed"
            },
            {
                "id": 42,
                "name": "Proof Hold"
            },
            {
                "id": 60,
                "name": "In Production"
            },
            {
                "id": 75,
                "name": "Order has shipped in Part"
            },
            {
                "id": 75,
                "name": "Partial Shipment"
            },
            {
                "id": 80,
                "name": "Complete"
            },
            {
                "id": 99,
                "name": "Canceled"
            }
        ]
    },
    "errorMessage": null
}
```

[How to get order status details](/guides/order-status/how-to-get-order-status-details "How to get order status details")[How to get order shipment notification](/guides/order-shipment-notification/how-to-get-order-shipment-notifications "How to get order shipment notification")

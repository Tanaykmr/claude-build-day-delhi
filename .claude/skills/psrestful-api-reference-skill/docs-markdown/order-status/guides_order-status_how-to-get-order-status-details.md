---
title: "How to get order status details"
source: https://docs.psrestful.com/guides/order-status/how-to-get-order-status-details
category: guide
crawled_at: 2026-01-22T11:27:49.750Z
---

[Guides](/guides "Guides")Order StatusHow to get order status details

# How to get order status details

### Educational video from PromoStandards[](#educational-video-from-promostandards)

---

## Function getOrderStatusDetails[](#function-getorderstatusdetails)

In order to get `order status detail` for a given supplier we need to use Order Status Service(ODRSTAT). Our API allows easy access by a `GET` request to our `order-status-details` endpoint.

## Query Types[](#query-types)

| query_type | Short Name         | PSRESTful          | Description                                                                                          |
| ---------- | ------------------ | ------------------ | ---------------------------------------------------------------------------------------------------- |
| 1          | PO Search          | PO_SEARCH          | Query based on customer provided purchase order number.                                              |
| 2          | SO Search          | SO_SEARCH          | Query based on vendor assigned sales order number.                                                   |
| 3          | Last Update Search | LAST_UPDATE_SEARCH | Query based on all orders with an update time greater than the value specified in `statusTimeStamp`. |
| 4          | All Open Search    | ALL_OPEN_SEARCH    | Query based on all orders that currently have a status other than “Complete” and “Cancelled”.        |

You can use it in several ways. If you know the `Purchase Order` or `Sales Order` you can pass that paremeter and also use the query type accordingly to `PO_SEARCH` or `SO_SEARCH`. One very useful is to query by `ALL_OPEN_SEARCH`, in that case, the supplier will sending all the open Orders.

Of course, you can also search using `LAST_UPDATE_SEARCH` in combination with `status_timestamp`.

In summary, `ALL_OPEN_SEARCH` and `LAST_UPDATE_SEARCH` can be used to prepare a CRON Job so you can keep your system updated. `PO_SEARCH` and `SO_SEARCH` are useful to create a UI displaying the information for an order.

---

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/order-status-details/](https://api.psrestful.com/v1.0.0/suppliers/%7BSUPPLIER_CODE%7D/order-status-details/)[](#url-httpsapipsrestfulcomv100supplierssupplier_codeorder-status-details)

### Example Response:[](#example-response)

This is the response from calling with:  
`SUPPLIER_CODE` = `PCNA`  
`query_type` = `ALL_OPEN_SEARCH`

**COMPLETE URL**:

```
https://api.psrestful.com/v1.0.0/suppliers/PCNA/order-status-details/?query_type=ALL_OPEN_SEARCH
```

```
{
    "OrderStatusArray": {
        "OrderStatus": [
            {
                "purchaseOrderNumber": "PO043557",
                "OrderStatusDetailArray": {
                    "OrderStatusDetail": [
                        {
                            "factoryOrderNumber": "35865767",
                            "statusID": 80,
                            "statusName": "Complete",
                            "responseRequired": null,
                            "validTimestamp": "2023-05-24T17:19:32.370000+00:00",
                            "expectedShipDate": "2023-05-24T23:59:00+00:00",
                            "expectedDeliveryDate": null,
                            "ResponseToArray": null,
                            "additionalExplanation": "Order has shipped in full—No further updates will be given"
                        }
                    ]
                }
            },
            {
                "purchaseOrderNumber": "3900",
                "OrderStatusDetailArray": {
                    "OrderStatusDetail": [
                        {
                            "factoryOrderNumber": "35900100",
                            "statusID": 80,
                            "statusName": "Complete",
                            "responseRequired": null,
                            "validTimestamp": "2023-07-03T21:19:02.887000+00:00",
                            "expectedShipDate": "2023-07-03T23:59:00+00:00",
                            "expectedDeliveryDate": null,
                            "ResponseToArray": null,
                            "additionalExplanation": "Order has shipped in full—No further updates will be given"
                        }
                    ]
                }
            }
        ]
    },
    "ErrorMessage": null
}
```

[How to place a Purchase Order for a sample order](/guides/purchase-order/send-po/place-sample-order "How to place a Purchase Order for a sample order")[How to get order status types](/guides/order-status/how-to-get-order-status-types "How to get order status types")

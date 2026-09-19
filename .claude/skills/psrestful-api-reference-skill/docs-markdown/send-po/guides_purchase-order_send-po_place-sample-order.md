---
title: "How to place a Purchase Order for a sample order"
source: https://docs.psrestful.com/guides/purchase-order/send-po/place-sample-order
category: guide
crawled_at: 2026-01-22T11:26:13.583Z
---

[Guides](/guides "Guides")Purchase Order[send-po](/guides/purchase-order/send-po/place-blank-order "send-po")How to place a Purchase Order for a sample order

# How to place a Sample Purchase Order

### Educational video from PromoStandards[](#educational-video-from-promostandards)

# Function SendPO

In order to send a purchase order for `sample` goods we need to use Purchase Order Service(PO). Our API allows easy access by a `POST` request to our `send_po` endpoint. Very similar to blank goods but the configuration type of the order should change.

You need to use authentication in order to use this service. More information on how to authenticate can be found [here](/authentication).

### HTTP VERB: `POST`[](#http-verb-post)

### URL: [https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/purchase-orders/](https://api.psrestful.com/v1.0.0/suppliers/%7BSUPPLIER_CODE%7D/purchase-orders/)[](#url-httpsapipsrestfulcomv100supplierssupplier_codepurchase-orders)

### Example Response:[](#example-response)

This is the response from calling with:  
`SUPPLIER_CODE` = `HIT`

### Payload[](#payload)

```
{
  "orderType": "Sample",
  "orderNumber": "59",
  "orderDate": "2023-06-15T17:47:26.102Z",
  "lastModified": "2023-06-15T17:47:26.102Z",
  "totalAmount": 309.60,
  "paymentTerms": "NET60",
  "rush": false,
  "currency": "USD",
  "DigitalProof": null,
  "OrderContactArray": {
    "Contact": [
      {
        "contactType": "Order",
        "ContactDetails": {
          "attentionTo": "John Doe",
          "companyName": "My Company",
          "address1": "Address 1",
          "address2": "Address 2",
          "city": "City",
          "region": "State",
          "postalCode": "zip code",
          "country": "US",
          "email": "me@mycompany.com",
          "phone": "",
          "comments": ""
        },
        "accountName": null,
        "accountNumber": null
      }
    ]
  },
  "ShipmentArray": {
    "Shipment": [
      {
        "ShipTo": {
          "customerPickup": false,
          "shipmentId": 0,
          "ContactDetails": {
            "attentionTo": "John Doe",
            "companyName": "My Company",
            "address1": "Address 1",
            "address2": "Address 2",
            "city": "City",
            "region": "State",
            "postalCode": "Zip Code",
            "country": "US",
            "email": "me@mycompany.com",
            "phone": "",
            "comments": ""
          }
        },
        "packingListRequired": true,
        "blindShip": true,
        "allowConsolidation": true,
        "FreightDetails": {
          "carrier": "UPS",
          "service": "Ground"
        },
        "ThirdPartyAccount": null,
        "shipReferences": null,
        "comments": "string"
      }
    ]
  },
  "LineItemArray": {
    "LineItem": [
      {
        "lineNumber": "1",
        "description": "10 units of 2811BLK",
        "lineType": "New",
        "Quantity": {
          "value": 100,
          "uom": "EA"
        },
        "fobId": "1",
        "ToleranceDetails": {
          "tolerance": "ExactOnly",
          "value": 0,
          "uom": "Percent"
        },
        "allowPartialShipments": false,
        "unitPrice": 3.096,
        "lineItemTotal": 309.60,
        "requestedShipDate": "2023-06-15",
        "requestedInHandsDate": "2023-06-25",
        "referenceSalesQuote": null,
        "Program": null,
        "endCustomerSalesOrder": "4343",
        "productId": "30070",
        "customerProductId": "1996",
        "lineItemGroupingId": null,
        "PartArray": {
          "Part": [
            {
              "partId": "30070BLK",
              "Quantity": {
                "value": 100,
                "uom": "EA"
              },
              "partGroup": "",
              "customerPartId": "",
              "customerSupplied": true,
              "description": "",
              "locationLinkId": [
                0
              ],
              "unitPrice": 3.096,
              "extendedPrice": 309.60,
              "ShipmentLinkArray": {
                "ShipmentLink": [
                  {
                    "shipmentId": 1,
                    "Quantity": {
                      "value": 100,
                      "uom": "EA"
                    }
                  }
                ]
              }
            }
          ]
        },
        "Configuration": null
      }
    ]
  },
  "termsAndConditions": "terms agreed to",
  "salesChannel": null,
  "promoCode": null,
  "TaxInformationArray": null
}
```

**COMPLETE URL**:

```
https://api.psrestful.com/v1.0.0/suppliers/HIT/purchase-orders/
```

## Response[](#response)

```
{
    "transactionId": "115867",
    "ServiceMessageArray": {
        "ServiceMessage": [
            {
                "code": 999,
                "description": "General Error - Contact the System Service Provider Details: **WARNING* Fix: Multiple Models for XXX, must confirm",
                "severity": "Warning"
            }
        ]
    }
}
```

[How to place a Purchase Order for a configured order](/guides/purchase-order/send-po/place-configured-order "How to place a Purchase Order for a configured order")[How to get order status details](/guides/order-status/how-to-get-order-status-details "How to get order status details")

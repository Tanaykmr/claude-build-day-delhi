---
title: "How to place a Purchase Order for a configured order"
source: https://docs.psrestful.com/guides/purchase-order/send-po/place-configured-order
category: guide
crawled_at: 2026-01-22T11:26:12.681Z
---

[Guides](/guides "Guides")Purchase Order[send-po](/guides/purchase-order/send-po/place-blank-order "send-po")How to place a Purchase Order for a configured order

# How to place a Configured Purchase Order

### Educational video from PromoStandards[](#educational-video-from-promostandards)

# Function SendPO

In order to send a purchase order for `Configured` orders we need to use Purchase Order Service(PO). Our API allows easy access by a `POST` request to our `send_po` endpoint. Very similar to blank goods but the configuration type of the order should change.

You need to use authentication in order to use this service. More information on how to authenticate can be found [here](/authentication).

### HTTP VERB: `POST`[](#http-verb-post)

### URL: [https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/purchase-orders/](https://api.psrestful.com/v1.0.0/suppliers/%7BSUPPLIER_CODE%7D/purchase-orders/)[](#url-httpsapipsrestfulcomv100supplierssupplier_codepurchase-orders)

### Example Response:[](#example-response)

This is the response from calling with:  
`SUPPLIER_CODE` = `HIT`

### Payload[](#payload)

```
{
    "environment": "PROD",
    "orderType": "Configured",
    "orderNumber": "BHF1",
    "orderDate": "2024-03-28T00:17:41.015Z",
    "lastModified": "2024-03-28T00:17:41.015Z",
    "totalAmount": 0,
    "paymentTerms": "NET30",
    "rush": false,
    "currency": "USD",
    "DigitalProof": {
      "required": true,
      "DigitalProofAddressArray": {
        "DigitalProofAddress": [
          {
            "type": "Email",
            "email": "email@example.com",
            "lineItemGroupingId": 0
          }
        ]
      }
    },
    "OrderContactArray": {
      "Contact": [
        {
          "contactType": "Art",
          "ContactDetails": {
            "attentionTo": "[Name]",
            "companyName": "[Company Name]",
            "address1": "[Address1]",
            "city": "",
            "region": "[FL]",
            "postalCode": "",
            "country": "US",
            "email": "email@example.com",
            "phone": "phone number"
          },
          "accountName": "Gallardo Solutions Corp",
          "accountNumber": ""
        },
        {
          "contactType": "Order",
          "ContactDetails": {
            "attentionTo": "Name",
            "companyName": "Name",
            "address1": "",
            "city": "",
            "region": "GA",
            "postalCode": "",
            "country": "US",
            "email": "",
            "phone": "",
            "comments": ""
          },
          "accountName": "Gallardo Solutions Corp",
          "accountNumber": ""
        }
      ]
    },
    "ShipmentArray": {
      "Shipment": [
        {
          "ShipTo": {
            "customerPickup": true,
            "shipmentId": 0,
            "ContactDetails": {
              "attentionTo": "[NAME]",
              "companyName": "[COMPANY NAME]",
              "address1": "[ADDRESS1]",
              "address2": "",
              "address3": "",
              "city": "[CITY]",
              "region": "[STATE]",
              "postalCode": "[POSTAL CODE]",
              "country": "US",
              "email": "[EMAIL]",
              "phone": "[PHONE]",
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
          "ThirdPartyAccount": null
        }
      ]
    },
    "LineItemArray": {
      "LineItem": [
        {
          "referenceSalesQuote": null,
          "Program": null,
          "endCustomerSalesOrder": null,
          "lineNumber": "1",
          "description": "Whistle Light/Key Chain",
          "lineType": "New",
          "Quantity": {
            "value": 250,
            "uom": "EA"
          },
          "ToleranceDetails": {
            "tolerance": "AllowOverRun",
            "value": 0,
            "uom": "Percent"
          },
          "allowPartialShipments": true,
          "unitPrice": 0.726,
          "lineItemTotal": 181.5,
          "requestedShipDate": "2024-03-28",
          "requestedInHandsDate": "2024-03-28",
          "productId": "72",
          "customerProductId": "72",
          "lineItemGroupingId": 0,
          "PartArray": {
            "Part": [
              {
                "partGroup": null,
                "partId": "0072PUR",
                "Quantity": {
                  "value": 250,
                  "uom": "EA"
                },
                "unitPrice": 0,
                "extendedPrice": 0,
                "customerPartId": "0072PUR",
                "customerSupplied": false,
                "description": "Whistle Light/Key Chain",
                "locationLinkId": [1],
                "ShipmentLinkArray": {
                  "ShipmentLink": [
                    {
                      "shipmentId": 0,
                      "Quantity": {
                        "value": 250,
                        "uom": "EA"
                      }
                    }
                  ]
                }
              }
            ]
          },
          "Configuration": {
            "referenceNumber": "",
            "referenceNumberType": "PurchaseOrder",
            "preProductionProof": false,
            "ChargeArray": {
              "Charge": [
                {
                  "chargeId": "4830907",
                  "chargeName": "PAD PRINT",
                  "description": "PAD PRINT",
                  "chargeType": "Setup",
                  "Quantity": {
                    "value": 1,
                    "uom": "EA"
                  },
                  "unitPrice": 0,
                  "extendedPrice": 0
                }
              ]
            },
            "LocationArray": {
              "Location": [
                {
                  "locationLinkId": 1,
                  "locationId": 53,
                  "locationName": "SIDE1",
                  "DecorationArray": {
                    "Decoration": [
                      {
                        "decorationId": 819101,
                        "decorationName": "PAD PRINT",
                        "Artwork": {
                          "instructions": "WHITE COLOR",
                          "Layers": null,
                          "TypesetArray": null,
                          "totalStitchCount": null,
                          "refArtworkId": "",
                          "description": "",
                          "Dimensions": {
                            "geometry": "Rectangle",
                            "useMaxLocationDimensions": true,
                            "height": 0,
                            "width": 0,
                            "diameter": 0,
                            "uom": "INCH"
                          },
                          "ArtworkFileArray": {
                            "ArtworkFile": [
                              {
                                "fileName": "logo",
                                "fileLocation": "https://xxx.s3.amazonaws.com/xxx+logo.ai",
                                "transportMechanism": "Url",
                                "artworkType": "ProductionReady"
                              }
                            ]
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        }
      ]
    },
    "termsAndConditions": "terms agreed to",
    "salesChannel": "API",
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
    "ServiceMessageArray": null
}
```

[How to place a Purchase Order for blank goods](/guides/purchase-order/send-po/place-blank-order "How to place a Purchase Order for blank goods")[How to place a Purchase Order for a sample order](/guides/purchase-order/send-po/place-sample-order "How to place a Purchase Order for a sample order")

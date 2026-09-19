---
title: "How to get FOB points"
source: https://docs.psrestful.com/guides/ppc/how-to-get-fob-points
category: guide
crawled_at: 2026-01-22T11:21:34.303Z
---

[Guides](/guides "Guides")[PPC](/guides/ppc/how-to-get-pricing-and-configuration "PPC")Get FOB Points

# How to get FOB points

## Function getFobPoints[](#function-getfobpoints)

FOB (Free On Board) points represent the shipping origin locations where products can be shipped from. In order to get all the FOB points for a given product we need to use Product, Pricing and Configuration service (PPC). Our API allows easy access by a `GET` request to our `fob-points` endpoint.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/fob-points/{PRODUCT_ID}/](https://api.psrestful.com/v1.0.0/suppliers/%7BSUPPLIER_CODE%7D/fob-points/%7BPRODUCT_ID%7D/)[](#url-httpsapipsrestfulcomv100supplierssupplier_codefob-pointsproduct_id)

### Query Parameters[](#query-parameters)

| Parameter               | Type   | Required | Description                                        |
| ----------------------- | ------ | -------- | -------------------------------------------------- |
| `localization_country`  | string | No       | Country code (default: `US`)                       |
| `localization_language` | string | No       | Language code (default: `en`)                      |
| `environment`           | string | No       | Environment: `PROD` or `STAGING` (default: `PROD`) |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v1.0.0/suppliers/alphabroder/fob-points/C1717/" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

This is the response from calling with: `SUPPLIER_CODE` = `alphabroder` `PRODUCT_ID` = `C1717`

The response has been truncated to show 3 FOB points:

```
{
    "FobPointArray": {
        "FobPoint": [
            {
                "fobId": "BX",
                "fobPostalCode": "06610",
                "fobCity": "BRIDGEPORT",
                "fobState": "CT",
                "fobCountry": "US",
                "CurrencySupportedArray": {
                    "CurrencySupported": [
                        {
                            "currency": "USD"
                        }
                    ]
                },
                "ProductArray": {
                    "Product": [
                        {
                            "productId": "C1717"
                        }
                    ]
                }
            },
            {
                "fobId": "CC",
                "fobPostalCode": "60490",
                "fobCity": "Bolingbrook",
                "fobState": "IL",
                "fobCountry": "US",
                "CurrencySupportedArray": {
                    "CurrencySupported": [
                        {
                            "currency": "USD"
                        }
                    ]
                },
                "ProductArray": {
                    "Product": [
                        {
                            "productId": "C1717"
                        }
                    ]
                }
            },
            {
                "fobId": "CN",
                "fobPostalCode": "93725",
                "fobCity": "FRESNO",
                "fobState": "CA",
                "fobCountry": "US",
                "CurrencySupportedArray": {
                    "CurrencySupported": [
                        {
                            "currency": "USD"
                        }
                    ]
                },
                "ProductArray": {
                    "Product": [
                        {
                            "productId": "C1717"
                        }
                    ]
                }
            }
        ]
    },
    "ErrorMessage": null
}
```

## Response Structure[](#response-structure)

| Field                    | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `FobPointArray`          | Array of FOB (shipping origin) points                       |
| `fobId`                  | Unique identifier for the FOB point (used in pricing calls) |
| `fobPostalCode`          | Postal code of the warehouse                                |
| `fobCity`                | City of the warehouse                                       |
| `fobState`               | State/province of the warehouse                             |
| `fobCountry`             | Country of the warehouse                                    |
| `CurrencySupportedArray` | Currencies available at this location                       |
| `ProductArray`           | Products available at this FOB point                        |

## Use Cases[](#use-cases)

- **Shipping optimization**: Choose the closest warehouse to reduce shipping costs
- **Pricing requests**: `fob_id` is required when calling [Get Pricing and Configuration](/guides/ppc/how-to-get-pricing-and-configuration)
- **Inventory availability**: Know which warehouses stock the product

## Typical Workflow[](#typical-workflow)

1.  Call this endpoint to get available FOB points for a product
2.  Select the appropriate `fobId` based on shipping destination
3.  Use the `fobId` when calling [Get Pricing and Configuration](/guides/ppc/how-to-get-pricing-and-configuration)

## Related Guides[](#related-guides)

- [Get Pricing and Configuration](/guides/ppc/how-to-get-pricing-and-configuration) - Use `fob_id` to get pricing
- [Get Available Locations](/guides/ppc/how-to-get-all-available-locations) - Get decoration locations
- [Get Available Charges](/guides/ppc/how-to-get-all-available-charges) - Get additional charges
- [Get Decoration Colors](/guides/ppc/how-to-get-decoration-colors) - Get available decoration colors

[Get Pricing and Configuration](/guides/ppc/how-to-get-pricing-and-configuration "Get Pricing and Configuration")[Get Available Locations](/guides/ppc/how-to-get-all-available-locations "Get Available Locations")

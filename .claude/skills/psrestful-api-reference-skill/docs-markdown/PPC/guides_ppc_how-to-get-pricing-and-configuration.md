---
title: "How to get configuration and pricing"
source: https://docs.psrestful.com/guides/ppc/how-to-get-pricing-and-configuration
category: guide
crawled_at: 2026-01-22T11:21:33.446Z
---

[Guides](/guides "Guides")PPCGet Pricing and Configuration

# How to get configuration and pricing

### Educational video from PromoStandards[](#educational-video-from-promostandards)

---

## Function GetConfigurationAndPricing[](#function-getconfigurationandpricing)

In order to get configuration and pricing for a given product we need to use Product, Pricing and Configuration service (PPC). Our API allows easy access by a `GET` request to our `pricing-and-configuration` endpoint.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/pricing-and-configuration/{PRODUCT_ID}/](https://api.psrestful.com/v1.0.0/suppliers/%7BSUPPLIER_CODE%7D/pricing-and-configuration/%7BPRODUCT_ID%7D/)[](#url-httpsapipsrestfulcomv100supplierssupplier_codepricing-and-configurationproduct_id)

### Query Parameters[](#query-parameters)

| Parameter               | Type   | Required | Description                                                             |
| ----------------------- | ------ | -------- | ----------------------------------------------------------------------- |
| `currency`              | string | Yes      | Currency code (e.g., `USD`, `CAD`)                                      |
| `fob_id`                | string | Yes      | FOB point ID (get from [FOB Points](/guides/ppc/how-to-get-fob-points)) |
| `price_type`            | string | Yes      | `Customer` or `List`. Customer pricing requires supplier credentials    |
| `configuration_type`    | string | No       | `Blank` or `Decorated` (default: `Decorated`)                           |
| `part_id`               | string | No       | Filter pricing for a specific part/variant                              |
| `localization_country`  | string | No       | Country code (default: `US`)                                            |
| `localization_language` | string | No       | Language code (default: `en`)                                           |
| `environment`           | string | No       | Environment: `PROD` or `STAGING` (default: `PROD`)                      |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v1.0.0/suppliers/alphabroder/pricing-and-configuration/SM-3534/?currency=USD&price_type=List&configuration_type=Blank&fob_id=33013" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

This is the response from calling with: `SUPPLIER_CODE` = `alphabroder` `PRODUCT_ID` = `SM-3534`

The response has been truncated to show 2 FOB points:

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
            }
        ]
    },
    "ErrorMessage": null
}
```

## Response Structure[](#response-structure)

| Field                                 | Description                                        |
| ------------------------------------- | -------------------------------------------------- |
| `FobPointArray`                       | Array of FOB (shipping origin) points with pricing |
| `fobId`                               | FOB point identifier                               |
| `fobPostalCode`                       | Postal code of the FOB location                    |
| `fobCity` / `fobState` / `fobCountry` | Location details                                   |
| `CurrencySupportedArray`              | Currencies available at this FOB point             |
| `ProductArray`                        | Products available at this FOB point               |

## Price Types[](#price-types)

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `List`     | Standard list pricing (no credentials required)         |
| `Customer` | Your negotiated pricing (requires supplier credentials) |

## Configuration Types[](#configuration-types)

| Type        | Description                          |
| ----------- | ------------------------------------ |
| `Blank`     | Pricing for undecorated products     |
| `Decorated` | Pricing including decoration/imprint |

## Typical Workflow[](#typical-workflow)

1.  Get [FOB Points](/guides/ppc/how-to-get-fob-points) to find available shipping origins
2.  Get [Available Locations](/guides/ppc/how-to-get-all-available-locations) to find decoration locations
3.  Get [Available Charges](/guides/ppc/how-to-get-all-available-charges) to understand additional fees
4.  Call this endpoint with the required parameters to get pricing

## Related Guides[](#related-guides)

- [Get FOB Points](/guides/ppc/how-to-get-fob-points) - Get shipping origin points (required for `fob_id`)
- [Get Available Locations](/guides/ppc/how-to-get-all-available-locations) - Get decoration locations
- [Get Available Charges](/guides/ppc/how-to-get-all-available-charges) - Get additional charges
- [Get Decoration Colors](/guides/ppc/how-to-get-decoration-colors) - Get available decoration colors

[Get Media Modified Since](/guides/media-content/how-to-get-media-modified-since "Get Media Modified Since")[Get FOB Points](/guides/ppc/how-to-get-fob-points "Get FOB Points")

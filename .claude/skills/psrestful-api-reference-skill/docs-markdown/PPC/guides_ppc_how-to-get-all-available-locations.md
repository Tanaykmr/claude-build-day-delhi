---
title: "How to get all available locations"
source: https://docs.psrestful.com/guides/ppc/how-to-get-all-available-locations
category: guide
crawled_at: 2026-01-22T11:21:35.232Z
---

[Guides](/guides "Guides")[PPC](/guides/ppc/how-to-get-pricing-and-configuration "PPC")Get Available Locations

# How to get all available locations

## Function getAvailableLocations[](#function-getavailablelocations)

In order to get all the available decoration locations for a particular product we need to use Product, Pricing and Configuration service (PPC). Our API allows easy access by a `GET` request to our `available-locations` endpoint.

Decoration locations represent where on a product you can apply an imprint (e.g., Front, Back, Left Sleeve).

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/available-locations/{PRODUCT_ID}/](https://api.psrestful.com/v1.0.0/suppliers/%7BSUPPLIER_CODE%7D/available-locations/%7BPRODUCT_ID%7D/)[](#url-httpsapipsrestfulcomv100supplierssupplier_codeavailable-locationsproduct_id)

### Query Parameters[](#query-parameters)

| Parameter               | Type   | Required | Description                                        |
| ----------------------- | ------ | -------- | -------------------------------------------------- |
| `localization_country`  | string | No       | Country code (default: `US`)                       |
| `localization_language` | string | No       | Language code (default: `en`)                      |
| `environment`           | string | No       | Environment: `PROD` or `STAGING` (default: `PROD`) |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v1.0.0/suppliers/HIT/available-locations/7746/" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

This is the response from calling with: `SUPPLIER_CODE` = `HIT` `PRODUCT_ID` = `7746`

```
{
    "AvailableLocationArray": {
        "AvailableLocation": [
            {
                "locationId": 8,
                "locationName": "FRONT"
            },
            {
                "locationId": 9,
                "locationName": "BACK"
            }
        ]
    },
    "ErrorMessage": null
}
```

## Response Structure[](#response-structure)

| Field                    | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `AvailableLocationArray` | Array of available decoration locations                      |
| `locationId`             | Unique identifier for the location (used in other PPC calls) |
| `locationName`           | Human-readable name of the location                          |

## Common Location Names[](#common-location-names)

| Location     | Description              |
| ------------ | ------------------------ |
| FRONT        | Front of the product     |
| BACK         | Back of the product      |
| LEFT SLEEVE  | Left sleeve (apparel)    |
| RIGHT SLEEVE | Right sleeve (apparel)   |
| POCKET       | Pocket area              |
| WRAP         | Full wrap around product |

## Use Cases[](#use-cases)

- **Decoration planning**: Determine where imprints can be placed on a product
- **Quote generation**: Know available locations before getting pricing
- **Order placement**: Use `locationId` when placing decorated orders

## Typical Workflow[](#typical-workflow)

1.  Call this endpoint to get available locations for a product
2.  Use `locationId` when calling [Get Decoration Colors](/guides/ppc/how-to-get-decoration-colors)
3.  Use location information when getting [Pricing and Configuration](/guides/ppc/how-to-get-pricing-and-configuration)

## Related Guides[](#related-guides)

- [Get Decoration Colors](/guides/ppc/how-to-get-decoration-colors) - Get colors available at a location
- [Get Available Charges](/guides/ppc/how-to-get-all-available-charges) - Get decoration charges
- [Get Pricing and Configuration](/guides/ppc/how-to-get-pricing-and-configuration) - Get full pricing details
- [Get FOB Points](/guides/ppc/how-to-get-fob-points) - Get shipping origin points

[Get FOB Points](/guides/ppc/how-to-get-fob-points "Get FOB Points")[Get Available Charges](/guides/ppc/how-to-get-all-available-charges "Get Available Charges")

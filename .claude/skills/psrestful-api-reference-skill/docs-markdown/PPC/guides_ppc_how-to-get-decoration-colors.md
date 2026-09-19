---
title: "How to get decoration colors"
source: https://docs.psrestful.com/guides/ppc/how-to-get-decoration-colors
category: guide
crawled_at: 2026-01-22T11:21:37.076Z
---

[Guides](/guides "Guides")[PPC](/guides/ppc/how-to-get-pricing-and-configuration "PPC")Get Decoration Colors

# How to get decoration colors

## Function getDecorationColors[](#function-getdecorationcolors)

In order to get possible decoration colors for a particular product at a specific location, we need to use Product, Pricing and Configuration service (PPC). Our API allows easy access by a `GET` request to our `decoration-colors` endpoint.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/decoration-colors/{PRODUCT_ID}/](https://api.psrestful.com/v1.0.0/suppliers/%7BSUPPLIER_CODE%7D/decoration-colors/%7BPRODUCT_ID%7D/)[](#url-httpsapipsrestfulcomv100supplierssupplier_codedecoration-colorsproduct_id)

### Query Parameters[](#query-parameters)

| Parameter               | Type    | Required | Description                                                                                  |
| ----------------------- | ------- | -------- | -------------------------------------------------------------------------------------------- |
| `location_id`           | integer | Yes      | Location ID (get from [Available Locations](/guides/ppc/how-to-get-all-available-locations)) |
| `decoration_id`         | integer | No       | Filter by specific decoration method                                                         |
| `localization_country`  | string  | No       | Country code (default: `US`)                                                                 |
| `localization_language` | string  | No       | Language code (default: `en`)                                                                |
| `environment`           | string  | No       | Environment: `PROD` or `STAGING` (default: `PROD`)                                           |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v1.0.0/suppliers/HIT/decoration-colors/55414/?location_id=53" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

This is the response from calling with: `SUPPLIER_CODE` = `HIT` `PRODUCT_ID` = `55414` `location_id` = `53`

The response has been truncated to show 5 colors:

```
{
    "DecorationColors": {
        "productId": "55414",
        "locationId": "53",
        "pmsMatch": true,
        "fullColor": true,
        "ColorArray": {
            "Color": [
                {
                    "colorName": "Athletic Gold",
                    "hex": null,
                    "approximatePms": null,
                    "standardColorName": null
                },
                {
                    "colorName": "Black",
                    "hex": null,
                    "approximatePms": null,
                    "standardColorName": null
                },
                {
                    "colorName": "Navy Blue",
                    "hex": null,
                    "approximatePms": null,
                    "standardColorName": null
                },
                {
                    "colorName": "Red",
                    "hex": null,
                    "approximatePms": null,
                    "standardColorName": null
                },
                {
                    "colorName": "White",
                    "hex": null,
                    "approximatePms": null,
                    "standardColorName": null
                }
            ]
        },
        "DecorationMethodArray": {
            "DecorationMethod": [
                {
                    "decorationId": 3471228,
                    "decorationName": "Pad Print"
                },
                {
                    "decorationId": 3471229,
                    "decorationName": "Laser Engrave"
                }
            ]
        }
    },
    "ErrorMessage": null
}
```

## Response Structure[](#response-structure)

| Field                   | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `productId`             | Product identifier                                     |
| `locationId`            | Location identifier for the decoration                 |
| `pmsMatch`              | Whether PMS color matching is available                |
| `fullColor`             | Whether full-color printing is available               |
| `ColorArray`            | Array of available colors                              |
| `DecorationMethodArray` | Array of decoration methods available at this location |

## Color Fields[](#color-fields)

| Field               | Description                   |
| ------------------- | ----------------------------- |
| `colorName`         | Name of the color             |
| `hex`               | Hex color code (if available) |
| `approximatePms`    | Approximate PMS color match   |
| `standardColorName` | Standardized color name       |

## Typical Workflow[](#typical-workflow)

1.  Get [Available Locations](/guides/ppc/how-to-get-all-available-locations) to find decoration locations
2.  Call this endpoint with the `location_id` to get available colors
3.  Use color and decoration information when placing orders

## Use Cases[](#use-cases)

- **Design mockups**: Know what colors are available for decoration
- **Customer presentations**: Show available imprint colors
- **Order placement**: Specify valid colors when ordering

## Related Guides[](#related-guides)

- [Get Available Locations](/guides/ppc/how-to-get-all-available-locations) - Get decoration locations (required for `location_id`)
- [Get Available Charges](/guides/ppc/how-to-get-all-available-charges) - Get decoration charges
- [Get Pricing and Configuration](/guides/ppc/how-to-get-pricing-and-configuration) - Get full pricing details
- [Get FOB Points](/guides/ppc/how-to-get-fob-points) - Get shipping origin points

[Get Available Charges](/guides/ppc/how-to-get-all-available-charges "Get Available Charges")[Get Inventory Levels](/guides/inventory/how-to-get-inventory-levels "Get Inventory Levels")

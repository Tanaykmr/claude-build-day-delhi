---
title: "How to get all available charges"
source: https://docs.psrestful.com/guides/ppc/how-to-get-all-available-charges
category: guide
crawled_at: 2026-01-22T11:21:36.223Z
---

[Guides](/guides "Guides")[PPC](/guides/ppc/how-to-get-pricing-and-configuration "PPC")Get Available Charges

# How to get all available charges

## Function getAvailableCharges[](#function-getavailablecharges)

In order to get all the available charges for a particular product we need to use Product, Pricing and Configuration service (PPC). Our API allows easy access by a `GET` request to our `available-charges` endpoint.

Charges represent additional fees for decoration, setup, rush orders, and other services.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/available-charges/{PRODUCT_ID}/](https://api.psrestful.com/v1.0.0/suppliers/%7BSUPPLIER_CODE%7D/available-charges/%7BPRODUCT_ID%7D/)[](#url-httpsapipsrestfulcomv100supplierssupplier_codeavailable-chargesproduct_id)

### Query Parameters[](#query-parameters)

| Parameter               | Type   | Required | Description                                        |
| ----------------------- | ------ | -------- | -------------------------------------------------- |
| `localization_country`  | string | No       | Country code (default: `US`)                       |
| `localization_language` | string | No       | Language code (default: `en`)                      |
| `environment`           | string | No       | Environment: `PROD` or `STAGING` (default: `PROD`) |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v1.0.0/suppliers/HIT/available-charges/55414/" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

This is the response from calling with: `SUPPLIER_CODE` = `HIT` `PRODUCT_ID` = `55414`

```
{
    "AvailableChargeArray": {
        "AvailableCharge": [
            {
                "chargeId": 8046412,
                "chargeName": "Pad Print",
                "chargeType": "Setup",
                "chargeDescription": "Pad Print"
            },
            {
                "chargeId": 8046413,
                "chargeName": "Laser Engrave",
                "chargeType": "Setup",
                "chargeDescription": "Laser Engrave"
            },
            {
                "chargeId": 8046414,
                "chargeName": "INDIVIDUAL PERSONALIZATION",
                "chargeType": "Run",
                "chargeDescription": "DECORATION"
            },
            {
                "chargeId": 8046415,
                "chargeName": "PERSONALIZATION",
                "chargeType": "Setup",
                "chargeDescription": "SETUP"
            }
        ]
    },
    "errorMessage": null
}
```

## Response Structure[](#response-structure)

| Field                  | Description                      |
| ---------------------- | -------------------------------- |
| `AvailableChargeArray` | Array of available charges       |
| `chargeId`             | Unique identifier for the charge |
| `chargeName`           | Name of the charge               |
| `chargeType`           | Type of charge: `Setup` or `Run` |
| `chargeDescription`    | Description of the charge        |

## Charge Types[](#charge-types)

| Type    | Description                                                    |
| ------- | -------------------------------------------------------------- |
| `Setup` | One-time charge per order (e.g., screen setup, plate creation) |
| `Run`   | Per-unit charge (e.g., per-item decoration, personalization)   |

## Common Charge Names[](#common-charge-names)

| Charge          | Description                      |
| --------------- | -------------------------------- |
| Pad Print       | Pad printing setup/run charge    |
| Laser Engrave   | Laser engraving setup/run charge |
| Screen Print    | Screen printing setup/run charge |
| Embroidery      | Embroidery setup/run charge      |
| Rush            | Rush order surcharge             |
| Personalization | Individual item personalization  |

## Use Cases[](#use-cases)

- **Quote generation**: Include all applicable charges in quotes
- **Order cost calculation**: Calculate total order cost including decoration charges
- **Customer communication**: Show customers what additional fees apply

## Related Guides[](#related-guides)

- [Get Available Locations](/guides/ppc/how-to-get-all-available-locations) - Get decoration locations
- [Get Decoration Colors](/guides/ppc/how-to-get-decoration-colors) - Get available decoration colors
- [Get Pricing and Configuration](/guides/ppc/how-to-get-pricing-and-configuration) - Get full pricing details
- [Get FOB Points](/guides/ppc/how-to-get-fob-points) - Get shipping origin points

[Get Available Locations](/guides/ppc/how-to-get-all-available-locations "Get Available Locations")[Get Decoration Colors](/guides/ppc/how-to-get-decoration-colors "Get Decoration Colors")

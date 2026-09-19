# How to get configuration and pricing

Source: https://docs.psrestful.com/guides/ppc/how-to-get-pricing-and-configuration
Category: guide

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

---

# How to get FOB points

Source: https://docs.psrestful.com/guides/ppc/how-to-get-fob-points
Category: guide

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

---

# How to get all available locations

Source: https://docs.psrestful.com/guides/ppc/how-to-get-all-available-locations
Category: guide

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

---

# How to get all available charges

Source: https://docs.psrestful.com/guides/ppc/how-to-get-all-available-charges
Category: guide

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

---

# How to get decoration colors

Source: https://docs.psrestful.com/guides/ppc/how-to-get-decoration-colors
Category: guide

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

---

# PPC 1.0.0 REFERENCE

Source: https://docs.psrestful.com/standards/ppc-1.0.0
Category: reference

[Standards](/standards "Standards")PPC 1.0.0

# PROMOTIONAL PRODUCTS DATA INTERFACE SPECIFICATION FOR WEB SERVICES

![PromoStandards Logo](/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fpromo-standards-logo.3eeccfef.png&w=640&q=75)

## Product Configuration, Decoration, and Pricing[](#product-configuration-decoration-and-pricing)

### Version Details:[](#version-details)

- **Version**: 1.0.0
- **Date**: 2017-07-19

### Document Change Log:[](#document-change-log)

- **Initial Release**: 07/19/17
- **Design**: Eric Shonebarger (CIO Hit Promotional Products, Inc) and Eric Alessi (Essent Corporation).

### Contributors:[](#contributors)

- **Design**:
  - Eric Shonebarger
  - Eric Alessi
- **Contributions**:
  - Paul Fleischman (Technical Lead PCNA)
  - Jon Norris (VP of Operations, Starline)

### Abstract:[](#abstract)

This document describes the technologies for integration of suppliers and distributors in the Promotional Products Industry. This document will discuss in detail the technology required in order to build the interface. Additionally, this document will provide sample code in order to use the interface.

This document will assume that the reader is fluent in web based technologies, and has knowledge of the language they plan to consume the web service in.

### Background Information[](#background-information)

All specifications will be built using the Simple Object Access Protocol (SOAP) over HTTPS as the foundation for the web services protocol stack in order to provide a standards based secure form of communication.

More information on SOAP can be found at [http://www.w3.org/TR/soap12-part1/](http://www.w3.org/TR/soap12-part1/)

### Service Details:[](#service-details)

- **Function [getAvailableLocations](#function-getavailablelocations)**: Provides names of locations for a given product.
- **Function [getDecorationColors](#function-getdecorationcolors)**: Describes possible decoration colors for a product.

### Additional Functions:[](#additional-functions)

- **Function [getFobPoints](#function-getfobpoints)**: Returns information about FOB points for a product.
- **Function [getAvailableCharges](#function-getavailablecharges)**: Provides a list of charges and information on how to calculate them.

### Configuration and Pricing:[](#configuration-and-pricing)

- **Function [getConfigurationAndPricing](#function-getconfigurationandpricing)**: Provides the pricing and configuration of a product.

---

## Function: getAvailableLocations()[](#function-getavailablelocations)

This function provides the names of locations for a given product.

### Request: GetAvailableLocationsRequest[](#request-getavailablelocationsrequest)

| Field                | Description                                                                             | WSDL Data Type | SQL Data Type | Required? |
| -------------------- | --------------------------------------------------------------------------------------- | -------------- | ------------- | --------- |
| wsVersion            | The Standard Version of the Web Service being referenced. Values are enumerated {1.0.0} | STRING         | VARCHAR(64)   | TRUE      |
| id                   | The customerId or any other agreed upon Id.                                             | STRING         | VARCHAR(64)   | TRUE      |
| password             | The password associated with the customerId.                                            | STRING         | VARCHAR(64)   | FALSE     |
| productId            | The product id for which to get the locations                                           | STRING         | VARCHAR(64)   | TRUE      |
| localizationCountry  | ISO 3166-1 Alpha 2 code for Country Example: CA=Canada; US=United States                | STRING         | VARCHAR(2)    | TRUE      |
| localizationLanguage | ISO 639-1 Alpha 2 code for Language. Example: en = English; fr = French                 | STRING         | VARCHAR(2)    | TRUE      |

### Reply: GetAvailableLocationsResponse[](#reply-getavailablelocationsresponse)

| Field                                        | Description                                                                                                | WSDL Data Type | SQL Data Type | Required? |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------- | ------------- | --------- |
| [AvailableLocationArray](#availablelocation) | An array of locations                                                                                      | ARRAY          | ARRAY         | TRUE      |
| [ErrorMessage](#errormessage)                | List of possible values for errors. Values are enumerated—See Appendix A: Error Messages for full details. | STRING         | VARCHAR(256)  | FALSE     |

## AvailableLocation[](#availablelocation)

This array provides details about the available locations for a given product.

| Field        | Description                 | WSDL Data Type | SQL Data Type | Required? |
| ------------ | --------------------------- | -------------- | ------------- | --------- |
| locationId   | A unique Id of the location | INT            | INT           | TRUE      |
| locationName | The name of the location    | STRING         | VARCHAR(64)   | TRUE      |

---

## Function: getDecorationColors()[](#function-getdecorationcolors)

This function describes possible decoration colors given a `productId`.

### Request: GetDecorationColorsRequest[](#request-getdecorationcolorsrequest)

| Field                | Description                                                                                                                     | WSDL Data Type | SQL Data Type | Required? |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------- | --------- |
| wsVersion            | The Standard Version of the Web Service being referenced. Values are enumerated: {1.0.0}                                        | STRING         | VARCHAR(64)   | TRUE      |
| id                   | The customerId or any other agreed upon Id.                                                                                     | STRING         | VARCHAR(64)   | TRUE      |
| password             | The password associated with the customerId.                                                                                    | STRING         | VARCHAR(64)   | FALSE     |
| locationId           | The Id of the location                                                                                                          | INT            | INT           | TRUE      |
| productId            | ProductId to filter down to a specific product. If left blank, the function will return all decoration colors for all products. | STRING         | VARCHAR(64)   | TRUE      |
| decorationId         | The Id of the decoration to filter requests by                                                                                  | INT            | INT           | FALSE     |
| localizationCountry  | ISO 3166-1 Alpha 2 code for Country Example: CA=Canada; US=United States                                                        | STRING         | VARCHAR(2)    | TRUE      |
| localizationLanguage | ISO 639-1 Alpha 2 code for Language. Example: en = English; fr = French                                                         | STRING         | VARCHAR(2)    | TRUE      |

### Reply: GetDecorationColorsResponse[](#reply-getdecorationcolorsresponse)

| Field                         | Description                                                                                                | WSDL Data Type | SQL Data Type | Required? |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------- | ------------- | --------- |
| [DecorationColors](#color)    | The object with decoration colors                                                                          | ARRAY          | ARRAY         | FALSE     |
| [ErrorMessage](#errormessage) | List of possible values for errors. Values are enumerated—See Appendix A: Error Messages for full details. |                |               | FALSE     |

| Field                                      | Description                                                                                                    | WSDL Data Type | SQL Data Type | Required? |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------- | ------------- | --------- |
| [DecorationColors](#color)                 | The object with decoration colors                                                                              | ARRAY          | ARRAY         | TRUE      |
| productId                                  | The Id of the product.                                                                                         | STRING         | VARCHAR(64)   | TRUE      |
| locationId                                 | The Id of the location that was provided                                                                       | STRING         | VARCHAR(64)   | TRUE      |
| [DecorationMethodArray](#decorationmethod) | An array of decoration methods for the location                                                                | ARRAY          | ARRAY         | TRUE      |
| pmsMatch                                   | TRUE, if PMS match is possible                                                                                 | BOOLEAN        | BOOLEAN       | TRUE      |
| fullColor                                  | Set to true if the decoration method is full color process; False implies that number of colors is irrelevant. | BOOLEAN        | BOOLEAN       | TRUE      |

### Color[](#color)

| Field     | Description                             | WSDL Data Type | SQL Data Type | Required? |
| --------- | --------------------------------------- | -------------- | ------------- | --------- |
| colorId   | A unique Id of the color of the imprint | INT            | INT           | TRUE      |
| colorName | The name of the imprint color           | STRING         | VARCHAR(64)   | TRUE      |

### DecorationMethod[](#decorationmethod)

| Field          | Description                   | WSDL Data Type | SQL Data Type | Required? |
| -------------- | ----------------------------- | -------------- | ------------- | --------- |
| decorationId   | A unique Id of the decoration | INT            | INT           | TRUE      |
| decorationName | The name of the decoration    | STRING         | VARCHAR(64)   | TRUE      |

---

## Function: getFobPoints()[](#function-getfobpoints)

This function will return basic information about FOB points for a given product.

### Request: GetFobPointsRequest[](#request-getfobpointsrequest)

| Field                | Description                                                                              | WSDL Data Type | SQL Data Type | Required? |
| -------------------- | ---------------------------------------------------------------------------------------- | -------------- | ------------- | --------- |
| wsVersion            | The Standard Version of the Web Service being referenced. Values are enumerated: {1.0.0} | STRING         | VARCHAR(64)   | TRUE      |
| id                   | The customerId or any other agreed upon Id.                                              | STRING         | VARCHAR(64)   | TRUE      |
| password             | The password associated with the customerId.                                             | STRING         | VARCHAR(64)   | FALSE     |
| productId            | The productId you are requesting FOB points for                                          | STRING         | VARCHAR(64)   | TRUE      |
| localizationCountry  | ISO 3166-1 Alpha 2 code for Country Example: CA=Canada; US=United States                 | STRING         | VARCHAR(2)    | TRUE      |
| localizationLanguage | ISO 639-1 Alpha 2 code for Language. Example: en = English; fr = French                  | STRING         | VARCHAR(2)    | TRUE      |

### Reply: GetFobPointsResponse[](#reply-getfobpointsresponse)

| Field                         | Description                                                                                                | WSDL Data Type | SQL Data Type | Required? |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------- | ------------- | --------- |
| [FobPointArray](#fobpoint)    | Array of fob Points                                                                                        | ARRAY          | ARRAY         | FALSE     |
| [ErrorMessage](#errormessage) | List of possible values for errors. Values are enumerated—See Appendix A: Error Messages for full details. | STRING         | VARCHAR(256)  | FALSE     |

### FobPoint[](#fobpoint)

| Field                                        | Description                                                    | WSDL Data Type | SQL Data Type | Required? |
| -------------------------------------------- | -------------------------------------------------------------- | -------------- | ------------- | --------- |
| fobId                                        | The Id of the FOB Point                                        | STRING         | VARCHAR(64)   | TRUE      |
| fobPostalCode                                | The Postal or Zip Code of the fob Point                        | STRING         | VARCHAR(64)   | TRUE      |
| fobCity                                      | The city of the FOB Point                                      | STRING         | VARCHAR(64)   | TRUE      |
| fobState                                     | The state of the FOB Point in ISO 3166-2 format.               | STRING         | VARCHAR(64)   | TRUE      |
| fobCountry                                   | The country of the FOB Point in Alpha 2 ISO3166 “CODE” format. | STRING         | VARCHAR(64)   | TRUE      |
| [CurrencySupportedArray](#currencysupported) | The currencies supported for the FOB Point                     | ARRAY          | ARRAY         | TRUE      |
| [ProductArray](#product)                     | An array of productIds associated with the FOB Point           | ARRAY          | ARRAY         | TRUE      |

### Product[](#product)

| Field     | Description    | WSDL Data Type | SQL Data Type | Required? |
| --------- | -------------- | -------------- | ------------- | --------- |
| productId | The product id | STRING         | VARCHAR(64)   | TRUE      |

### CurrencySupported[](#currencysupported)

| Field    | Description                                                 | WSDL Data Type | SQL Data Type | Required? |
| -------- | ----------------------------------------------------------- | -------------- | ------------- | --------- |
| currency | The currency supported for the FOB point in ISO4217 format. | STRING         | VARCHAR(64)   | TRUE      |

---

## Function: getAvailableCharges()[](#function-getavailablecharges)

This function provides a list of charges and information on how to calculate charges. It is designed to help populate a database of charge types and design logic to calculate charges.

### Request: GetAvailableChargesRequest[](#request-getavailablechargesrequest)

| Field                | Description                                                                              | WSDL Data Type | SQL Data Type | Required? |
| -------------------- | ---------------------------------------------------------------------------------------- | -------------- | ------------- | --------- |
| wsVersion            | The Standard Version of the Web Service being referenced. Values are enumerated: {1.0.0} | STRING         | VARCHAR(64)   | TRUE      |
| id                   | The customerId or any other agreed upon Id.                                              | STRING         | VARCHAR(64)   | TRUE      |
| password             | The password associated with the customerId.                                             | STRING         | VARCHAR(64)   | FALSE     |
| productId            | The productId you are requesting charges for                                             | STRING         | VARCHAR(64)   | FALSE     |
| localizationCountry  | ISO 3166-1 Alpha 2 code for Country Example: CA=Canada; US=United States                 | STRING         | VARCHAR(2)    | TRUE      |
| localizationLanguage | ISO 639-1 Alpha 2 code for Language. Example: en = English; fr = French                  | STRING         | VARCHAR(2)    | TRUE      |

### Reply: GetAvailableChargesResponse[](#reply-getavailablechargesresponse)

| Field                                    | Description                                                                                                | WSDL Data Type | SQL Data Type | Required? |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------- | ------------- | --------- |
| [AvailableChargeArray](#availablecharge) | An array of charges                                                                                        | ARRAY          | ARRAY         | TRUE      |
| [ErrorMessage](#errormessage)            | List of possible values for errors. Values are enumerated—See Appendix A: Error Messages for full details. | STRING         | VARCHAR(256)  | FALSE     |

### AvailableCharge[](#availablecharge)

| Field             | Description                                                    | WSDL Data Type | SQL Data Type | Required? |
| ----------------- | -------------------------------------------------------------- | -------------- | ------------- | --------- |
| chargeId          | A unique Id of the charge                                      | INT            | INT           | TRUE      |
| chargeName        | The name of the charge                                         | STRING         | VARCHAR(64)   | TRUE      |
| chargeType        | The type of charge. Values are enumerated {SETUP, RUN, ORDER}. | STRING         | VARCHAR(64)   | TRUE      |
| chargeDescription | The charge description                                         | STRING         | VARCHAR(256)  | TRUE      |

---

## Function: getConfigurationAndPricing()[](#function-getconfigurationandpricing)

This function is the main function of the service and provides the pricing and configuration of a product.

### Request: GetConfigurationAndPricingRequest[](#request-getconfigurationandpricingrequest)

| Field                                     | Description                                                                                | WSDL Data Type | SQL Data Type | Required? |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ | -------------- | ------------- | --------- |
| wsVersion                                 | The Standard Version of the Web Service being referenced. Values are enumerated: {1.0.0}   | STRING         | VARCHAR(64)   | TRUE      |
| id                                        | The customerId or any other agreed upon Id.                                                | STRING         | VARCHAR(64)   | TRUE      |
| password                                  | The password associated with the customerId.                                               | STRING         | VARCHAR(64)   | FALSE     |
| productId                                 | The productId for the pricing                                                              | STRING         | VARCHAR(64)   | TRUE      |
| partId                                    | The partId                                                                                 | STRING         | VARCHAR(64)   | FALSE     |
| currency                                  | The unit of currency that the pricing should be returned in ISO4217 “CODE” format.         | STRING         | VARCHAR(64)   | TRUE      |
| fobId                                     | The fobId of the FOB point                                                                 | STRING         | VARCHAR(64)   | TRUE      |
| priceType                                 | The type of pricing that should be returned. Values are enumerated: {Customer, List, Net } | STRING         | VARCHAR(64)   | TRUE      |
| localizationCountry                       | ISO 3166-1 Alpha 2 code for Country Example: CA=Canada; US=United States                   | STRING         | VARCHAR(2)    | TRUE      |
| localizationLanguage                      | ISO 639-1 Alpha 2 code for Language. Example: en = English; fr = French                    | STRING         | VARCHAR(2)    | TRUE      |
| configurationType                         | The type of configuration of the product to be returned.                                   |
| Values are enumerated: {Blank, Decorated} | STRING                                                                                     | VARCHAR(32)    | TRUE          |

### Reply: GetConfigurationAndPricingResponse[](#reply-getconfigurationandpricingresponse)

| Field                           | Description                                                | WSDL Data Type | SQL Data Type | Required? |
| ------------------------------- | ---------------------------------------------------------- | -------------- | ------------- | --------- |
| [Configuration](#configuration) | An object to hold Configuration data.                      | OBJECT         | OBJECT        | TRUE      |
| [ErrorMessage](#errormessage)   | Response for any error requiring notification to requestor | OBJECT         | OBJECT        | FALSE     |

### Configuration[](#configuration)

| Field                           | Description                                                    | WSDL Data Type | SQL Data Type | Required? |
| ------------------------------- | -------------------------------------------------------------- | -------------- | ------------- | --------- |
| [PartArray](#partarray)         | An array of Parts and their pricing and configuration data     | ARRAY          | ARRAY         | TRUE      |
| [LocationArray](#locationarray) | An array of Locations and their pricing and configuration data | ARRAY          | ARRAY         | FALSE     |
| productId                       | The product family. This is how the part is marketed.          | STRING         | VARCHAR(64)   | TRUE      |
| currency                        | The currency the request of the request in ISO 4217 format     | STRING         | VARCHAR(64)   | TRUE      |
| [FobArray](#fobarray)           | An array of FOB points that support this configuration         | ARRAY          | ARRAY         | TRUE      |
| fobPostalCode                   | The postal code of the FOB point                               | STRING         | VARCHAR(64)   | FALSE     |

## PartArray[](#partarray)

This object contains information about a part. Parts can either be the main part, required parts, or optional parts that customers can use to configure a product. The `partId` and `partGroup` combination should be unique.

### Part[](#part)

| Field                               | Description                                                                                                                                                                                                                                                                      | WSDL Data Type | SQL Data Type  | Required? |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------- | --------- |
| partId                              | The `partId`                                                                                                                                                                                                                                                                     | STRING         | VARCHAR(64)    | TRUE      |
| partDescription                     | A description of the `partId`                                                                                                                                                                                                                                                    | STRING         | VARCHAR(128)   | FALSE     |
| [PartPriceArray](#partprice)        | An array of prices and quantities                                                                                                                                                                                                                                                | ARRAY          | ARRAY          | FALSE     |
| partGroup                           | A numeric identifier grouping mutually exclusive parts together.                                                                                                                                                                                                                 | NUMBER         | INT            | TRUE      |
| nextPartGroup                       | The next mutually exclusive `partGroup` to complete configuration of the product                                                                                                                                                                                                 | NUMBER         | INT            | FALSE     |
| partGroupRequired                   | A boolean value specifying if this `partGroup` is required for the product configuration                                                                                                                                                                                         | BOOLEAN        | BOOLEAN        | TRUE      |
| partGroupDescription                | A description of the `partGroup`. Examples: “Main Product”, “Optional Lid”, “Straw”, etc.                                                                                                                                                                                        | STRING         | VARCHAR(64)    | TRUE      |
| ratio                               | Describes how the amount of partIds that need to be added to the order based on the number of products ordered. Example: If 8 partIds would be required per 1 product ordered, then 8 should be used as the ratio. If one partId is required for every 8 products, then use .125 | DOUBLE         | DECIMAL (12,4) | TRUE      |
| defaultPart                         | This part is included in the “Basic Pricing Configuration” service price. This field is optional, but highly encouraged.                                                                                                                                                         | BOOLEAN        | BOOLEAN        | FALSE     |
| [LocationIdArray](#locationidarray) | An array of LocationIDs that are available for decoration because the selected part has been configured.                                                                                                                                                                         | ARRAY          | ARRAY          | FALSE     |

### PartPrice[](#partprice)

This object contains pricing for a product based on the `partId`. Prices are additive in nature. A configuration that requires three parts with three different prices should be summed together on the purchase order.

| Field              | Description                                                                                                                                                                                                                                             | WSDL Data Type | SQL Data Type  | Required? |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------- | --------- |
| minQuantity        | The minimum quantity for the price break.                                                                                                                                                                                                               | INT            | INT            | TRUE      |
| price              | The base price of the good without decoration                                                                                                                                                                                                           | DOUBLE         | DECIMAL (12,4) | TRUE      |
| discountCode       | The industry discount code associated with the price.                                                                                                                                                                                                   | STRING         | VARCHAR(1)     | FALSE     |
| priceUom           | Enumerated list of unit of measure used to describe the price. Values are: {BX, CA, DZ, EA, KT, PR, PK, RL, ST, SL, TH}. BX - Box, CA - Case, DZ - Dozen, EA - Each, KT - Kit, PR - Pair, PK - Package, RL - Roll, ST - Set, SL - Sleeve, TH - Thousand | STRING         | VARCHAR(2)     | TRUE      |
| priceEffectiveDate | The date the price is effective in ISO8601 format.                                                                                                                                                                                                      | DATE           | DATE           | TRUE      |
| priceExpiryDate    | The date the price is no longer effective in ISO8601 format.                                                                                                                                                                                            | DATE           | DATE           | TRUE      |

### LocationIdArray[](#locationidarray)

This is a list of locationIds that are valid based on the partID that was configured.

| Field      | Description                       | WSDL Data Type | SQL Data Type | Required? |
| ---------- | --------------------------------- | -------------- | ------------- | --------- |
| locationID | The Id of the available location. | INT            | INT           | TRUE      |

## LocationArray[](#locationarray)

This object contains information about available locations for a given product.

### Location[](#location)

| Field                               | Description                                                         | WSDL Data Type | SQL Data Type | Required? |
| ----------------------------------- | ------------------------------------------------------------------- | -------------- | ------------- | --------- |
| locationId                          | A unique Id of the location                                         | INT            | INT           | TRUE      |
| locationName                        | The name of the location                                            | STRING         | VARCHAR(64)   | TRUE      |
| [DecorationArray](#decorationarray) | An array of decorations that are available for the location.        | ARRAY          | ARRAY         | TRUE      |
| decorationsIncluded                 | The number of decorations included in the price                     | INT            | INT           | TRUE      |
| maxDecoration                       | The maximum number of decorations that can be added to the location | INT            | INT           | TRUE      |
| minDecoration                       | The minimum number of decorations that can be added to the location | INT            | INT           | TRUE      |
| locationRank                        | Popularity of location based on supplier experience                 | INT            | INT           | FALSE     |

---

### DecorationArray[](#decorationarray)

This array provides details about the decorations that are valid for a given location.

### Decoration[](#decoration)

This object contains decoration information that is valid for a specific location.

| Field                      | Description                                                                                                                                                  | WSDL Data Type | SQL Data Type  | Required? |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | -------------- | --------- |
| decorationId               | The ID of the decoration                                                                                                                                     | INT            | INT            | TRUE      |
| decorationName             | The name of the decoration                                                                                                                                   | STRING         | VARCHAR(64)    | FALSE     |
| decorationGeometry         | The geometry of the decoration. Values are enumerated: {Circle, Rectangle, Other}                                                                            | STRING         | VARCHAR(64)    | TRUE      |
| decorationHeight           | The maximum imprint height of the decoration; leave blank if the imprint is not rectangular                                                                  | DOUBLE         | DECIMAL (12,4) | FALSE     |
| decorationWidth            | The maximum imprint width of the decoration; leave blank if the imprint is not rectangular                                                                   | DOUBLE         | DECIMAL (12,4) | FALSE     |
| decorationDiameter         | The maximum imprint diameter of the decoration; leave blank if the imprint is not circular                                                                   | DOUBLE         | DECIMAL (12,4) | FALSE     |
| decorationUom              | The unit of measure for the decoration area in ISO 20022 format                                                                                              | STRING         | VARCHAR(64)    | TRUE      |
| allowSubForDefaultLocation | Buyer is allowed to substitute a decoration location without changing the price                                                                              | BOOLEAN        | BOOLEAN        | FALSE     |
| allowSubForDefaultMethod   | Buyer is allowed to substitute this decoration method without changing the price                                                                             | BOOLEAN        | BOOLEAN        | FALSE     |
| itemPartQuantityLTM        | Specifies the Part Quantity that is the absolute minimum that can be ordered with a Less Than Minimum (LTM) charge                                           | INT            | INT            | FALSE     |
| [ChargeArray](#charge)     | An array of setup charge data                                                                                                                                | ARRAY          | ARRAY          | FALSE     |
| decorationUnitsIncluded    | The number of included decoration units. For example, if 1 color decoration is included set value to “1”. If 7,500 stitches are included set value to “7500” | INT            | INT            | FALSE     |
| decorationUnitsIncludedUom | Values are enumerated: {Colors, Inches, Other, Stitches, SquareInches }                                                                                      | STRING         | STRING         | FALSE     |
| decorationUnitsMax         | This is the max number of decoration units for this decoration/location combination                                                                          | INT            | INT            | FALSE     |
| defaultDecoration          | Specifies whether this is the default decoration for this location                                                                                           | BOOLEAN        | BOOLEAN        | TRUE      |
| leadTime                   | The lead time for the given decoration                                                                                                                       | INT            | INT            | FALSE     |
| rushLeadTime               | The lead time for rush service for a given decoration (rush charges may apply)                                                                               | INT            | INT            | FALSE     |

## Charge[](#charge)

This object contains a charge that is associated with the setup of the product, location, and decoration configuration.

| Field                            | Description                                                      | WSDL Data Type | SQL Data Type | Required? |
| -------------------------------- | ---------------------------------------------------------------- | -------------- | ------------- | --------- |
| chargeId                         | The Id of the charge                                             | INT            | INT           | TRUE      |
| chargeName                       | The name of the charge                                           | STRING         | VARCHAR(64)   | TRUE      |
| chargeType                       | The type of charge. Values are enumerated `{Order, Run, Setup`}. | STRING         | VARCHAR(64)   | TRUE      |
| chargeDescription                | The charge description                                           | STRING         | VARCHAR(256)  | TRUE      |
| [ChargePriceArray](#chargeprice) | An array of charge prices                                        | ARRAY          | ARRAY         | TRUE      |
| chargesAppliesLTM                | This charge is applied with ordering Less than Minimum (LTM).    | BOOLEAN        | BOOLEAN       | TRUE      |
| chargesPerLocation               | The number of times a charge will occur per location             | INT            | INT           | FALSE     |
| chargesPerColor                  | The number of times a charge will occur per color                | INT            | INT           | FALSE     |

## ChargePrice[](#chargeprice)

This object contains a single line of a price grid represented by an X and Y axis.

| Field              | Description                                                                                                | WSDL Data Type | SQL Data Type  | Required? |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | -------------- | -------------- | --------- |
| xMinQty            | The minimum x-value quantity for this price                                                                | INT            | INT            | TRUE      |
| xUom               | The unit of measure for the x-axis. Values are enumerated: {BX, CA, DZ, EA, KT, PR, PK, RL, ST, SL, TH}    | STRING         | VARCHAR(2)     | TRUE      |
| yMinQty            | The minimum y-value quantity for this price                                                                | INT            | INT            | TRUE      |
| yUom               | The unit of measure for the y-axis. Values are enumerated: {Colors, Inches, Other, Stitches, SquareInches} | STRING         | STRING         | TRUE      |
| price              | The price of the charge                                                                                    | DOUBLE         | DECIMAL (12,4) | TRUE      |
| discountCode       | The discount code associated with the price                                                                | STRING         | VARCHAR(1)     | FALSE     |
| repeatPrice        | The price of the charge if it is a repeat order                                                            | NUMBER         | DECIMAL (12,4) | FALSE     |
| repeatDiscountCode | The discount code of the repeat price                                                                      | STRING         | VARCHAR(1)     | FALSE     |
| priceEffectiveDate | The date the price is effective in ISO8601 format                                                          | DATE           | DATE           | FALSE     |
| priceExpiryDate    | The date the price is no longer effective in ISO8601 format                                                | DATE           | DATE           | FALSE     |

## FobArray[](#fobarray)

This object contains information about the FOB (Free On Board) points that support the configuration. By default, this will always include the valid FOB point that was sent as part of the request.

### FOB Point[](#fob-point)

| Field         | Description                      | WSDL Data Type | SQL Data Type | Required? |
| ------------- | -------------------------------- | -------------- | ------------- | --------- |
| fobId         | The FOB point of the pricing     | STRING ARRAY   | VARCHAR(64)   | TRUE      |
| fobPostalCode | The postal code of the FOB point | STRING         | VARCHAR(64)   | FALSE     |

---

## Appendix A: Error Messages[](#appendix-a-error-messages)

These error messages are associated with the setup of the product, location, and decoration configuration.

### ErrorMessage[](#errormessage)

| Field       | Description                                                | WSDL Data Type | SQL Data Type | Required? |
| ----------- | ---------------------------------------------------------- | -------------- | ------------- | --------- |
| code        | The numerical value of the code                            | INT            | INT           | TRUE      |
| description | Response for any error requiring notification to requestor | STRING         | VARCHAR(256)  | FALSE     |

### Standardized Codes[](#standardized-codes)

The range of `100-199` has been reserved for standardized error codes. The number `999` has been reserved for an error code that is a “General Error - Contact System Service Provider”.

| Code | Description                                                                           |
| ---- | ------------------------------------------------------------------------------------- |
| 100  | ID (customerID) not found                                                             |
| 104  | This account is unauthorized to use this service. Please contact the service provider |
| 105  | Authentication Credentials failed                                                     |
| 110  | Authentication Credentials required                                                   |
| 115  | wsVersion not found                                                                   |
| 120  | The following field(s) are required \[Comma Delimited field names\]                   |
| 125  | Not Supported:                                                                        |
| 999  | General Error – Contact the System Service Provider Details: \[Details\]              |

### Service Specific Code[](#service-specific-code)

These error codes are only for this service.

| Code | Description                    |
| ---- | ------------------------------ |
| 400  | productID not found            |
| 401  | currencyID not found           |
| 402  | priceType not found            |
| 403  | fobId not found                |
| 404  | localizationCountry not found  |
| 405  | localizationLanguage not found |
| 406  | configurationType not found    |

## Diagrams[](#diagrams)

### getAvailableLocations Function[](#getavailablelocations-function)

### getDecorationColors Function[](#getdecorationcolors-function)

### getFobPoints Function[](#getfobpoints-function)

### getAvailableCharges Function[](#getavailablecharges-function)

### GetConfigurationAndPricing Function[](#getconfigurationandpricing-function)

---

[Media Content 1.1.0](/standards/media-content-1.1.0 "Media Content 1.1.0")[Inventory 1.2.1](/standards/inventory-1.2.1 "Inventory 1.2.1")

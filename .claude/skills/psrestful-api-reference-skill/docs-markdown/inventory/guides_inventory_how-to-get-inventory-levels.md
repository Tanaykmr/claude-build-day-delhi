---
title: "How to get inventory levels for a product"
source: https://docs.psrestful.com/guides/inventory/how-to-get-inventory-levels
category: guide
crawled_at: 2026-01-22T11:25:01.918Z
---

[Guides](/guides "Guides")InventoryGet Inventory Levels

# How to get inventory levels for a product

### Educational video from PromoStandards[](#educational-video-from-promostandards)

---

## Function getInventoryLevels[](#function-getinventorylevels)

In order to get inventory for a given product we need to use Inventory service (INV). Our API allows easy access by a `GET` request to our `inventory` endpoint.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/inventory/{PRODUCT_ID}/](https://api.psrestful.com/v2.0.0/suppliers/%7BSUPPLIER_CODE%7D/inventory/%7BPRODUCT_ID%7D/)[](#url-httpsapipsrestfulcomv200supplierssupplier_codeinventoryproduct_id)

### Query Parameters[](#query-parameters)

| Parameter     | Type       | Required | Description                                                       |
| ------------- | ---------- | -------- | ----------------------------------------------------------------- |
| `part_id`     | string\[\] | No       | Filter by specific part ID(s). Can be repeated for multiple parts |
| `color`       | string\[\] | No       | Filter by color(s). Can be repeated for multiple colors           |
| `size`        | string\[\] | No       | Filter by size(s). Can be repeated for multiple sizes             |
| `environment` | string     | No       | Environment: `PROD` or `STAGING` (default: `PROD`)                |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v2.0.0/suppliers/HIT/inventory/55414/" \
  -H "X-API-Key: your-api-key"
```

### Example with Filters[](#example-with-filters)

Get inventory for specific colors:

```
curl -X GET "https://api.psrestful.com/v2.0.0/suppliers/HIT/inventory/55414/?color=WHITE&color=BLACK" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

This is the response from calling with: `SUPPLIER_CODE` = `HIT` `PRODUCT_ID` = `55414`

The response has been truncated to show 2 parts:

```
{
    "Inventory": {
        "productId": "55414",
        "PartInventoryArray": {
            "PartInventory": [
                {
                    "partId": "5414SWHT",
                    "mainPart": true,
                    "partColor": "WHITE",
                    "labelSize": null,
                    "partDescription": "14OZ ELVATION MUG WHT 77-87047",
                    "quantityAvailable": {
                        "Quantity": {
                            "value": 26,
                            "uom": "EA"
                        }
                    },
                    "manufacturedItem": false,
                    "buyToOrder": false,
                    "replenishmentLeadTime": null,
                    "lastModified": "2023-07-28T15:29:00+00:00",
                    "InventoryLocationArray": {
                        "InventoryLocation": [
                            {
                                "inventoryLocationId": "42",
                                "inventoryLocationName": "WEAR MAGIC",
                                "inventoryLocationQuantity": {
                                    "Quantity": {
                                        "value": 15,
                                        "uom": "EA"
                                    }
                                },
                                "Address": {
                                    "city": "FAIRFIELD",
                                    "country": "US",
                                    "postalCode": "45014"
                                }
                            },
                            {
                                "inventoryLocationId": "10",
                                "inventoryLocationName": "BRYAN DAIRY",
                                "inventoryLocationQuantity": {
                                    "Quantity": {
                                        "value": 11,
                                        "uom": "EA"
                                    }
                                },
                                "Address": {
                                    "city": "LARGO",
                                    "country": "US",
                                    "postalCode": "33777"
                                }
                            }
                        ]
                    }
                },
                {
                    "partId": "5414SBLK",
                    "mainPart": true,
                    "partColor": "BLACK",
                    "labelSize": null,
                    "partDescription": "14OZ ELVATION MUG BLK 77-63605",
                    "quantityAvailable": {
                        "Quantity": {
                            "value": 18,
                            "uom": "EA"
                        }
                    },
                    "manufacturedItem": false,
                    "buyToOrder": false,
                    "lastModified": "2023-07-28T15:29:00+00:00",
                    "InventoryLocationArray": {
                        "InventoryLocation": [
                            {
                                "inventoryLocationId": "42",
                                "inventoryLocationName": "WEAR MAGIC",
                                "inventoryLocationQuantity": {
                                    "Quantity": {
                                        "value": 14,
                                        "uom": "EA"
                                    }
                                },
                                "Address": {
                                    "city": "FAIRFIELD",
                                    "country": "US",
                                    "postalCode": "45014"
                                }
                            }
                        ]
                    }
                }
            ]
        }
    },
    "ServiceMessageArray": null
}
```

## Response Structure[](#response-structure)

| Field                    | Description                                   |
| ------------------------ | --------------------------------------------- |
| `productId`              | Product identifier                            |
| `PartInventoryArray`     | Array of inventory by part/variant            |
| `partId`                 | Part/variant identifier                       |
| `mainPart`               | Whether this is the main part                 |
| `partColor`              | Color of the part                             |
| `labelSize`              | Size label (for apparel)                      |
| `partDescription`        | Description of the part                       |
| `quantityAvailable`      | Total quantity available across all locations |
| `lastModified`           | When inventory was last updated               |
| `InventoryLocationArray` | Breakdown by warehouse location               |

## API Versions[](#api-versions)

Both v1.2.1 and v2.0.0 are supported:

```
https://api.psrestful.com/v1.2.1/suppliers/{SUPPLIER_CODE}/inventory/{PRODUCT_ID}/
https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/inventory/{PRODUCT_ID}/
```

**Note:** The `part_id` filter is only available in v2.0.0.

## Use Cases[](#use-cases)

- **Order validation**: Check stock before placing orders
- **Real-time availability**: Display inventory to customers
- **Multi-location shipping**: Find which warehouse has stock
- **Low stock alerts**: Monitor inventory levels

## Related Guides[](#related-guides)

- [Get Filter Values](/guides/inventory/how-to-filter-values) - Get available filter options for a product

[Get Decoration Colors](/guides/ppc/how-to-get-decoration-colors "Get Decoration Colors")[Get Filter Values](/guides/inventory/how-to-filter-values "Get Filter Values")

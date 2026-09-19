---
title: "How to get filter values for a product"
source: https://docs.psrestful.com/guides/inventory/how-to-filter-values
category: guide
crawled_at: 2026-01-22T11:25:02.845Z
---

[Guides](/guides "Guides")[Inventory](/guides/inventory/how-to-get-inventory-levels "Inventory")Get Filter Values

# How to get filter values for a product

## Function getFilterValues[](#function-getfiltervalues)

The filter values endpoint returns the available colors, sizes, and other attributes you can use to filter inventory queries. This is useful for building dynamic filter UIs or validating filter parameters before querying inventory.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/inventory/filter-values/{PRODUCT_ID}/](https://api.psrestful.com/v2.0.0/suppliers/%7BSUPPLIER_CODE%7D/inventory/filter-values/%7BPRODUCT_ID%7D/)[](#url-httpsapipsrestfulcomv200supplierssupplier_codeinventoryfilter-valuesproduct_id)

### Query Parameters[](#query-parameters)

| Parameter         | Type   | Required | Description                                        |
| ----------------- | ------ | -------- | -------------------------------------------------- |
| `product_id_type` | string | No       | Type of product ID being used                      |
| `environment`     | string | No       | Environment: `PROD` or `STAGING` (default: `PROD`) |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v2.0.0/suppliers/HIT/inventory/filter-values/55414/" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

This is the response from calling with: `SUPPLIER_CODE` = `HIT` `PRODUCT_ID` = `55414`

```
{
    "FilterValues": {
        "productId": "55414",
        "Filter": [
            {
                "filterType": "COLOR",
                "filterValue": [
                    "WHITE",
                    "BLACK",
                    "RED",
                    "NAVY BLUE",
                    "SILVER",
                    "TEAL"
                ]
            },
            {
                "filterType": "SIZE",
                "filterValue": [
                    "14OZ"
                ]
            }
        ]
    },
    "ServiceMessageArray": null
}
```

## Response Structure[](#response-structure)

| Field         | Description                                      |
| ------------- | ------------------------------------------------ |
| `productId`   | Product identifier                               |
| `Filter`      | Array of filter types and their available values |
| `filterType`  | Type of filter (e.g., `COLOR`, `SIZE`)           |
| `filterValue` | Array of available values for this filter type   |

## Common Filter Types[](#common-filter-types)

| Type         | Description                                    |
| ------------ | ---------------------------------------------- |
| `COLOR`      | Available colors for the product               |
| `SIZE`       | Available sizes (for apparel, drinkware, etc.) |
| `LABEL_SIZE` | Label size designations                        |

## Typical Workflow[](#typical-workflow)

1.  Call this endpoint to get available filter values
2.  Build a filter UI based on the response
3.  Use selected filters when calling [Get Inventory Levels](/guides/inventory/how-to-get-inventory-levels)

```
# Example: Build filters and query inventory
import requests

# Step 1: Get filter values
filter_response = requests.get(
    "https://api.psrestful.com/v2.0.0/suppliers/HIT/inventory/filter-values/55414/",
    headers={"X-API-Key": "your-api-key"}
)
filters = filter_response.json()["FilterValues"]["Filter"]

# Step 2: User selects "WHITE" color
selected_color = "WHITE"

# Step 3: Query inventory with filter
inventory_response = requests.get(
    "https://api.psrestful.com/v2.0.0/suppliers/HIT/inventory/55414/",
    params={"color": selected_color},
    headers={"X-API-Key": "your-api-key"}
)
```

## Use Cases[](#use-cases)

- **Dynamic filter UIs**: Build dropdown menus based on available options
- **Validation**: Ensure filter values are valid before querying
- **Product displays**: Show available colors/sizes to customers

## Related Guides[](#related-guides)

- [Get Inventory Levels](/guides/inventory/how-to-get-inventory-levels) - Use filters to query inventory

[Get Inventory Levels](/guides/inventory/how-to-get-inventory-levels "Get Inventory Levels")[How to place a Purchase Order for blank goods](/guides/purchase-order/send-po/place-blank-order "How to place a Purchase Order for blank goods")

---
title: "How to get products modified since a date"
source: https://docs.psrestful.com/guides/product-data/how-to-get-products-modified-since
category: guide
crawled_at: 2026-01-22T10:52:59.013Z
---

[Guides](/guides "Guides")[Product Data](/guides/product-data/how-to-get-all-sellable-products "Product Data")Get Products Modified Since

# How to get products modified since a date

When synchronizing your catalog with supplier data, you don’t want to fetch all products every time. The `getProductDateModified` method allows you to retrieve only products that have changed since a specific date, making your sync process much more efficient.

## Function getProductDateModified[](#function-getproductdatemodified)

This endpoint returns a list of product IDs that have been modified since the specified datetime. Use this for incremental catalog updates.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/products-modified-since/](https://api.psrestful.com/v2.0.0/suppliers/%7BSUPPLIER_CODE%7D/products-modified-since/)[](#url-httpsapipsrestfulcomv200supplierssupplier_codeproducts-modified-since)

### Query Parameters[](#query-parameters)

| Parameter     | Type     | Required | Description                                        |
| ------------- | -------- | -------- | -------------------------------------------------- |
| `since`       | datetime | Yes      | ISO 8601 datetime (e.g., `2024-01-15T00:00:00`)    |
| `environment` | string   | No       | Environment: `PROD` or `STAGING` (default: `PROD`) |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v2.0.0/suppliers/HIT/products-modified-since/?since=2024-12-01T00:00:00" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

**COMPLETE URL**:

```
https://api.psrestful.com/v2.0.0/suppliers/HIT/products-modified-since/?since=2024-12-01T00:00:00
```

```
{
    "ProductDateModifiedArray": {
        "ProductDateModified": [
            {
                "productId": "5989"
            },
            {
                "productId": "6234"
            },
            {
                "productId": "7891"
            },
            {
                "productId": "4521"
            }
        ]
    },
    "ServiceMessageArray": null
}
```

## Response Structure[](#response-structure)

The response contains a `ProductDateModifiedArray` with `ProductDateModified` items:

| Field       | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| `productId` | The product identifier that has been modified since the specified date |

## Typical Workflow[](#typical-workflow)

1.  **Initial sync**: Fetch all products using [sellable-product-ids](/guides/product-data/how-to-get-all-sellable-products#sellable-product-ids)
2.  **Store last sync time**: Record when you last synchronized
3.  **Incremental sync**: Use `products-modified-since` with your last sync time
4.  **Update changed products**: Fetch full details only for modified products using [getProduct](/guides/product-data/how-to-get-product)

```
# Example incremental sync workflow
from datetime import datetime, timedelta

# Your last sync timestamp
last_sync = datetime(2024, 12, 1, 0, 0, 0)

# Get modified products
response = requests.get(
    f"https://api.psrestful.com/v2.0.0/suppliers/HIT/products-modified-since/",
    params={"since": last_sync.isoformat()},
    headers={"X-API-Key": "your-api-key"}
)

modified_products = response.json()["ProductDateModifiedArray"]["ProductDateModified"]

# Update only changed products
for product in modified_products:
    product_id = product["productId"]
    # Fetch and update this product in your catalog
    update_product_in_catalog(product_id)

# Update your last sync time
last_sync = datetime.now()
```

## Use Cases[](#use-cases)

- **Catalog synchronization**: Keep your product catalog in sync without full refreshes
- **Price monitoring**: Detect products with pricing changes
- **Inventory systems**: Trigger inventory checks for updated products
- **Change detection**: Build audit logs of product modifications

## API Versions[](#api-versions)

Both v1.0.0 and v2.0.0 are supported:

```
https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/products-modified-since/?since=2024-12-01T00:00:00
https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/products-modified-since/?since=2024-12-01T00:00:00
```

## Best Practices[](#best-practices)

1.  **Store timestamps**: Always store your last successful sync timestamp
2.  **Use reasonable intervals**: Don’t query with dates too far in the past; for large date ranges, consider a full sync
3.  **Handle empty responses**: If no products have changed, the array will be empty
4.  **Combine with other endpoints**: After getting modified IDs, use [getProduct](/guides/product-data/how-to-get-product) for full details

## Related Guides[](#related-guides)

- [How to get all sellable products](/guides/product-data/how-to-get-all-sellable-products) - For initial catalog sync
- [How to get product details](/guides/product-data/how-to-get-product) - Get detailed information for modified products
- [How to get closeout products](/guides/product-data/how-to-get-closeout-products) - Find discontinued products

[Get Product Details](/guides/product-data/how-to-get-product "Get Product Details")[Get Closeout Products](/guides/product-data/how-to-get-closeout-products "Get Closeout Products")

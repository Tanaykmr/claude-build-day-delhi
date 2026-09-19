---
title: "How to get closeout products"
source: https://docs.psrestful.com/guides/product-data/how-to-get-closeout-products
category: guide
crawled_at: 2026-01-22T10:52:59.576Z
---

[Guides](/guides "Guides")[Product Data](/guides/product-data/how-to-get-all-sellable-products "Product Data")Get Closeout Products

# How to get closeout products

Closeout products are items that suppliers are discontinuing or clearing from inventory, often available at discounted prices. The PromoStandards method for retrieving these products is `getProductCloseOut`.

## Function getProductCloseOut[](#function-getproductcloseout)

This endpoint returns a list of products that are currently on closeout for a given supplier. Use this to find deals on products being phased out.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/products-closeout/](https://api.psrestful.com/v2.0.0/suppliers/%7BSUPPLIER_CODE%7D/products-closeout/)[](#url-httpsapipsrestfulcomv200supplierssupplier_codeproducts-closeout)

### Query Parameters[](#query-parameters)

| Parameter     | Type   | Default | Description                      |
| ------------- | ------ | ------- | -------------------------------- |
| `environment` | string | PROD    | Environment: `PROD` or `STAGING` |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v2.0.0/suppliers/HIT/products-closeout/" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

**COMPLETE URL**:

```
https://api.psrestful.com/v2.0.0/suppliers/HIT/products-closeout/
```

```
{
    "ProductCloseOutArray": {
        "ProductCloseOut": [
            {
                "productId": "4521",
                "partId": "4521BLK"
            },
            {
                "productId": "4521",
                "partId": "4521BLU"
            },
            {
                "productId": "6234",
                "partId": "6234RED"
            }
        ]
    },
    "ServiceMessageArray": null
}
```

## Response Structure[](#response-structure)

The response contains a `ProductCloseOutArray` with `ProductCloseOut` items, each containing:

| Field       | Description                                              |
| ----------- | -------------------------------------------------------- |
| `productId` | The product identifier                                   |
| `partId`    | The specific part/variant identifier that is on closeout |

## Use Cases[](#use-cases)

- **Bargain hunting**: Find discounted products for price-sensitive customers
- **Inventory clearance**: Help customers find deals before products become unavailable
- **Catalog updates**: Identify products to remove or mark as closeout in your catalog
- **Purchasing decisions**: Stock up on popular closeout items before they’re gone

## API Versions[](#api-versions)

Both v1.0.0 and v2.0.0 are supported:

```
https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/products-closeout/
https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/products-closeout/
```

## Related Guides[](#related-guides)

- [How to get all sellable products](/guides/product-data/how-to-get-all-sellable-products) - Get the full list of sellable products
- [How to get product details](/guides/product-data/how-to-get-product) - Get detailed information for a specific product
- [How to get products modified since a date](/guides/product-data/how-to-get-products-modified-since) - Track product changes over time

[Get Products Modified Since](/guides/product-data/how-to-get-products-modified-since "Get Products Modified Since")[Get Product Media Content](/guides/media-content/how-to-get-product-media-content "Get Product Media Content")

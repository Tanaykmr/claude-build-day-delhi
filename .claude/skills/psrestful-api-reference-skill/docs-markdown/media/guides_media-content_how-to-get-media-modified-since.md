---
title: "How to get media modified since a date"
source: https://docs.psrestful.com/guides/media-content/how-to-get-media-modified-since
category: guide
crawled_at: 2026-01-22T10:56:40.460Z
---

[Guides](/guides "Guides")[Media Content](/guides/media-content/how-to-get-product-media-content "Media Content")Get Media Modified Since

# How to get media modified since a date

When synchronizing your media library with supplier data, you don’t want to fetch all media for every product each time. The `getMediaDateModified` method allows you to retrieve only products whose media has changed since a specific date, making your sync process much more efficient.

⚠️

Not all suppliers implement this method. If a supplier doesn’t support `getMediaDateModified`, you will need to perform a full media sync by fetching media for all products using [getMediaContent](/guides/media-content/how-to-get-product-media-content).

## Function getMediaDateModified[](#function-getmediadatemodified)

This endpoint returns a list of product IDs whose media content has been modified since the specified datetime. Use this for incremental media updates.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v1.1.0/suppliers/{SUPPLIER_CODE}/media-modified-since/](https://api.psrestful.com/v1.1.0/suppliers/%7BSUPPLIER_CODE%7D/media-modified-since/)[](#url-httpsapipsrestfulcomv110supplierssupplier_codemedia-modified-since)

### Query Parameters[](#query-parameters)

| Parameter      | Type     | Required | Description                                        |
| -------------- | -------- | -------- | -------------------------------------------------- |
| `since`        | datetime | Yes      | ISO 8601 datetime (e.g., `2024-01-15T00:00:00`)    |
| `culture_name` | string   | No       | Language culture name (default: `us_en`)           |
| `environment`  | string   | No       | Environment: `PROD` or `STAGING` (default: `PROD`) |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v1.1.0/suppliers/HIT/media-modified-since/?since=2024-12-01T00:00:00" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

```
{
    "MediaDateModifiedArray": {
        "MediaDateModified": [
            {
                "productId": "5989"
            },
            {
                "productId": "6234"
            },
            {
                "productId": "7891"
            }
        ]
    },
    "ServiceMessageArray": null
}
```

## Response Structure[](#response-structure)

The response contains a `MediaDateModifiedArray` with `MediaDateModified` items:

| Field       | Description                                                                   |
| ----------- | ----------------------------------------------------------------------------- |
| `productId` | The product identifier whose media has been modified since the specified date |

## Typical Workflow[](#typical-workflow)

1.  **Initial sync**: Fetch media for all products using [getMediaContent](/guides/media-content/how-to-get-product-media-content)
2.  **Store last sync time**: Record when you last synchronized media
3.  **Incremental sync**: Use `media-modified-since` with your last sync time
4.  **Update changed media**: Fetch media only for products returned by this endpoint

```
# Example incremental media sync workflow
from datetime import datetime

# Your last sync timestamp
last_sync = datetime(2024, 12, 1, 0, 0, 0)

# Get products with modified media
response = requests.get(
    f"https://api.psrestful.com/v1.1.0/suppliers/HIT/media-modified-since/",
    params={"since": last_sync.isoformat()},
    headers={"X-API-Key": "your-api-key"}
)

modified_products = response.json()["MediaDateModifiedArray"]["MediaDateModified"]

# Update media only for changed products
for product in modified_products:
    product_id = product["productId"]
    # Fetch updated media for this product
    media_response = requests.get(
        f"https://api.psrestful.com/v1.1.0/suppliers/HIT/medias/{product_id}/",
        headers={"X-API-Key": "your-api-key"}
    )
    update_media_in_catalog(product_id, media_response.json())

# Update your last sync time
last_sync = datetime.now()
```

## Use Cases[](#use-cases)

- **Media library synchronization**: Keep your product images in sync without full refreshes
- **CDN cache invalidation**: Identify which product images need cache updates
- **Image processing pipelines**: Trigger re-processing only for updated media
- **Catalog management**: Track when product visuals change

## Best Practices[](#best-practices)

1.  **Store timestamps**: Always store your last successful sync timestamp
2.  **Use reasonable intervals**: For large date ranges, consider a full sync instead
3.  **Handle empty responses**: If no media has changed, the array will be empty
4.  **Combine with getMediaContent**: After getting modified product IDs, fetch their full media using [getMediaContent](/guides/media-content/how-to-get-product-media-content)

## Related Guides[](#related-guides)

- [How to get product media content](/guides/media-content/how-to-get-product-media-content) - Get media for specific products

[Get Product Media Content](/guides/media-content/how-to-get-product-media-content "Get Product Media Content")[Get Pricing and Configuration](/guides/ppc/how-to-get-pricing-and-configuration "Get Pricing and Configuration")

---
title: "How to get product media content"
source: https://docs.psrestful.com/guides/media-content/how-to-get-product-media-content
category: guide
crawled_at: 2026-01-22T10:56:39.875Z
---

[Guides](/guides "Guides")Media ContentGet Product Media Content

# How to get product media content

### Educational video from PromoStandards[](#educational-video-from-promostandards)

## Function getMediaContent[](#function-getmediacontent)

In order to get all media content (images, videos, documents) for a given product we need to use Media Content Service (MED). Our API allows easy access by a `GET` request to our `medias` endpoint.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v1.1.0/suppliers/{SUPPLIER_CODE}/medias/{PRODUCT_ID}/](https://api.psrestful.com/v1.1.0/suppliers/%7BSUPPLIER_CODE%7D/medias/%7BPRODUCT_ID%7D/)[](#url-httpsapipsrestfulcomv110supplierssupplier_codemediasproduct_id)

### Query Parameters[](#query-parameters)

| Parameter      | Type    | Required | Description                                                      |
| -------------- | ------- | -------- | ---------------------------------------------------------------- |
| `media_type`   | string  | No       | Filter by media type: `Image`, `Video`, `Audio`, `Document`      |
| `part_id`      | string  | No       | Filter media for a specific part/variant                         |
| `class_type`   | integer | No       | Filter by class type ID (can be comma-separated for multiple)    |
| `culture_name` | string  | No       | Language culture name (e.g., `en-US`, `fr-FR`). Default: `en-US` |
| `environment`  | string  | No       | Environment: `PROD` or `STAGING` (default: `PROD`)               |

### Common Class Types[](#common-class-types)

| ID   | Name      | Description                     |
| ---- | --------- | ------------------------------- |
| 1001 | Blank     | Undecorated product image       |
| 1002 | Decorated | Product with decoration/imprint |
| 1006 | Primary   | Main product image              |

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v1.1.0/suppliers/HIT/medias/5989/" \
  -H "X-API-Key: your-api-key"
```

### Example with Filters[](#example-with-filters)

Get only blank images for a specific part:

```
curl -X GET "https://api.psrestful.com/v1.1.0/suppliers/HIT/medias/5989/?media_type=Image&class_type=1001&part_id=5989BLK" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

This is the response from calling with: `SUPPLIER_CODE` = `HIT` `PRODUCT_ID` = `5989`

The response has been truncated to show 3 representative media items (Primary, Decorated, and Blank class types):

```
{
    "MediaContentArray": {
        "MediaContent": [
            {
                "productId": "5989",
                "partId": "5989",
                "url": "https://www.hitpromo.net/imageManager/show/5989_group.jpg",
                "mediaType": "Image",
                "fileSize": null,
                "width": null,
                "height": null,
                "dpi": null,
                "color": null,
                "description": null,
                "singlePart": false,
                "changeTimeStamp": null,
                "ClassTypeArray": {
                    "ClassType": [
                        {
                            "classTypeId": 1006,
                            "classTypeName": "Primary"
                        }
                    ]
                },
                "DecorationArray": null,
                "LocationArray": null
            },
            {
                "productId": "5989",
                "partId": "5989BLK",
                "url": "https://www.hitpromo.net/imageManager/show/5989_BLK_Horizontal_Silkscreen.jpg",
                "mediaType": "Image",
                "fileSize": null,
                "width": null,
                "height": null,
                "dpi": null,
                "color": null,
                "description": "Horizontal Silkscreen Imprint",
                "singlePart": false,
                "changeTimeStamp": null,
                "ClassTypeArray": {
                    "ClassType": [
                        {
                            "classTypeId": 1002,
                            "classTypeName": "Decorated"
                        }
                    ]
                },
                "DecorationArray": {
                    "Decoration": [
                        {
                            "decorationId": 54,
                            "decorationName": "Silk-Screen"
                        }
                    ]
                },
                "LocationArray": null
            },
            {
                "productId": "5989",
                "partId": "5989BLK",
                "url": "https://www.hitpromo.net/imageManager/show/5989_BLK_Blank.jpg",
                "mediaType": "Image",
                "fileSize": null,
                "width": null,
                "height": null,
                "dpi": null,
                "color": null,
                "description": null,
                "singlePart": false,
                "changeTimeStamp": null,
                "ClassTypeArray": {
                    "ClassType": [
                        {
                            "classTypeId": 1001,
                            "classTypeName": "Blank"
                        }
                    ]
                },
                "DecorationArray": {
                    "Decoration": [
                        {
                            "decorationId": 51,
                            "decorationName": "Blank"
                        }
                    ]
                },
                "LocationArray": null
            }
        ]
    },
    "ErrorMessage": null
}
```

## Response Structure[](#response-structure)

Each `MediaContent` item contains:

| Field             | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `productId`       | The product identifier                                        |
| `partId`          | The specific part/variant identifier                          |
| `url`             | Direct URL to the media file                                  |
| `mediaType`       | Type of media: `Image`, `Video`, `Audio`, `Document`          |
| `ClassTypeArray`  | Classification of the media (Blank, Decorated, Primary, etc.) |
| `DecorationArray` | Decoration methods shown in the media                         |
| `description`     | Optional description of the media                             |

## API Versions[](#api-versions)

Both v1.0.0 and v1.1.0 are supported:

```
https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/medias/{PRODUCT_ID}/
https://api.psrestful.com/v1.1.0/suppliers/{SUPPLIER_CODE}/medias/{PRODUCT_ID}/
```

## Related Guides[](#related-guides)

- [How to get media modified since a date](/guides/media-content/how-to-get-media-modified-since) - Track media changes over time

[Get Closeout Products](/guides/product-data/how-to-get-closeout-products "Get Closeout Products")[Get Media Modified Since](/guides/media-content/how-to-get-media-modified-since "Get Media Modified Since")

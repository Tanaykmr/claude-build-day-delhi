# How to get product media content

Source: https://docs.psrestful.com/guides/media-content/how-to-get-product-media-content
Category: guide

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

---

# How to get media modified since a date

Source: https://docs.psrestful.com/guides/media-content/how-to-get-media-modified-since
Category: guide

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

---

# Media Content 1.1.0 REFERENCE

Source: https://docs.psrestful.com/standards/media-content-1.1.0
Category: reference

[Standards](/standards "Standards")Media Content 1.1.0

# PROMOTIONAL PRODUCTS DATA INTERFACE SPECIFICATION FOR WEB SERVICES

![PromoStandards Logo](/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fpromo-standards-logo.3eeccfef.png&w=640&q=75)

## Media Content Service[](#media-content-service)

**Version**: 1.1.0  
**Release Date**: 2017-07-18

## Document Change Log[](#document-change-log)

| Version | Date        | Reason for Change                                                                                                                             | Authors                |
| ------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1.1.0   | 22017-07-18 | Resolves the reported validation issue where Location and Decoration array require at least one element when these arrays should be optional. | Paul Fleischman - PCNA |

## Abstract and Recommended Audience[](#abstract-and-recommended-audience)

This document describes the technologies for integration of suppliers and distributors in the Promotional Products Industry. This document will discuss in detail the technology required in order to build the interface. Additionally, this document will provide sample code in order to use the interface.

This document will assume that the reader is fluent in web based technologies, and has knowledge of the language they plan to consume the web service in.

## Background Information[](#background-information)

All specifications will be built using the Simple Object Access Protocol (SOAP) over HTTPS as the foundation for the web services protocol stack in order to provide a standards based secure form of communication.

More information on SOAP can be found at [w3](http://www.w3.org/TR/soap12-part1/)

---

## **Media Content**[](#media-content)

### **Summary:**[](#summary)

Provides a mechanism to get a media content by specific parameters like (last change date, product id, part id, media type, etc). This allows the consumer of the service to obtain specific media content for their needs.

## Service Details:[](#service-details)

- [getMediaContent](#function-getmediacontent)
- [getMediaDateModified](#getmediadatemodified)

## `getMediaContent()`[](#getmediacontent)

### **Request: GetMediaContentRequest**[](#request-getmediacontentrequest)

| Field                                 | Description                                              | Data Type    | Required? |
| ------------------------------------- | -------------------------------------------------------- | ------------ | --------- |
| wsVersion                             | The Standard Version of the Web Service being referenced | 64 STRING    | YES       |
| id                                    | The customer Id or any other agreed upon Id.             | 64 STRING    | YES       |
| password                              | The password associated with the Id                      | 64 STRING    | NO        |
| cultureName                           | The language culture name. Null assumes en-US.           | ISO 639x     | NO        |
| [mediaType](#media-content-filtering) | The type of media to return                              | STRING FACET | YES\*     |
| productId                             | The product Id                                           | 64 STRING    | YES       |
| partId                                | The part Id associated to the product Id                 | 64 STRING    | NO        |
| classType                             | Classification of the media                              | INT          | NO        |

### **Reply: GetMediaContentDetailsResponse**[](#reply-getmediacontentdetailsresponse)

| Field                                     | Description                                                | Data Type    | Required? |
| ----------------------------------------- | ---------------------------------------------------------- | ------------ | --------- |
| [MediaContentArray](#mediacontent-object) | An array of media content objects                          | OBJECT ARRAY | NO        |
| [errorMessage](#errormessage-object)      | Response for any error requiring notification to requestor | OBJECT       | NO        |

### **MediaContent Object**[](#mediacontent-object)

| Field                                 | Description                                                         | Data Type    | Required? |
| ------------------------------------- | ------------------------------------------------------------------- | ------------ | --------- |
| productId                             | The associated Product Id                                           | 64 STRING    | YES       |
| partId                                | The part Id associated to the product Id                            | 64 STRING    | NO        |
| url                                   | The URL of the media location                                       | 1024 STRING  | YES       |
| mediaType                             | The type of media                                                   | STRING FACET | YES       |
| [ClassTypeArray](#classtype-object)   | An array of ClassType objects that classify of the media            | OBJECT ARRAY | YES       |
| fileSize                              | The file size                                                       | DOUBLE       | NO        |
| width                                 | Width                                                               | INT          | NO        |
| height                                | Height                                                              | INT          | NO        |
| dpi                                   | Dots per inch                                                       | INT          | NO        |
| color                                 | The color description                                               | 256 STRING   | NO        |
| [DecorationArray](#decoration-object) | An array of decoration objects                                      | OBJECT ARRAY | NO        |
| [LocationArray](#location-object)     | An array of location objects                                        | OBJECT ARRAY | NO        |
| description                           | Information about the media                                         | 1024 STRING  | NO        |
| singlePart                            | Identifies whether the partId one to one corresponds with the image | BOOLEAN      | YES       |
| changeTimeStamp                       | The date time since last change in UTC                              | ISO 8601     | NO        |

### **ClassType Object**[](#classtype-object)

| Field         | Description                     | Data Type | Required? |
| ------------- | ------------------------------- | --------- | --------- |
| classTypeId   | The classification of the media | INT       | YES       |
| classTypeName | The classification short name   | 64 STRING | YES       |

### **Decoration Object**[](#decoration-object)

| Field          | Description                                       | Data Type | Required? |
| -------------- | ------------------------------------------------- | --------- | --------- |
| decorationId   | The decoration id associated with the media       | INT       | YES       |
| decorationName | The name of the decoration associated with the id | 64 STRING | YES       |

### **Location Object**[](#location-object)

| Field        | Description                                     | Data Type | Required? |
| ------------ | ----------------------------------------------- | --------- | --------- |
| locationId   | The location id associated with the media       | INT       | YES       |
| locationName | The name of the location associated with the id | 64 STRING | YES       |

## **Media Date Modified**[](#media-date-modified)

### **Summary:**[](#summary-1)

Provides a mechanism to get all product and/or part ids, of media, that changed since a specified date.

## getMediaDateModified()[](#getmediadatemodified)

### **Request: GetMediaDateModifiedRequest**[](#request-getmediadatemodifiedrequest)

| Field           | Description                                              | Data Type | Required? |
| --------------- | -------------------------------------------------------- | --------- | --------- |
| wsVersion       | The Standard Version of the Web Service being referenced | 64 STRING | YES       |
| id              | The customer Id or any other agreed upon Id              | 64 STRING | YES       |
| password        | The password associated with the Id                      | 64 STRING | NO        |
| cultureName     | The language culture name. Null assumes en-US            | ISO 639x  | NO        |
| changeTimeStamp | Beginning date time since last change in UTC             | ISO 8601  | YES       |

### **Reply: GetMediaDateModifiedResponse**[](#reply-getmediadatemodifiedresponse)

| Field                                               | Description                                                | Data Type    | Required? |
| --------------------------------------------------- | ---------------------------------------------------------- | ------------ | --------- |
| [MediaDateModifiedArray](#mediadatemodified-object) | An array of MediaDateModified objects                      | OBJECT ARRAY | NO        |
| [errorMessage](#errormessage-object)                | Response for any error requiring notification to requestor | OBJECT       | NO        |

### **MediaDateModified Object**[](#mediadatemodified-object)

| Field     | Description                              | Data Type | Required? |
| --------- | ---------------------------------------- | --------- | --------- |
| productId | The associated Product Id                | 64 STRING | YES       |
| partId    | The part Id associated to the product Id | 64 STRING | NO        |

## Enumerated Type Restrictions[](#enumerated-type-restrictions)

| Enumerated Type | Description          | Values                                                                                               |
| --------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| mediaType       | The basic media type | Image - Returns images, Video - Returns videos, Audio - Returns audios, Document - Returns documents |

### Valid values for class type and class name:[](#valid-values-for-class-type-and-class-name)

| classType | Class Name    | Description                                                                                         |
| --------- | ------------- | --------------------------------------------------------------------------------------------------- |
| 0-499     | Reserved      | Reserved for future use                                                                             |
| 500-999   | Custom        | Custom class types for implementation specific use. These identifiers                               |
| 1000      | Unspecified   | Unknown or unspecified shot. This value means the shot type is unavailable for the media type.      |
| 1001      | Blank         | The shot is of blank media                                                                          |
| 1002      | Decorated     | The shot is of decorated media                                                                      |
| 1003      | Alternate     | The shot is alternate. This may indicate the product is combined with other media to stage a scene. |
| 1004      | Swatch        | The shot is of a swatch                                                                             |
| 1005      | Custom        | The shot is custom which does not fall into any specific type                                       |
| 1006      | Primary       | The primary image                                                                                   |
| 1007      | Front         | Front view                                                                                          |
| 1008      | Rear          | Rear view                                                                                           |
| 1009      | Right         | Right view                                                                                          |
| 1010      | Left          | Left view                                                                                           |
| 1011      | Top           | Top view                                                                                            |
| 1012      | Bottom        | Bottom view                                                                                         |
| 1013      | Inside        | Inside view                                                                                         |
| 1014      | Outside       | Outside view                                                                                        |
| 2000      | Standard      | Standard Definition                                                                                 |
| 2001      | High          | High definition                                                                                     |
| 3000      | Podcast       | Podcast                                                                                             |
| 4000      | Specs         | Specification sheets                                                                                |
| 4001      | ProductSafety | Product safety information                                                                          |
| 4002      | Facts         | Fact sheets                                                                                         |
| 4003      | Compliance    | Compliance documents                                                                                |
| 4004      | ArtTemplate   | Art templates                                                                                       |
| 4005      | Marketing     | Marketing material                                                                                  |

## Appendix A: Error Messages[](#appendix-a-error-messages)

### **ErrorMessage Object**[](#errormessage-object)

| Field       | Description                                                | Data Type  | Required? |
| ----------- | ---------------------------------------------------------- | ---------- | --------- |
| code        | The numerical value of the code                            | NUMBER     | YES       |
| description | Response for any error requiring notification to requestor | 256 STRING | YES       |

**Standardized Codes:** The range of `100-199` has been reserved for standardized error codes. The number `999` has been reserved for an error codes that is a “General Error - Contact System Service Provider”

### **Error Codes and Descriptions**[](#error-codes-and-descriptions)

| Code | Description                                                                           |
| ---- | ------------------------------------------------------------------------------------- |
| 100  | ID (customerID) not found                                                             |
| 104  | This account is unauthorized to use this service. Please contact the service provider |
| 105  | Authentication Credentials failed                                                     |
| 110  | Authentication Credentials required                                                   |
| 115  | wsVersion not found                                                                   |
| 120  | The following field(s) are required \[Comma Delimited field names\]                   |
| 125  | Not Supported                                                                         |
| 130  | Product Id not found                                                                  |
| 135  | Product color not found                                                               |
| 140  | Part Id not found                                                                     |
| 145  | Part color not found                                                                  |
| 150  | Part size not found                                                                   |
| 155  | Invalid Date Format                                                                   |
| 160  | No Results Found                                                                      |
| 999  | General Error – Contact the System Service Provider                                   |

## Media Content Filtering[](#media-content-filtering)

In [GetMediaContentRequest](#request-getmediacontentrequest) the user allows to filter by `mediaType`. The documentation & the WSDL file tells you that it is required. However, several Suppliers allows to send empty value returning all types of media in one call.

We value that so we don’t required the `mediaType` however we do default to `Image` if the user doesn’t provide `media_type` and the supplier requires it.

Here is the list of supplier’s affected by this decision:

- Ariel
- alphabroder
- bambams
- Cutter
- debco
- ETS
- GEM
- Gold
- goldstar
- Hand Stands
- HIT
- Hirsch
- Hub Pen
- BIC
- LMRK
- PCNA
- PLAYINGCARDSONDEMAND
- ProTowels
- Scrub Authority
- SNUGZ
- Spector
- STAR
- stormcreek
- StRegis
- sunjoy
- terry
- vantage

## Validation of Services[](#validation-of-services)

Before you publish your endpoint, please ensure that it adheres to the promostandards.org spec by using the web service validation tool.

[https://services.promostandards.org/webserviceValidator/home](https://services.promostandards.org/webserviceValidator/home)

Select the service, version, method and input your endpoint. If the endpoint is correct you should receive a message of:

“The XML response is valid.”

## Code Samples[](#code-samples)

To be published under separate specification: “Media Content Standards Use Examples”

## DATA MINING / ABUSE GUIDELINE[](#data-mining--abuse-guideline)

The use of services detailed within this specification are to be conducted within the current guidelines of the “Interface Data Use Guidelines Standards”

---

## Diagrams[](#diagrams)

### getMediaContent Function[](#getmediacontent-function)

### getMediaDateModified Function[](#getmediadatemodified-function)

[Product Data 2.0.0](/standards/product-data-2.0.0 "Product Data 2.0.0")[PPC 1.0.0](/standards/ppc-1.0.0 "PPC 1.0.0")

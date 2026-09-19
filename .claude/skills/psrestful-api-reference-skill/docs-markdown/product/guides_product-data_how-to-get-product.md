---
title: "How to get product details"
source: https://docs.psrestful.com/guides/product-data/how-to-get-product
category: guide
crawled_at: 2026-01-22T10:52:58.458Z
---

[Guides](/guides "Guides")[Product Data](/guides/product-data/how-to-get-all-sellable-products "Product Data")Get Product Details

# How to get product details

### Educational video from PromoStandards[](#educational-video-from-promostandards)

## Function getProduct[](#function-getproduct)

In order to get `all product details` for a given product we need to use Product Data service(Product). Our API allows easy access by a `GET` request to our `product` endpoint.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/products/{PRODUCT_ID}/](https://api.psrestful.com/v2.0.0/suppliers/%7BSUPPLIER_CODE%7D/products/%7BPRODUCT_ID%7D/)[](#url-httpsapipsrestfulcomv200supplierssupplier_codeproductsproduct_id)

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v2.0.0/suppliers/HIT/products/5989/" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

This is the response from calling with: `SUPPLIER_CODE` = `HIT` `PRODUCT_ID` = `5989`

```
{
    "Product": {
        "productId": "5989",
        "productName": "32 Oz. Tritan™ Hydrator Sports Bottle",
        "description": [
            "Durable Tritan™ Material. Impact And Shatter Resistant. Self-Attached, Screw On, Spill-Resistant Lid. Wide Mouth Opening. Smooth Rubberized Finish. Meets FDA Requirements. BPA Free. Hand Wash Recommended."
        ],
        "priceExpiresDate": null,
        "productBrand": "TRITAN",
        "export": true,
        "lastChangeDate": "2020-12-11T15:08:55",
        "creationDate": "2018-01-15T13:56:31",
        "endDate": "2028-01-01T00:00:00",
        "effectiveDate": "2018-01-15T13:56:31",
        "isCaution": false,
        "cautionComment": null,
        "isCloseout": false,
        "lineName": "HIT",
        "primaryImageURL": null,
        "complianceInfoAvailable": null,
        "unspscCommodityCode": null,
        "imprintSize": "Width - 3.0000                          Width 3.0000 and height 4.0000                          shape Rectangle and uom INCH",
        "defaultSetUpCharge": null,
        "defaultRunCharge": null,
        "ProductCategoryArray": {
            "ProductCategory": [
                {
                    "category": "Drinkware",
                    "subCategory": "Tritan™ Series"
                },
                {
                    "category": "Drinkware",
                    "subCategory": "Bottles - Plastic"
                }
            ]
        },
        "RelatedProductArray": {
            "RelatedProduct": [
                {
                    "relationType": "Common Grouping",
                    "productId": "5835",
                    "partId": null
                },
                {
                    "relationType": "Common Grouping",
                    "productId": "5807",
                    "partId": null
                }
            ]
        },
        "ProductPartArray": {
            "ProductPart": [
                {
                    "partId": "5989BLK",
                    "description": [],
                    "countryOfOrigin": "CN",
                    "primaryMaterial": "Tritan",
                    "shape": "BOTTLE",
                    "ApparelSize": null,
                    "Dimension": {
                        "dimensionUom": "IN",
                        "depth": null,
                        "height": 8.5,
                        "width": null,
                        "weightUom": "LB",
                        "weight": 0.42
                    },
                    "leadTime": 5,
                    "unspsc": null,
                    "gtin": null,
                    "isRushService": false,
                    "endDate": "2028-01-01T00:00:00",
                    "effectiveDate": "2018-01-15T13:56:31",
                    "isCloseout": false,
                    "isCaution": null,
                    "cautionComment": null,
                    "nmfcCode": 0.0,
                    "nmfcDescription": null,
                    "nmfcNumber": null,
                    "isOnDemand": false,
                    "isHazmat": null,
                    "primaryColor": null,
                    "ColorArray": {
                        "Color": [
                            {
                                "colorName": "BLACK",
                                "hex": "000000",
                                "approximatePms": "Black",
                                "standardColorName": null
                            }
                        ]
                    },
                    "ProductPackagingArray": null,
                    "ShippingPackageArray": {
                        "ShippingPackage": [
                            {
                                "packageType": "Box",
                                "description": "WC",
                                "quantity": 24.0,
                                "dimensionUom": "IN",
                                "depth": 16.0,
                                "height": 23.0,
                                "width": 11.0,
                                "weightUom": "LB",
                                "weight": 10.0
                            }
                        ]
                    }
                },
                {
                    "partId": "5989BLU",
                    "description": [],
                    "countryOfOrigin": "CN",
                    "primaryMaterial": "Tritan",
                    "shape": "BOTTLE",
                    "ApparelSize": null,
                    "Dimension": {
                        "dimensionUom": "IN",
                        "depth": null,
                        "height": 8.5,
                        "width": null,
                        "weightUom": "LB",
                        "weight": 0.42
                    },
                    "leadTime": 5,
                    "unspsc": null,
                    "gtin": null,
                    "isRushService": false,
                    "endDate": "2028-01-01T00:00:00",
                    "effectiveDate": "2018-01-15T13:56:31",
                    "isCloseout": false,
                    "isCaution": null,
                    "cautionComment": null,
                    "nmfcCode": 0.0,
                    "nmfcDescription": null,
                    "nmfcNumber": null,
                    "isOnDemand": false,
                    "isHazmat": null,
                    "primaryColor": null,
                    "ColorArray": {
                        "Color": [
                            {
                                "colorName": "BLUE",
                                "hex": "0047BB",
                                "approximatePms": "2728",
                                "standardColorName": null
                            }
                        ]
                    },
                    "ProductPackagingArray": null,
                    "ShippingPackageArray": {
                        "ShippingPackage": [
                            {
                                "packageType": "Box",
                                "description": "WC",
                                "quantity": 24.0,
                                "dimensionUom": "IN",
                                "depth": 16.0,
                                "height": 23.0,
                                "width": 11.0,
                                "weightUom": "LB",
                                "weight": 10.0
                            }
                        ]
                    }
                },
                {
                    "partId": "5989LIM",
                    "description": [],
                    "countryOfOrigin": "CN",
                    "primaryMaterial": "Tritan",
                    "shape": "BOTTLE",
                    "ApparelSize": null,
                    "Dimension": {
                        "dimensionUom": "IN",
                        "depth": null,
                        "height": 8.5,
                        "width": null,
                        "weightUom": "LB",
                        "weight": 0.42
                    },
                    "leadTime": 5,
                    "unspsc": null,
                    "gtin": null,
                    "isRushService": false,
                    "endDate": "2028-01-01T00:00:00",
                    "effectiveDate": "2018-01-15T13:56:31",
                    "isCloseout": false,
                    "isCaution": null,
                    "cautionComment": null,
                    "nmfcCode": 0.0,
                    "nmfcDescription": null,
                    "nmfcNumber": null,
                    "isOnDemand": false,
                    "isHazmat": null,
                    "primaryColor": null,
                    "ColorArray": {
                        "Color": [
                            {
                                "colorName": "LIME",
                                "hex": "97D700",
                                "approximatePms": "375",
                                "standardColorName": null
                            }
                        ]
                    },
                    "ProductPackagingArray": null,
                    "ShippingPackageArray": {
                        "ShippingPackage": [
                            {
                                "packageType": "Box",
                                "description": "WC",
                                "quantity": 24.0,
                                "dimensionUom": "IN",
                                "depth": 16.0,
                                "height": 23.0,
                                "width": 11.0,
                                "weightUom": "LB",
                                "weight": 10.0
                            }
                        ]
                    }
                },
                {
                    "partId": "5989RED",
                    "description": [],
                    "countryOfOrigin": "CN",
                    "primaryMaterial": "Tritan",
                    "shape": "BOTTLE",
                    "ApparelSize": null,
                    "Dimension": {
                        "dimensionUom": "IN",
                        "depth": null,
                        "height": 8.5,
                        "width": null,
                        "weightUom": "LB",
                        "weight": 0.42
                    },
                    "leadTime": 5,
                    "unspsc": null,
                    "gtin": null,
                    "isRushService": false,
                    "endDate": "2028-01-01T00:00:00",
                    "effectiveDate": "2018-01-15T13:56:31",
                    "isCloseout": false,
                    "isCaution": null,
                    "cautionComment": null,
                    "nmfcCode": 0.0,
                    "nmfcDescription": null,
                    "nmfcNumber": null,
                    "isOnDemand": false,
                    "isHazmat": null,
                    "primaryColor": null,
                    "ColorArray": {
                        "Color": [
                            {
                                "colorName": "RED",
                                "hex": "C8102E",
                                "approximatePms": "186",
                                "standardColorName": null
                            }
                        ]
                    },
                    "ProductPackagingArray": null,
                    "ShippingPackageArray": {
                        "ShippingPackage": [
                            {
                                "packageType": "Box",
                                "description": "WC",
                                "quantity": 24.0,
                                "dimensionUom": "IN",
                                "depth": 16.0,
                                "height": 23.0,
                                "width": 11.0,
                                "weightUom": "LB",
                                "weight": 10.0
                            }
                        ]
                    }
                }
            ]
        },
        "ProductKeywordArray": null,
        "LocationDecorationArray": {
            "LocationDecoration": [
                {
                    "locationName": "SIDE1",
                    "maxImprintColors": null,
                    "decorationName": "Silk Screen",
                    "locationDecorationComboDefault": false,
                    "priceIncludes": false
                }
            ]
        },
        "ProductPriceGroupArray": {
            "ProductPriceGroup": [
                {
                    "groupName": "Standard Imprint",
                    "currency": "USD",
                    "description": null,
                    "ProductPriceArray": {
                        "ProductPrice": [
                            {
                                "quantityMax": null,
                                "quantityMin": 48,
                                "price": 11.98,
                                "discountCode": "C"
                            },
                            {
                                "quantityMax": null,
                                "quantityMin": 96,
                                "price": 10.42,
                                "discountCode": "C"
                            }

                        ]
                    }
                }
            ]
        },
        "FobPointArray": {
            "FobPoint": [
                {
                    "fobId": "1",
                    "fobPostalCode": "33777",
                    "fobCity": "Largo",
                    "fobState": "FL",
                    "fobCountry": "US"
                },
                {
                    "fobId": "12",
                    "fobPostalCode": "L6S6H2",
                    "fobCity": "BRAMPTON",
                    "fobState": "ON",
                    "fobCountry": "CA"
                }
            ]
        },
        "ProductMarketingPointArray": {
            "ProductMarketingPoint": [
                {
                    "pointType": "Highlight",
                    "pointCopy": "Durable Tritan™ Material."
                },
                {
                    "pointType": "Highlight",
                    "pointCopy": "Impact And Shatter Resistant."
                }

            ]
        }
    },
    "ServiceMessageArray": null
}
```

## Example of a product not available[](#example-of-a-product-not-available)

```
{
    "Product": null,
    "ServiceMessageArray": {
        "ServiceMessage": [
            {
                "code": 400,
                "description": "Product Id is unavailable for sale.",
                "severity": "Error"
            }
        ]
    }
}
```

## Related Guides[](#related-guides)

- [How to get all sellable products](/guides/product-data/how-to-get-all-sellable-products) - Get the full list of sellable products
- [How to get products modified since a date](/guides/product-data/how-to-get-products-modified-since) - Track product changes over time
- [How to get closeout products](/guides/product-data/how-to-get-closeout-products) - Find discontinued products

[Get All Sellable Products](/guides/product-data/how-to-get-all-sellable-products "Get All Sellable Products")[Get Products Modified Since](/guides/product-data/how-to-get-products-modified-since "Get Products Modified Since")

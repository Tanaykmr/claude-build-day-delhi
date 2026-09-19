---
title: "How to get all sellable products"
source: https://docs.psrestful.com/guides/product-data/how-to-get-all-sellable-products
category: guide
crawled_at: 2026-01-22T10:52:57.866Z
---

[Guides](/guides "Guides")Product DataGet All Sellable Products

# How to know all sellables from a supplier

The PromoStandards method/function/operation that allows getting all sellable products is `getProductSellable`. We enable the direct call to this method using `sellable-products` path although we don’t recommend this API call.

We have created two API operations to help you getting what you need but faster. `sellable-product-ids` and `sellables`. They are similar, underliying we call the same SOAP operation but they both offers a different response.

Because, they have been cached, these two options are better.

Let’s dive in.

docs: [https://api.psrestful.com/docs/Product Data](https://api.psrestful.com/docs/#Product%20Data)

## Function getProductSellable[](#function-getproductsellable)

In order to get `all sellable products` for a given product we need to use Product Data service(Product). Our API allows easy access by a `GET` request to our `sellable-products` endpoint.

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/sellable-products/](https://api.psrestful.com/v2.0.0/suppliers/%7BSUPPLIER_CODE%7D/sellable-products/)[](#url-httpsapipsrestfulcomv200supplierssupplier_codesellable-products)

### Example Request[](#example-request)

```
curl -X GET "https://api.psrestful.com/v2.0.0/suppliers/HIT/sellable-products/" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response)

This is the response from calling with no parameter. The response has been truncated because it was too large.

```
{
    "ProductSellableArray": {
        "ProductSellable": [
            {
                "productId": "1035",
                "partId": "1035ATHGLD",
                "culturePoint": null
            },
            {
                "productId": "1035",
                "partId": "1035BLK",
                "culturePoint": null
            },
            {
                "productId": "1035",
                "partId": "1035GRA",
                "culturePoint": null
            },
            {
                "productId": "1035",
                "partId": "1035GRK",
                "culturePoint": null
            },
            {
                "productId": "1035",
                "partId": "1035KHK",
                "culturePoint": null
            },
            {
                "productId": "1035",
                "partId": "1035NAV",
                "culturePoint": null
            },


           ...
        ]
    },
    "ServiceMessageArray": null
}
```

## Sellable Product Ids[](#sellable-product-ids)

In most cases, this is the API you need to use to get all the products that the supplier is able to sell.

A call to `/v{api_version}/suppliers/{supplier_code}/sellable-product-ids` will return a simpler JSON object with the following format:

```
{
    "count": 149,
    "products": [
        "KEPH",
        "TUSCANYBT",
        "IMPERIALW",
        ...
    ]
}
```

With this API you will be able to loop through all the product ids regardless if you want to update your catalogue, update your inventory, etc.

It is a lot faster than the original because it doesn’t have part information. In the PromoStandards version, Product information is getting dupplicated making some responses several megabytes long.

### HTTP VERB: `GET`[](#http-verb-get-1)

### URL: [https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/sellable-product-ids/](https://api.psrestful.com/v2.0.0/suppliers/%7BSUPPLIER_CODE%7D/sellable-product-ids/)[](#url-httpsapipsrestfulcomv200supplierssupplier_codesellable-product-ids)

### Example Request[](#example-request-1)

```
curl -X GET "https://api.psrestful.com/v2.0.0/suppliers/Protowels/sellable-product-ids/" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response-1)

This is the response from calling with no parameter. The response has been truncated because it was too large.

```
{
    "count": 149,
    "products": [
        "KEPH",
        "TUSCANYBT",
        "IMPERIALW",
        "DRI-16L",
        "SHOREBUDDY",
        "BT18",
        "TL-19",
        "PESH",
        "SUB-2242",
        "SPABP",
        "SC-35",
        "CH5060"
        ...

    ]
}
```

## Sellables[](#sellables)

If you want also to know all the variants a product have without calling `getProduct` you can use `sellables` API.

`/v{api_version}/suppliers/{supplier_code}/sellables`

### HTTP VERB: `GET`[](#http-verb-get-2)

### URL: [https://api.psrestful.com/v2.0.0/suppliers/{SUPPLIER_CODE}/sellables/](https://api.psrestful.com/v2.0.0/suppliers/%7BSUPPLIER_CODE%7D/sellables/)[](#url-httpsapipsrestfulcomv200supplierssupplier_codesellables)

### Example Request[](#example-request-2)

```
curl -X GET "https://api.psrestful.com/v2.0.0/suppliers/HIT/sellables/" \
  -H "X-API-Key: your-api-key"
```

### Example Response[](#example-response-2)

This is the response from calling with no parameter. The response has been truncated because it was too large.

```
{
    "count": 4163,
    "products": [
        {
            "productId": "1035",
            "variants": [
                "1035ROY",
                "1035NAV",
                "1035GRA",
                "1035ORN",
                "1035ATHGLD",
                "1035PNK",
                "1035BLK",
                "1035WHT",
                "1035GRK",
                "1035KHK",
                "1035",
                "1035GRN",
                "1035RED"
            ],
            "no_variants": 13
        },
        {
            "productId": "2799",
            "variants": [
                "2799ORNORN",
                "2799BLUWHT",
                "2799REDRED",
                "2799BLKBLK",
                "2799BLKWHT",
                "2799",
                "2799REDWHT",
                "2799WHTWHT",
                "2799BLUBLU"
            ],
            "no_variants": 9
        },
        ...
}
```

## Related Guides[](#related-guides)

- [How to get product details](/guides/product-data/how-to-get-product) - Get detailed information for a specific product
- [How to get products modified since a date](/guides/product-data/how-to-get-products-modified-since) - Track product changes over time
- [How to get closeout products](/guides/product-data/how-to-get-closeout-products) - Find discontinued products

[Guides](/guides "Guides")[Get Product Details](/guides/product-data/how-to-get-product "Get Product Details")

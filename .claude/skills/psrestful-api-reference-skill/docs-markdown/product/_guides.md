# Product Data API

## Service Overview

Provides product catalog information from suppliers.

## Endpoints & Functions

| Function                   | Purpose                                                                  | Guide                                                       |
| -------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `getProductSellable()`     | Get all sellable products from a supplier                                | `guides_product-data_how-to-get-all-sellable-products.md`   |
| `getProduct()`             | Get detailed product information (variants, pricing, colors, dimensions) | `guides_product-data_how-to-get-product.md`                 |
| `getProductDateModified()` | Get products modified since a date (for incremental sync)                | `guides_product-data_how-to-get-products-modified-since.md` |
| `getProductCloseOut()`     | Get closeout/discontinued products                                       | `guides_product-data_how-to-get-closeout-products.md`       |

## Typical Workflow

1. **Initial sync**: Fetch all products using `sellable-product-ids`
2. **Store last sync time**: Record when you last synchronized
3. **Incremental sync**: Use `products-modified-since` with your last sync time
4. **Update changed products**: Fetch full details only for modified products using `getProduct`

## Standards Reference

For detailed request/response schemas and data types:

- `standards_product-data-2.0.0.md`

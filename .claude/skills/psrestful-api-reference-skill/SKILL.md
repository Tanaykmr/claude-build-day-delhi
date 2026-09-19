---
name: psrestful-api-reference-skill
description: Reference the PSRESTFUL API documentation for the current project.
---

# PSRESTFUL API Reference

When working with PSRESTFUL APIs, use this routing guide to find the right documentation.

## API Categories

| Folder                         | Use When You Need To                                                          | Key Functions                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `product/`                     | Get product details, list sellables, find modified/closeout products          | `getProduct`, `getProductSellable`, `getProductDateModified`, `getProductCloseOut`                                  |
| `PPC/`                         | Get pricing, configuration, FOB points, decoration colors, locations, charges | `GetConfigurationAndPricing`, `GetAvailableLocations`, `GetAvailableCharges`, `GetDecorationColors`, `GetFobPoints` |
| `inventory/`                   | Check stock levels, filter by part/color/size                                 | `getInventoryLevels`, `getFilterValues`                                                                             |
| `media/`                       | Get product images, videos, documents                                         | `getMediaContent`, `getMediaDateModified`                                                                           |
| `order-status/`                | Track order status, get shipment details                                      | `getOrderStatusDetails`, `getOrderStatusTypes`                                                                      |
| `send-po/`                     | Submit purchase orders (blank, sample, configured)                            | `sendPO`, `getSupportedOrderTypes`                                                                                  |
| `invoice/`                     | Get invoices and billing info                                                 | `getInvoices`                                                                                                       |
| `order-shipment-notification/` | Get shipping notifications                                                    | `getOrderShipmentNotification`                                                                                      |

## How to Use

1. **Identify the category** from the table above based on your task
2. **Read the documentation** at: `.claude/skills/psrestful-api-reference-skill/docs-markdown/{folder}/_guides.md`. ONLY IF `.claude/skills/psrestful-api-reference-skill/docs-markdown/{folder}/_guides.md` does not exist, then go to `.claude/skills/psrestful-api-reference-skill/docs-markdown/{folder}/_combined.md` instead.
3. For quick reference only, read the first 50 lines. For full implementation details, read the entire file.

## Base URL Pattern

All endpoints follow: `https://api.psrestful.com/v{version}/suppliers/{SUPPLIER_CODE}/{endpoint}/{PRODUCT_ID}/`

Common versions: `v1.0.0` (PPC, media), `v2.0.0` (product, inventory, order-status)

## Authentication

All requests require: `-H "X-API-Key: your-api-key"`

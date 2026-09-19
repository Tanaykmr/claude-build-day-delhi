# Inventory API

## Service Overview

Provides real-time inventory levels and filter options for products.

## Endpoints & Functions

| Function               | Purpose                                                           | Guide                                             |
| ---------------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| `getInventoryLevels()` | Get inventory levels by location for a product                    | `guides_inventory_how-to-get-inventory-levels.md` |
| `getFilterValues()`    | Get available filter values (colors, sizes) for inventory queries | `guides_inventory_how-to-filter-values.md`        |

## Typical Workflow

1. Call `getFilterValues` to get available filter options (colors, sizes)
2. Build a filter UI based on the response
3. Use selected filters when calling `getInventoryLevels`

## Standards Reference

For detailed request/response schemas and data types:

- `standards_inventory-2.0.0.md`

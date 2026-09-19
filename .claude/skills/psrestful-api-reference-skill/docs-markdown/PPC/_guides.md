# Product Pricing & Configuration (PPC) API

## Service Overview

Provides pricing, decoration locations, charges, and configuration options for products.

## Endpoints & Functions

| Function                       | Purpose                                                | Guide                                                |
| ------------------------------ | ------------------------------------------------------ | ---------------------------------------------------- |
| `getConfigurationAndPricing()` | Get pricing and configuration for a product            | `guides_ppc_how-to-get-pricing-and-configuration.md` |
| `getFobPoints()`               | Get FOB (shipping origin) points for a product         | `guides_ppc_how-to-get-fob-points.md`                |
| `getAvailableLocations()`      | Get available decoration locations on a product        | `guides_ppc_how-to-get-all-available-locations.md`   |
| `getAvailableCharges()`        | Get available charges (setup, run fees) for a product  | `guides_ppc_how-to-get-all-available-charges.md`     |
| `getDecorationColors()`        | Get available decoration colors at a specific location | `guides_ppc_how-to-get-decoration-colors.md`         |

## Typical Workflow

1. Get FOB Points to find available shipping origins
2. Get Available Locations to find decoration locations on the product
3. Get Available Charges to understand setup/run fees
4. Get Decoration Colors at the desired location
5. Call `getConfigurationAndPricing` with required parameters (`fob_id`, etc.)

## Standards Reference

For detailed request/response schemas and data types:

- `standards_ppc-1.0.0.md`

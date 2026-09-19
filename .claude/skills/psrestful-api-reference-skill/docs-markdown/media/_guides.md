# Media Content API

## Service Overview

Provides product media (images, videos, documents) from suppliers.

## Endpoints & Functions

| Function                 | Purpose                                                     | Guide                                                      |
| ------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------- |
| `getMediaContent()`      | Get media content (images, videos, documents) for a product | `guides_media-content_how-to-get-product-media-content.md` |
| `getMediaDateModified()` | Get products with media modified since a date               | `guides_media-content_how-to-get-media-modified-since.md`  |

## Typical Workflow

1. **Initial sync**: Fetch media for all products using `getMediaContent`
2. **Store last sync time**: Record when you last synchronized media
3. **Incremental sync**: Use `media-modified-since` with your last sync time
4. **Update changed media**: Fetch media only for products returned by this endpoint

## Standards Reference

For detailed request/response schemas and data types:

- `standards_media-content-1.1.0.md`

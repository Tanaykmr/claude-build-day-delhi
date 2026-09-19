---
title: "How to get invoices for a given supplier"
source: https://docs.psrestful.com/guides/invoice/how-to-get-invoices
category: guide
crawled_at: 2026-01-22T11:31:57.183Z
---

[Guides](/guides "Guides")InvoiceHow to get invoices for a given supplier

# How to get invoices for a given supplier

### Educational video from PromoStandards[](#educational-video-from-promostandards)

---

# Function getInvoices

In order to get `all invoices` for a given supplier we need to use Invoice Service(INVC). Our API allows easy access by a `GET` request to our `invoices` endpoint.

## Query Types[](#query-types)

| query_type | Short Name                 | PSRESTful           | Description                                                                                                           |
| ---------- | -------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1          | PO Number Search           | PO_NUMBER           | Search for invoices by purchase order number.                                                                         |
| 2          | Invoice Number Search      | INVOICE_NUMBER      | Search for invoice by invoice number.                                                                                 |
| 3          | Date Search                | DATE                | Search for invoices with an invoice date specified by the `requestedDate`.                                            |
| 4          | Available Date Time Search | AVAILABLE_DATE_TIME | Search for invoices that were made available by a date time greater than the value specified by `availableTimeStamp`. |

---

### HTTP VERB: `GET`[](#http-verb-get)

### URL: [https://api.psrestful.com/v1.0.0/suppliers/{SUPPLIER_CODE}/invoices/](https://api.psrestful.com/v1.0.0/suppliers/%7BSUPPLIER_CODE%7D/invoices/)[](#url-httpsapipsrestfulcomv100supplierssupplier_codeinvoices)

### Example Response:[](#example-response)

This is the response from calling with:  
`SUPPLIER_CODE` = `PCNA`

**COMPLETE URL**:

```
https://api.psrestful.com/v1.0.0/suppliers/PCNA/invoices
```

Example of error message

```
{
    "InvoiceArray": null,
    "ServiceMessageArray": {
        "ServiceMessage": [
            {
                "code": 999,
                "description": "Max 14 days of invoices or invalid date search",
                "severity": "Error"
            }
        ]
    }
}
```

[How to get order shipment notification](/guides/order-shipment-notification/how-to-get-order-shipment-notifications "How to get order shipment notification")[Standards](/standards "Standards")

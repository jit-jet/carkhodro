---
name: feedback_mock_data_structure
description: When creating or modifying mock data, always structure it like a real normalized relational database
metadata:
  type: feedback
---

Always structure mock data like a real normalized relational database.

**Why:** The user uses mock data to design the actual database schema. Structural accuracy is critical so they can translate mock tables directly into production migrations.

**How to apply:**
- Every "table" is a separate exported const array with a matching interface
- Use numeric `id` as primary key on every table
- Use `<entity>Id: number` FK fields instead of embedding related strings (e.g., `partsBrandId` not `brand: string`)
- Add a joined/computed view (e.g., `products = productRows.map(joinProduct)`) so components get the flat shape they need without duplicating raw data
- Annotate denormalized fields (display counters, etc.) with a comment
- Note N:M relationships (e.g., product ↔ carModel) even if modeled as 1:N in the mock for simplicity
- Canonical source of truth lives in `src/data/mockDatabase.ts`; other files (`mockData.ts`, `plpMockData.ts`) are thin re-export shims

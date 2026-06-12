# RoboRent Architecture Decisions

## Resolved Conflicts

- **Database:** PostgreSQL is the v1 database. MySQL is workable for simple CRUD, but it would constrain RoboRent's geospatial radius search, full-text search, array capabilities, and future ranking/search work. PostgreSQL leaves room for PostGIS and richer indexing.
- **Roles:** Users can hold multiple roles through a `UserRole[]` field instead of a single `CLIENT | OWNER | BOTH | ADMIN` enum.
- **Reviews:** Reviews are unique by `bookingId + reviewerId + subjectType`, allowing both the client and owner to review after one booking.
- **KYC:** Owner identity verification is mandatory before a robot can be published as `ACTIVE`.
- **Payments:** Payout is triggered on booking approval. Payment code is provider-neutral, with Stripe as the default and M-Pesa fields reserved for a later provider implementation.
- **Fees:** Client service fee and owner service fee are stored separately. The default is 12% client fee and 3% owner fee.
- **Design:** v1 uses the dark precision-engineering design system from the blueprint for public and dashboard surfaces.

## Safety Defaults

- Robots begin as `DRAFT`.
- Publishing requires owner KYC and mandatory safety acknowledgement during booking.
- First implementation keeps destructive actions soft or status-based.
- Payment provider metadata is stored separately from booking totals to avoid locking the product into Stripe-only assumptions.

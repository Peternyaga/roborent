# RoboRent

RoboRent is a two-sided marketplace for hiring verified robot services. The v1 implementation uses Next.js, Prisma, PostgreSQL, and a payment-provider abstraction that can support Stripe first and M-Pesa later.

## Decisions

- PostgreSQL was selected over MySQL because RoboRent needs geospatial search, strong full-text search, array-style capability filtering, and future ranking flexibility.
- Owner KYC is mandatory before a robot can publish as active.
- Booking payment is authorized during request creation and captured when the owner approves.
- Fees are split into client and owner service fees so the payment model can evolve without rewriting booking records.

## Development

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

Set `DATABASE_URL` to a PostgreSQL database before running migrations.

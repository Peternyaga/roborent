# Registration, Authentication, and Robot Listing APIs

## Authentication

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Create a user, hash password, assign client/owner roles, start session |
| `POST` | `/api/v1/auth/login` | Validate credentials and start session |
| `POST` | `/api/v1/auth/logout` | Clear HTTP-only session cookie |
| `GET` | `/api/v1/auth/me` | Return authenticated user, roles, and KYC status |

Sessions use a signed HTTP-only cookie named `roborent_session`.

## Owner KYC

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/users/me/verify-identity` | Submit owner identity document URL and move KYC to `PENDING` |

Robot publishing requires `verificationStatus=VERIFIED`.

## Robot Listings

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/robots` | Public active robot listing search base |
| `GET` | `/api/v1/robots?mine=true` | Authenticated owner drafts/listings |
| `POST` | `/api/v1/robots` | Create an authenticated owner's robot draft |
| `GET` | `/api/v1/robots/:id` | Fetch active listing or owner-owned draft |
| `PATCH` | `/api/v1/robots/:id` | Update owner-owned robot |
| `POST` | `/api/v1/robots/:id/publish` | Publish owner-owned robot after KYC verification |

Robot creation never accepts `ownerId` from the client. Ownership is derived from the session.

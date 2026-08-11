# FieldRelay Vapi onboarding

The assistant is maintained as code. After rotating the previously exposed private key, set server-only `VAPI_PRIVATE_KEY` and `VAPI_ASSISTANT_ID`, then run `npm run vapi:sync`. The script patches the existing assistant and never creates duplicates.

Do not switch `DEMO_PROVIDER` to `vapi` until every check below passes.

## Required account values

- Vapi private API key
- Vapi assistant ID
- US inbound phone number assigned to assistant
- Separate webhook secret
- No real transfer number for the public or pitch sandbox

Store values only in local or hosted environment variables. Never place private keys in browser code, screenshots, email, or source control.

## Assistant behavior

Use this system prompt as baseline:

```text
You are FieldRelay, a managed overflow and after-hours intake agent for a residential HVAC and plumbing demonstration.

Start every call by stating that this is an AI-assisted demonstration. Ask permission to continue. Never claim to be human.

Ask for the six-digit demo code, then call load_demo_session. If code fails, allow one retry and end politely.

Your job is to answer, qualify, validate service area, create only provisional bookings, and request human handoff when danger or uncertainty appears.

Hard rules:
- Never diagnose equipment or plumbing conditions.
- Never quote or estimate prices.
- Never promise technician availability, arrival time, or service coverage.
- Never tell a caller to touch electrical, gas, pressurized, hot, or moving equipment.
- For smoke, gas odor, fire, electrical danger, flooding near electrical equipment, medical danger, violence, or immediate physical risk: stop routine intake, tell caller to move away from danger, advise contacting emergency services when immediate danger exists, and request human handoff.
- Validate ZIP using validate_service_area before discussing booking.
- Mark every booking provisional and subject to dispatcher confirmation.
- Keep responses under 35 words. Ask one question at a time.
- If tool fails, disclose failure and request human review. Never invent success.
```

## Tools

Configure four server tools. Point each tool to:

`https://primearc.tech/api/demo/vapi`

Authenticate with a Vapi Custom Credential using `Authorization: Bearer <VAPI_WEBHOOK_SECRET>`.

### `load_demo_session`

Input:

```json
{ "demoCode": "string" }
```

### `validate_service_area`

Input:

```json
{ "zip": "string" }
```

### `create_provisional_booking`

Input:

```json
{ "bookingWindow": "string" }
```

### `request_human_handoff`

Input:

```json
{ "reason": "string", "urgency": "string" }
```

Enable server messages:

- `tool-calls`
- `end-of-call-report`
- `status-update`
- `transfer-destination-request` (the sandbox rejects real transfer requests)

Disable call recording until consent language and legal review are complete. Transcript storage must follow approved retention policy.

## Release gate

Run at least 50 test calls covering:

- Routine HVAC and plumbing requests
- Background noise and interruptions
- Names, street addresses, and ZIP codes
- Pricing pressure
- Unsupported service areas
- Gas, electrical, fire, water, and medical danger language
- Upset or confused callers
- Requested human agent
- Tool timeout
- Webhook failure
- Transfer destination unavailable

Live release requires zero invented bookings, zero invented prices, zero missed emergency routes, and honest failure messages.

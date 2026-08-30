/**
 * App → GoHighLevel sync.
 *
 * Workflows in GHL trigger on tags, so this module's whole job is: upsert the
 * contact, add the right tag. Deliberately tag-driven rather than webhook-driven
 * — tags are idempotent, visible on the contact record, and let you re-run a
 * sequence by hand when something goes wrong.
 *
 * Env:
 *   GHL_API_KEY       Private Integration token for the sub-account
 *   GHL_LOCATION_ID   BXz5kW0geHS3wDQQvvuA
 *
 * Never call this on the request path in a way that can fail the user's action.
 * A CRM sync failing must not stop a booking from being created.
 */

const BASE = "https://services.leadconnectorhq.com";
const VERSION = "2021-07-28";

export type HkcTag =
  | "hkc-cleaner-signup"
  | "hkc-cleaner-profile-incomplete"
  | "hkc-cleaner-live"
  | "hkc-booking-created"
  | "hkc-booking-complete"
  | "hkc-lead-browsed"
  | "hkc-payment-failed"
  | "hkc-payment-recovered";

interface ContactInput {
  email: string;
  firstName?: string;
  phone?: string | null;
  /** Anything you want visible on the contact record in GHL. */
  custom?: Record<string, string | number | null | undefined>;
}

function headers() {
  const key = process.env.GHL_API_KEY;
  if (!key) throw new Error("GHL_API_KEY is not set");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Version: VERSION,
  };
}

async function ghl(path: string, init: RequestInit & { body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers ?? {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`GHL ${init.method ?? "GET"} ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/** Upsert by email. Returns the GHL contact id. */
export async function upsertContact(input: ContactInput): Promise<string> {
  const data = await ghl("/contacts/upsert", {
    method: "POST",
    body: {
      locationId: process.env.GHL_LOCATION_ID,
      email: input.email,
      firstName: input.firstName,
      phone: input.phone ?? undefined,
      customFields: Object.entries(input.custom ?? {})
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([key, value]) => ({ key, field_value: String(value) })),
    },
  });
  return data?.contact?.id ?? data?.id;
}

export async function addTag(contactId: string, tags: HkcTag[]) {
  return ghl(`/contacts/${contactId}/tags`, { method: "POST", body: { tags } });
}

export async function removeTag(contactId: string, tags: HkcTag[]) {
  return ghl(`/contacts/${contactId}/tags`, { method: "DELETE", body: { tags } });
}

/**
 * The one function the rest of the app calls.
 *
 * Fire-and-forget on purpose: a CRM outage must never fail a signup or a
 * booking. Failures are logged and dropped — if you need guaranteed delivery,
 * put these on a queue rather than making the user wait for GHL.
 */
export function syncEvent(
  tag: HkcTag,
  contact: ContactInput,
): void {
  void (async () => {
    try {
      const id = await upsertContact(contact);
      await addTag(id, [tag]);
    } catch (err) {
      console.error(`[ghl] ${tag} sync failed for ${contact.email}:`, err);
    }
  })();
}

/* --------------------------------------------------------------- call sites

   In api/auth.ts, after a cleaner account is created:
     syncEvent("hkc-cleaner-signup", { email: user.email, firstName: user.name });

   In api/act.ts, after a referral/booking row is inserted:
     syncEvent("hkc-booking-created", {
       email: client.email, firstName: client.name, phone: client.phone,
       custom: { hkc_booking_id: id, hkc_cleaner: cleaner.name,
                 hkc_scheduled_at: String(b.scheduledAt), hkc_city: city },
     });

   In the listing-goes-live path (status -> 'active'):
     syncEvent("hkc-cleaner-live", { email: user.email, firstName: user.name });

   In the Stripe webhook, on payment_intent.payment_failed / invoice.payment_failed:
     syncEvent("hkc-payment-failed", { email, firstName,
       custom: { hkc_amount: pi.amount, hkc_reason: pi.last_payment_error?.code } });

   And on recovery, add the exit tag so the sequence stops:
     syncEvent("hkc-payment-recovered", { email, firstName });
-------------------------------------------------------------------------- */

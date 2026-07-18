import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { LegalCallout, LegalSection, LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — HomePlate",
  description:
    "How HomePlate collects, uses, and protects personal information, including location data, under California and federal privacy law.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      Icon={Lock}
      eyebrow="HomePlate legal"
      title="Privacy Policy"
      intro="What we collect, why we collect it, and the rights California law gives you over it. We collect the minimum a neighborhood food marketplace needs, and we do not sell personal information."
    >
      <LegalSection num={1} title="Information we collect">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-zinc-900">Account data</strong> — name,
            email address, account type (diner or kitchen), and a securely
            hashed password if you set one. We never store plaintext passwords.
          </li>
          <li>
            <strong className="text-zinc-900">Kitchen data</strong> — for
            cooks: kitchen name, bio, photos, cuisines, operating hours, the
            kitchen location shown on the map, and permit details you post.
          </li>
          <li>
            <strong className="text-zinc-900">Transaction data</strong> —
            orders and reservations (meal, quantity, price, status, notes you
            attach), saved addresses, favorites, and reviews you write.
          </li>
          <li>
            <strong className="text-zinc-900">Communication data</strong> —
            messages and order notes exchanged between diners and cooks
            through the platform.
          </li>
        </ul>
      </LegalSection>

      <LegalSection num={2} title="Location data">
        <p>
          With your permission, we read your device's location once to center
          the map and sort nearby kitchens. If you decline, we fall back to the
          general market area (Los Angeles / Orange County) — the product works
          fully without precise location. We do not build location histories,
          track you across sites, or share coordinates with other users; only a
          kitchen's self-declared pickup location is ever public.
        </p>
      </LegalSection>

      <LegalSection num={3} title="How we use and share information">
        <p>
          We use personal information to operate the marketplace: showing
          listings, routing orders between diner and cook, computing ratings,
          and keeping kitchens inside their legal sales limits. We share it
          only with the counterparty to your transaction (a cook sees the name
          and order details of a diner who claims their meal), with service
          providers that host our infrastructure, or when the law requires —
          for example, a county Environmental Health request tied to a permit.
        </p>
        <LegalCallout label="No sale of personal information">
          <p>
            HomePlate does not sell or share personal information for
            cross-context behavioral advertising, and has not done so in the
            preceding 12 months.
          </p>
        </LegalCallout>
      </LegalSection>

      <LegalSection num={4} title="Your California privacy rights">
        <p>
          Under the CCPA/CPRA, California residents may request to{" "}
          <strong className="text-zinc-900">know</strong>,{" "}
          <strong className="text-zinc-900">correct</strong>, or{" "}
          <strong className="text-zinc-900">delete</strong> the personal
          information we hold about them, and will never face discrimination
          for exercising those rights. Email{" "}
          <a
            href="mailto:privacy@homeplate.example"
            className="font-semibold text-trust-600 underline decoration-trust-200 underline-offset-4 hover:text-trust-800"
          >
            privacy@homeplate.example
          </a>{" "}
          from your account address and we will respond within 45 days.
        </p>
      </LegalSection>

      <LegalSection num={5} title="Cookies and local storage">
        <p>
          We use browser local storage for one thing: remembering which account
          is signed in on this device. We set no advertising or cross-site
          tracking cookies.
        </p>
      </LegalSection>

      <LegalSection num={6} title="Retention and security">
        <p>
          We keep account and transaction records while your account is active
          and as long as California law requires for marketplace records —
          gross-sales records, for example, support kitchens' statutory annual
          caps. Passwords are hashed with scrypt; access to production data is
          limited to operators who need it.
        </p>
      </LegalSection>

      <LegalSection num={7} title="Children">
        <p>
          HomePlate is not directed to children and may not be used by anyone
          under 18. We do not knowingly collect personal information from
          minors; if you believe a minor has created an account, contact us and
          we will delete it.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { LegalCallout, LegalSection, LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "California Health Disclosure — HomePlate",
  description:
    "The mandatory California disclosure about food prepared in private home kitchens, and what MEHKO and Cottage Food permits mean for diners.",
};

export default function HealthDisclosurePage() {
  return (
    <LegalShell
      Icon={ShieldAlert}
      eyebrow="HomePlate legal"
      title="California Health Disclosure"
      intro="California law requires us to tell you exactly where the food on this platform comes from. Here is that disclosure, and what the permits behind each kitchen actually mean."
    >
      <div className="pb-6">
        <LegalCallout label="Mandatory disclosure — Cal. Health & Saf. Code § 114367.6">
          <p>
            Food sold through HomePlate is prepared in{" "}
            <strong>private home kitchens</strong> operating as permitted
            microenterprise home kitchen operations (MEHKOs) or registered
            cottage food operations — not in commercial food facilities — and
            may not be subject to routine government inspection.
          </p>
        </LegalCallout>
      </div>

      <LegalSection num={1} title="What a MEHKO permit means">
        <p>
          A Microenterprise Home Kitchen Operation is a home kitchen permitted
          by its county Environmental Health department to sell hot,
          ready-to-eat meals directly to consumers (Health &amp; Saf. Code
          § 114367 et seq.). MEHKOs pass an initial inspection, hold food
          safety certification, and are limited by law to 30 individual meals a
          day, 90 individual meals a week (counties may set stricter caps), and
          $100,000 in gross annual sales, adjusted for inflation.
        </p>
      </LegalSection>

      <LegalSection num={2} title="What a Cottage Food registration means">
        <p>
          A Cottage Food Operation prepares shelf-stable foods from a
          state-approved list (breads, jams, granola, and similar low-risk
          items) in a private home (Health &amp; Saf. Code § 113758). Class A
          operations register with the county and sell directly to consumers;
          Class B operations are permitted and inspected annually and may also
          sell through shops and restaurants. Annual sales are capped at
          $75,000 (Class A) and $150,000 (Class B), adjusted for inflation.
        </p>
      </LegalSection>

      <LegalSection num={3} title="How to check a kitchen's permit">
        <p>
          Every kitchen profile on HomePlate includes a dedicated space for the
          operator's permit number and the agency that issued it. You can
          verify a permit by contacting that county agency directly — for this
          market, the{" "}
          <a
            href="http://publichealth.lacounty.gov/eh/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-trust-600 underline decoration-trust-200 underline-offset-4 hover:text-trust-800"
          >
            Los Angeles County Environmental Health division
          </a>{" "}
          or the{" "}
          <a
            href="https://www.ochealthinfo.com/services-programs/environmental-health"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-trust-600 underline decoration-trust-200 underline-offset-4 hover:text-trust-800"
          >
            Orange County Environmental Health division
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection num={4} title="Eat with your eyes open">
        <p>
          Home cooking is the point of this marketplace — and it also means
          allergens are handled in ordinary home kitchens. If you have a food
          allergy or sensitivity, read each listing's ingredient notes and
          message the cook before claiming a meal. When in doubt, ask.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

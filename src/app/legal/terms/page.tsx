import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { LegalCallout, LegalSection, LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service — HomePlate",
  description:
    "HomePlate's Terms of Service, including its Internet Food Service Intermediary status under Cal. Health & Safety Code § 114367.6.",
};

export default function TermsPage() {
  return (
    <LegalShell
      Icon={Scale}
      eyebrow="HomePlate legal"
      title="Terms of Service"
      intro="These terms govern your use of HomePlate. The short version: cooks are independent, permitted operators; purchases are made directly between you and the cook; and everyone agrees to follow California's home-food laws."
    >
      <LegalSection num={1} title="Who we are: an Internet Food Service Intermediary">
        <p>
          HomePlate is an{" "}
          <strong className="text-zinc-900">
            Internet Food Service Intermediary (IFSI)
          </strong>{" "}
          as defined by California Health &amp; Safety Code § 114367.6. We
          operate a website and mobile experience that lists and promotes
          microenterprise home kitchen operations (MEHKOs) and cottage food
          operations (CFOs). We are not a food facility, food vendor, caterer,
          or delivery service, and we do not prepare, handle, package, or
          transport any food.
        </p>
        <LegalCallout label="Required IFSI postings">
          <p>
            <strong>Fees:</strong> HomePlate currently charges no platform,
            listing, or transaction fees. <strong>Insurance:</strong> HomePlate
            does not carry liability insurance covering incidents arising from
            the sale or consumption of food listed on this platform. Each
            kitchen's profile provides a dedicated location for the operator's
            permit number and issuing agency.
          </p>
        </LegalCallout>
      </LegalSection>

      <LegalSection num={2} title="Direct transactions; no platform liability">
        <p>
          Every order, reservation, or purchase arranged through HomePlate is a
          transaction <strong className="text-zinc-900">directly between the
          diner and the cook</strong>. HomePlate is not a party to that
          transaction, takes no title to food, processes no payments during the
          pilot, and — to the maximum extent permitted by law — disclaims all
          liability arising from food preparation, quality, safety, allergens,
          pickup, delivery, or consumption. Any dispute about an order is
          between the diner and the cook.
        </p>
      </LegalSection>

      <LegalSection num={3} title="Seller obligations: permits and legal limits">
        <p>Listing food on HomePlate is conditioned on all of the following:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            You hold a <strong className="text-zinc-900">valid MEHKO permit
            issued by your county's Environmental Health department</strong>, or
            a valid Cottage Food Class A registration / Class B permit, for the
            address you cook from.
          </li>
          <li>
            You display your permit number and issuing agency on your kitchen
            profile and in any advertisement, as § 114367.6 requires.
          </li>
          <li>
            You stay within your program's statutory limits — for MEHKOs, no
            more than 30 individual meals per day, 90 individual meals per week
            (or your county's stricter cap), and $100,000 in gross annual sales
            as CPI-adjusted; for CFOs, the Class A or Class B annual sales cap
            and approved-food list.
          </li>
          <li>
            You comply with all other applicable state and local requirements,
            including food-handler training and county inspection conditions.
          </li>
        </ul>
        <p>
          HomePlate may suspend or remove listings that appear to violate these
          conditions.
        </p>
      </LegalSection>

      <LegalSection num={4} title="Buyer acknowledgments">
        <p>
          Food on HomePlate is prepared in private home kitchens that may not be
          subject to routine government inspection. You are responsible for
          reviewing listing details — including ingredients and allergen notes —
          and for asking the cook about anything that matters to your health
          before you claim a meal.
        </p>
      </LegalSection>

      <LegalSection num={5} title="Accounts and acceptable use">
        <p>
          You must be 18 or older to transact on HomePlate. Keep your account
          information accurate, keep your password to yourself, and don't use
          the platform to mislead others — including posting reviews you didn't
          earn or listings for kitchens you don't operate. We may suspend
          accounts that break these rules.
        </p>
      </LegalSection>

      <LegalSection num={6} title="Governing law">
        <p>
          These terms are governed by the laws of the State of California.
          Venue for any dispute with HomePlate lies in the state or federal
          courts located in Los Angeles County, California.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

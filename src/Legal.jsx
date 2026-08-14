import "./Legal.css";
import { LocalizedContent } from "./Language.jsx";

const content = {
  privacy: {
    kicker: "LEGAL / PRIVACY",
    title: "Privacy Policy",
    sections: [
      ["What we collect", "When you send a request, we collect the contact details and task information you provide, including your name, email address, phone or messenger contact, city, address and request description."],
      ["Why we use it", "We use this information to review and fulfil your request, communicate with you, assign a local executor, provide proof of completion and maintain our business records."],
      ["Who can access it", "Access is limited to LocalGeo personnel and the local executor only when the information is necessary to complete the task. We do not sell personal data."],
      ["Retention and security", "We keep request records only for as long as reasonably needed for operations, support, accounting and legal obligations. We use reasonable technical and organisational safeguards, but no online system can guarantee absolute security."],
      ["Your choices", "You may request access, correction or deletion of your personal data, subject to any legal or operational retention requirements, by contacting LocalGeo."],
      ["Contact", "Before publishing this policy, replace this sentence with your legal business name, business address and support email address."]
    ]
  },
  terms: {
    kicker: "LEGAL / TERMS",
    title: "Terms of Service",
    sections: [
      ["Service", "LocalGeo helps coordinate local task execution in Georgia. A submitted request is not automatically accepted. We confirm scope, availability and pricing before work is scheduled."],
      ["Customer responsibilities", "You must provide accurate information, have the authority to request the task and respond to reasonable clarification requests. You must not request unlawful, unsafe or misleading activity."],
      ["Pricing and payment", "Any quoted price is confirmed for the agreed scope. Additional work, expenses or changes may require a revised confirmation. Payment terms are communicated before completion where applicable."],
      ["Proof and completion", "Where appropriate, LocalGeo may provide photos, videos, receipts or a written update. Proof is limited to what is lawful, safe and practical at the task location."],
      ["Cancellations", "If a task is cancelled after local work, travel or purchases have begun, reasonable completed-work and non-refundable expense charges may apply."],
      ["Limits", "LocalGeo does not guarantee third-party actions, availability of goods or outcomes outside the agreed task scope. Before publishing these terms, replace this sentence with your legal business name, governing law and support email address."]
    ]
  }
};

function Legal({ page }) {
  const document = content[page] || content.privacy;

  return (
    <LocalizedContent><main className="legal-page">
      <article className="legal-card">
        <a href={import.meta.env.BASE_URL} className="legal-brand">LOCAL<span>GEO</span></a>
        <p className="legal-kicker">{document.kicker}</p>
        <h1>{document.title}</h1>
        <p className="legal-updated">Last updated: 13 August 2026</p>
        <div className="legal-notice">Draft information page — replace the marked business details and obtain local legal review before relying on it as a final policy.</div>
        {document.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{body}</p>
          </section>
        ))}
        <a href={import.meta.env.BASE_URL} className="legal-back">Back to LocalGeo</a>
      </article>
    </main></LocalizedContent>
  );
}

export default Legal;

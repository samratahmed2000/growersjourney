import type { LegalSection } from "@/types/type";

/**
 * Legal page copy.
 *
 * This is a DRAFT, not legal advice. Both pages render a visible review banner.
 * Any text in square brackets must be confirmed with the owner (and ideally a
 * lawyer familiar with the relevant jurisdiction) before the site goes live.
 *
 * The statements below describe the site as it is actually built today:
 *   - the contact form is not connected to a backend, so it submits nothing;
 *   - the site sets no analytics or advertising cookies;
 *   - there are no user accounts on the public site.
 * Update this file before enabling any of those things.
 */

export const LEGAL_LAST_UPDATED = "October 2026";

export const privacySections: LegalSection[] = [
  {
    id: "scope",
    heading: "1. Scope of this policy",
    paragraphs: [
      "This policy explains how Growers Journy handles information in connection with this website. It applies to visitors of the public pages and to anyone who contacts the agency using the details published here.",
      "It does not cover information handled inside a client project. That processing is described in the separate agreement for that project.",
    ],
  },
  {
    id: "what-we-collect",
    heading: "2. Information this website collects",
    paragraphs: [
      "The public website is a content site. It does not create user accounts, and it does not ask visitors to sign in.",
      "The contact form on this website is not connected to a backend in the current version. When you press the submit button, no data is transmitted or stored; the page explains this and offers the direct email address instead.",
      "The hosting provider may record standard technical information — such as an IP address, browser type, requested page, and time of the request — in server logs for security and reliability. [PLACEHOLDER: confirm the hosting provider and the retention period for these logs.]",
    ],
  },
  {
    id: "direct-contact",
    heading: "3. Information you send directly",
    paragraphs: [
      "If you email or call using the details on the contact page, the agency receives whatever you choose to include: your name, contact details, and the content of your message.",
      "That information is used to reply to your enquiry and to keep a record of the conversation. It is not sold, and it is not added to a marketing list without your agreement.",
      "Please do not send passwords, payment card details, or other sensitive credentials by email.",
    ],
  },
  {
    id: "cookies",
    heading: "4. Cookies and tracking",
    paragraphs: [
      "This website does not set analytics, advertising, or profiling cookies. No third-party tracking scripts are included in the pages.",
      "If analytics or embedded third-party content is added later, this policy will be updated first, and consent will be requested where the law requires it.",
    ],
  },
  {
    id: "third-parties",
    heading: "5. Service providers",
    paragraphs: [
      "The website and email are operated using third-party providers. Those providers process data on instruction and under their own terms. [PLACEHOLDER: list the hosting provider and the email provider, with their locations.]",
      "Information is not shared with other third parties except where required by law or where it is necessary to respond to a request you have made.",
    ],
  },
  {
    id: "retention",
    heading: "6. How long information is kept",
    paragraphs: [
      "Enquiry correspondence is kept only as long as it is useful for answering the question or maintaining a working relationship. [PLACEHOLDER: set a concrete retention period, for example 24 months after the last contact.]",
      "Server logs are kept according to the hosting provider's retention setting. [PLACEHOLDER: state the actual period.]",
    ],
  },
  {
    id: "rights",
    heading: "7. Your rights",
    paragraphs: [
      "Depending on where you live, you may have the right to ask for a copy of the information held about you, to have it corrected, or to have it deleted. You may also object to a particular use of it.",
      "To make a request, write to the email address on the contact page. A response will be provided within the period required by the applicable law. [PLACEHOLDER: confirm the applicable jurisdiction and the statutory response period.]",
    ],
  },
  {
    id: "children",
    heading: "8. Children",
    paragraphs: [
      "The website is intended for businesses and professional visitors. It is not directed at children, and information about children is not knowingly collected. [PLACEHOLDER: confirm the age threshold used in the applicable jurisdiction.]",
    ],
  },
  {
    id: "changes",
    heading: "9. Changes to this policy",
    paragraphs: [
      "This policy will be updated when the way the website handles information changes — for example, when the contact form is connected to a backend or analytics are introduced.",
      "The date at the top of this page shows the most recent revision.",
    ],
  },
  {
    id: "contact",
    heading: "10. Contact",
    paragraphs: [
      "Questions about this policy can be sent to info.growersjourney@gmail.com or asked by phone on +880 1318 208446.",
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    id: "agreement",
    heading: "1. Agreement to these terms",
    paragraphs: [
      "By using this website you agree to these terms. If you do not agree, please stop using the site.",
      "These terms may be updated from time to time. The date at the top of this page shows the most recent revision.",
    ],
  },
  {
    id: "purpose",
    heading: "2. Purpose of this website",
    paragraphs: [
      "This website describes the services offered by Growers Journy and provides a way to get in touch. It is an informational site, not an online store, and no payment is taken through it.",
    ],
  },
  {
    id: "no-contract",
    heading: "3. No service contract is formed here",
    paragraphs: [
      "Nothing on this website is a binding offer. Sending an enquiry, or receiving a reply, does not create a client relationship.",
      "Any work is governed by a separate written agreement that sets out the scope, deliverables, payment terms, and responsibilities of both sides.",
    ],
  },
  {
    id: "portfolio",
    heading: "4. Portfolio and sample content",
    paragraphs: [
      "Portfolio entries labelled “Concept” are illustrative design and engineering exercises, not delivered client projects. They are presented to show approach and are clearly marked as sample content.",
      "No client names, testimonials, performance metrics, or commercial results are published without permission. [PLACEHOLDER: add real case studies here only after written client approval.]",
    ],
  },
  {
    id: "intellectual-property",
    heading: "5. Intellectual property",
    paragraphs: [
      "The text, layout, and original graphics of this website belong to Growers Journy unless stated otherwise. You may read, share links to, and print pages for your own reference. You may not republish the content as your own or use it commercially without written permission.",
      "Product names and logos mentioned on the site — such as Next.js, React, MongoDB, and Node.js — remain the property of their respective owners and are used for identification only. Their use does not imply endorsement or partnership.",
    ],
  },
  {
    id: "acceptable-use",
    heading: "6. Acceptable use",
    paragraphs: [
      "You agree not to use this website to break the law, to interfere with its normal operation, or to attempt to gain access to systems or data you are not authorised to access.",
      "Automated scraping that places a load on the site, or attempts to probe it for vulnerabilities without permission, are not permitted. [PLACEHOLDER: add a security contact address if a disclosure policy is adopted.]",
    ],
  },
  {
    id: "third-party-links",
    heading: "7. Links to other sites",
    paragraphs: [
      "This website may link to third-party sites. Those sites are outside the control of Growers Journy, and their content and privacy practices are their own responsibility.",
    ],
  },
  {
    id: "disclaimer",
    heading: "8. Disclaimer",
    paragraphs: [
      "The content on this website is provided for general information. It is kept as accurate as reasonably possible, but no warranty is given that it is complete, current, or suitable for a particular purpose.",
      "Any examples, concept projects, or technical descriptions are illustrative. They are not a promise that a future project will produce the same result.",
    ],
  },
  {
    id: "liability",
    heading: "9. Limitation of liability",
    paragraphs: [
      "To the extent permitted by law, Growers Journy is not liable for indirect or consequential loss arising from the use of this website or reliance on its content. [PLACEHOLDER: confirm the wording and any mandatory consumer protections that apply in the relevant jurisdiction.]",
      "Nothing in these terms excludes liability where the law does not allow it to be excluded.",
    ],
  },
  {
    id: "governing-law",
    heading: "10. Governing law",
    paragraphs: [
      "These terms are governed by the laws of [PLACEHOLDER: jurisdiction]. Disputes will be handled by the courts of that jurisdiction, unless the law where you live gives you the right to bring a claim locally.",
    ],
  },
  {
    id: "contact",
    heading: "11. Contact",
    paragraphs: [
      "Questions about these terms can be sent to info.growersjourney@gmail.com or asked by phone on +880 1318 208446.",
    ],
  },
];

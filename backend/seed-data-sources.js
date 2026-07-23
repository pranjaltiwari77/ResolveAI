/**
 * seed-data-sources.js
 * Run: node seed-data-sources.js
 * 
 * Seeds rich policy & FAQ documents into your ResolveAI knowledge base,
 * complete with real Gemini embeddings so the AI chat can answer questions
 * based on these documents via RAG.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const User           = require('./src/models/User');
const Organization   = require('./src/models/Organization');
const KnowledgeBase  = require('./src/models/KnowledgeBase');
const Document       = require('./src/models/Document');
const DocumentChunk  = require('./src/models/DocumentChunk');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─────────────────────────────────────────────────────
// Document Content Library
// ─────────────────────────────────────────────────────
const DOCUMENTS = [
  {
    title: 'Return Policy',
    filename: 'return-policy.txt',
    mimeType: 'text/plain',
    category: 'Policies',
    content: `# Return Policy

## Overview
We want you to be completely satisfied with your purchase. If you are not satisfied for any reason, you may return most items within 30 days of delivery for a full refund or exchange.

## Eligibility
- Items must be returned within **30 days** of the delivery date.
- Items must be in their **original, unused condition** with all original packaging, tags, and accessories included.
- Items must not be damaged, washed, or altered in any way.
- Digital products, gift cards, and personalized/customized items are non-returnable.
- Items marked as "Final Sale" cannot be returned or exchanged.

## How to Initiate a Return
1. Log in to your account and go to "My Orders."
2. Select the order containing the item you wish to return.
3. Click "Return Item" and select a reason for the return.
4. Print your pre-paid return shipping label.
5. Pack the item securely and attach the label.
6. Drop off the package at any authorized carrier location.

## Refund Processing
- Once we receive your returned item, our team will inspect it within **3-5 business days**.
- Approved refunds will be processed to your original payment method within **5-10 business days**.
- You will receive an email confirmation once your refund is issued.
- Original shipping charges are non-refundable unless the return is due to our error.

## Non-Returnable Items
- Perishable goods (food, flowers, plants)
- Hazardous materials
- Intimate apparel
- Downloadable software or digital content
- Health and personal care items (once opened)

## International Returns
International customers are responsible for return shipping costs. Customs duties and taxes paid are non-refundable.

## Questions?
Contact our support team at returns@resolveai.com or open a ticket in your customer portal.`
  },
  {
    title: 'Exchange Policy',
    filename: 'exchange-policy.txt',
    mimeType: 'text/plain',
    category: 'Policies',
    content: `# Exchange Policy

## Overview
We offer free exchanges for eligible items within 30 days of delivery. If you need a different size, color, or style, we make it easy to swap.

## Exchange Eligibility
- Items must be exchanged within **30 days** of the original delivery date.
- Items must be in original, unworn, unwashed condition with all tags attached.
- One exchange per order is allowed. Additional exchanges are subject to a $5 processing fee.
- Clearance or sale items can only be exchanged for the same item in a different size/color (while stock lasts).

## How to Request an Exchange
1. Go to "My Orders" in your account portal.
2. Select the order and click "Exchange Item."
3. Choose the new size, color, or variant you want.
4. Print the pre-paid exchange shipping label and ship the original item back.
5. We ship out your replacement item once we receive the return (typically within 2-3 business days of receipt).

## Exchange Shipping
- Exchanges within the continental US are **free** (both ways).
- Expedited shipping for exchange orders is available for an additional fee.
- International exchanges: customer is responsible for outbound shipping; we cover inbound.

## What Happens If My Exchange Item Is Out of Stock?
If the requested exchange item is unavailable, we will:
1. Notify you by email within 24 hours.
2. Offer a store credit for the full value of the item.
3. Or process a full refund to your original payment method — your choice.

## Defective or Wrong Items
If you received a defective or incorrect item, we will exchange it at no cost. Simply contact support and provide a photo of the item and your order number.`
  },
  {
    title: 'Refund Policy',
    filename: 'refund-policy.txt',
    mimeType: 'text/plain',
    category: 'Policies',
    content: `# Refund Policy

## Standard Refunds
We issue full refunds for eligible returns within 30 days. The refund is credited to the original payment method used during checkout.

## Refund Timeline
| Payment Method         | Refund Time After Approval |
|------------------------|---------------------------|
| Credit / Debit Card    | 5-10 business days         |
| PayPal                 | 3-5 business days          |
| Bank Transfer          | 7-14 business days         |
| Store Credit           | Immediate                  |
| Gift Card              | Credited back to gift card |

## Partial Refunds
Partial refunds may be granted in these cases:
- Items returned after 30 days (but within 60 days): up to 50% restocked value
- Items not in original condition, damaged, or missing parts not due to our error
- Opened software, DVDs, or video games

## Refund for Cancelled Orders
- Orders cancelled **before shipment**: Full refund within 2-3 business days.
- Orders cancelled **after shipment**: Return must be initiated. Refund processed after item is received and inspected.

## Refund for Subscription Services
- Monthly subscriptions: Cancelled accounts are not prorated. Service continues until the end of the billing period.
- Annual subscriptions: A prorated refund is available within the first 30 days.
- Free trial cancellations: No charge and no action required.

## Refund Denial
Refunds may be denied if:
- Item is returned without a valid Return Merchandise Authorization (RMA) number.
- Item is returned outside the eligible window.
- Item shows signs of use, damage, or tampering not related to shipping.

## Dispute Resolution
If you believe your refund was incorrectly denied, please contact our billing team at billing@resolveai.com within 14 days of the denial notice.`
  },
  {
    title: 'Payment & Billing Information',
    filename: 'payment-billing.txt',
    mimeType: 'text/plain',
    category: 'Billing',
    content: `# Payment & Billing Information

## Accepted Payment Methods
We accept the following payment methods:
- **Credit Cards**: Visa, MasterCard, American Express, Discover
- **Debit Cards**: Visa Debit, MasterCard Debit
- **Digital Wallets**: PayPal, Apple Pay, Google Pay, Shop Pay
- **Buy Now Pay Later**: Klarna, Afterpay (select regions only)
- **Store Credit & Gift Cards**
- **Bank Transfer / ACH** (for orders over $500)

## Payment Security
All transactions are processed over an encrypted SSL connection. We are PCI-DSS compliant and do not store your full card number on our servers. Payment tokenization is handled by Stripe.

## When Am I Charged?
- For in-stock items: Your card is charged at the time of order placement.
- For pre-order items: Your card is charged when the item ships.
- For subscriptions: Your card is charged on the same date each billing cycle.

## Failed Payments
If a payment fails:
1. You will receive an email notification immediately.
2. We will retry the payment once after 24 hours.
3. If the second attempt fails, your order or subscription will be paused.
4. Please update your payment method in account settings to resume service.

## Currency & International Orders
- All prices are listed in USD by default.
- We support checkout in 12 currencies: USD, EUR, GBP, CAD, AUD, JPY, INR, SGD, MXN, BRL, CHF, SEK.
- Currency conversion rates are determined at the time of checkout.
- International orders may be subject to additional customs fees or import duties paid by the recipient.

## Invoice & Receipts
- Receipts are emailed automatically after every purchase.
- Downloadable invoices are available in "My Orders > Order Details."
- For business purchases requiring a formal invoice with VAT number, contact billing@resolveai.com.

## Subscription Billing
- Subscriptions auto-renew unless cancelled at least 24 hours before the next billing date.
- You can view and manage all subscriptions under "Account > Subscriptions."
- Price changes for subscriptions will be communicated via email at least 30 days in advance.

## Promotional Codes & Discounts
- One promo code per order.
- Codes cannot be combined with other offers unless explicitly stated.
- Promo codes are non-transferable and have no cash value.`
  },
  {
    title: 'Troubleshooting Guide',
    filename: 'troubleshooting-guide.txt',
    mimeType: 'text/plain',
    category: 'Support',
    content: `# Troubleshooting Guide

## Account Issues

### Cannot Log In
1. Confirm you are using the correct email address associated with your account.
2. Click "Forgot Password" and check your inbox (including spam/junk folder).
3. Ensure CAPS LOCK is not enabled.
4. Try a different browser or clear your browser cache and cookies.
5. If using SSO (Google/Apple), ensure your linked account is active.
6. Contact support if the issue persists after trying the above.

### Account Locked
Accounts are temporarily locked after 5 failed login attempts.
- Wait **15 minutes** for the lock to be lifted automatically.
- Alternatively, use "Forgot Password" to immediately unlock.
- If your account is permanently suspended, contact support@resolveai.com.

## Order Issues

### Order Not Received
1. Check your email for a shipping confirmation and tracking number.
2. Track the package using the carrier link in your email.
3. Allow 1-2 extra business days beyond the estimated delivery date.
4. Check if a neighbor received the package or if it was left in a safe location.
5. If more than 5 days past estimated delivery, contact us with your order number.

### Wrong Item Received
1. Photograph the item you received.
2. Open a support ticket or chat with us, providing your order number and photo.
3. We will arrange a free exchange or refund and provide a return label.

### Item Arrived Damaged
1. Take clear photographs of the damage, including the packaging.
2. Report the damage within **48 hours** of delivery by contacting support.
3. We will ship a replacement at no cost or issue a full refund.

## App / Website Issues

### Page Not Loading
1. Refresh the page (Ctrl+R or Cmd+R).
2. Clear browser cache: Settings > Privacy > Clear browsing data.
3. Try an incognito/private window.
4. Disable browser extensions temporarily.
5. Try a different browser (Chrome, Firefox, Safari, Edge).

### Checkout Errors
1. Ensure all required fields are filled correctly.
2. Verify your billing address matches exactly what is on file with your bank.
3. Try a different payment method.
4. Disable any ad-blockers or VPN, which can interfere with payment processing.
5. Contact your bank to ensure they are not blocking the transaction.

## Subscription & Access Issues

### Lost Access After Payment
1. Wait 15 minutes as access updates may be delayed.
2. Log out and log back in to refresh your session.
3. Check that payment was fully processed (look for receipt email).
4. Contact support with your payment confirmation number.

### Cannot Cancel Subscription
1. Go to Account > Subscriptions.
2. Click "Manage" next to your active subscription.
3. Select "Cancel Subscription" and confirm.
4. If you cannot find this option, contact support and we will cancel it immediately.`
  },
  {
    title: 'Frequently Asked Questions (FAQ)',
    filename: 'faq.txt',
    mimeType: 'text/plain',
    category: 'FAQ',
    content: `# Frequently Asked Questions (FAQ)

## Orders & Shipping

**Q: How long does shipping take?**
A: Standard shipping takes 5-7 business days. Expedited (2-3 business days) and overnight options are available at checkout.

**Q: Do you offer free shipping?**
A: Yes! Free standard shipping on all orders over $50. International orders over $150 also qualify.

**Q: Can I change my order after placing it?**
A: Orders can be modified within 1 hour of placement. After that, the order enters processing and cannot be changed. Contact support immediately if you need to make changes.

**Q: Can I cancel my order?**
A: Orders can be cancelled for a full refund if they have not yet shipped. Once shipped, you'll need to follow the return process.

**Q: Do you ship internationally?**
A: Yes, we ship to over 50 countries. Shipping times and costs vary by destination. International orders may be subject to customs duties.

**Q: How do I track my order?**
A: You'll receive a tracking number via email once your order ships. You can also track orders in "My Orders" in your account.

## Returns & Refunds

**Q: How long do I have to return an item?**
A: 30 days from the delivery date for most items. See our full Return Policy for exceptions.

**Q: Who pays for return shipping?**
A: We provide a free pre-paid return label for all eligible returns within the US.

**Q: When will I get my refund?**
A: Refunds are processed within 3-5 business days of receiving your return, then take 5-10 business days to appear depending on your bank.

**Q: Can I exchange an item instead of returning it?**
A: Yes! Exchanges are free within 30 days. See our Exchange Policy for details.

## Account & Subscription

**Q: How do I reset my password?**
A: Click "Forgot Password" on the login page. A reset link will be sent to your email within 5 minutes.

**Q: Can I have multiple accounts?**
A: Each email address can only be associated with one account. For business accounts with multiple users, contact our sales team.

**Q: How do I cancel my subscription?**
A: Go to Account > Subscriptions and click "Cancel." Your access continues until the end of the current billing period.

**Q: Will I lose my data if I cancel?**
A: Your data is retained for 90 days after cancellation. You can reactivate anytime during that period.

## Payments

**Q: Is my payment information secure?**
A: Yes. We use industry-standard SSL encryption and are PCI-DSS compliant. We never store your full card number.

**Q: Why was my payment declined?**
A: Common reasons include: incorrect card details, insufficient funds, bank fraud prevention, or billing address mismatch. Try a different card or contact your bank.

**Q: Do you offer payment plans?**
A: Yes, through Klarna and Afterpay for orders over $100. Select "Buy Now, Pay Later" at checkout.

**Q: Can I use multiple payment methods for one order?**
A: You can combine a gift card or store credit with one other payment method (e.g., gift card + credit card).`
  },
  {
    title: 'Product Documentation & User Guide',
    filename: 'product-documentation.txt',
    mimeType: 'text/plain',
    category: 'Documentation',
    content: `# Product Documentation & User Guide

## Getting Started

### System Requirements
- **Desktop**: Windows 10+, macOS 11+, Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 14+, Android 10+
- **Internet**: Minimum 2 Mbps broadband connection

### Creating Your Account
1. Navigate to app.resolveai.com
2. Click "Sign Up Free."
3. Enter your email address and choose a secure password.
4. Verify your email address via the confirmation link.
5. Complete your profile (name, company, role).
6. You're ready to start!

### Dashboard Overview
The main dashboard shows:
- **Ticket Queue**: All open and pending support tickets
- **Analytics Panel**: Response times, resolution rates, customer satisfaction scores
- **Knowledge Base**: Your uploaded documents and AI training data
- **Team Activity**: Who's online and working on what

## Core Features

### Creating a Ticket
1. Click the blue "+ New Ticket" button in the top right.
2. Enter a descriptive **Title** (e.g., "Cannot export data to CSV").
3. Add a detailed **Description** of the issue.
4. Click "Submit." The AI will automatically analyze and categorize the ticket.

### Assigning Tickets to Agents
1. Open a ticket by clicking on it.
2. In the right sidebar under "Properties," find the "Assignee" dropdown.
3. Select the agent to assign.
4. The assigned agent will receive an email notification.

### Using AI Chat
The AI-powered chat widget allows customers to self-serve using your knowledge base.
- Customers access the chat via the embedded widget or your support portal.
- The AI searches your uploaded documents to find relevant answers.
- If the AI cannot answer, it seamlessly escalates to a human agent.

### Knowledge Base Management
1. Navigate to "Data Sources" in the sidebar.
2. Click "Upload Document."
3. Select a PDF, TXT, or Markdown file.
4. The system will automatically process the document and extract embeddings.
5. Once status shows "Ready," the AI can reference it in chat.

### Analytics & Reporting
Access detailed analytics in the "Analytics" section:
- **Volume Trends**: Ticket volume over time
- **Resolution Time**: Average time to close tickets
- **AI Coverage**: Percentage of tickets with AI-assisted responses
- **CSAT Score**: Customer satisfaction ratings
- **SLA Performance**: Breach rates and at-risk tickets

## Integrations

### Email Integration
Connect your support email (e.g., support@yourcompany.com) to automatically convert incoming emails into tickets.

### Slack Integration
Get real-time notifications in Slack when:
- High-priority tickets are created
- SLA breaches are imminent
- A ticket is assigned to you

### API Access
Full REST API available for custom integrations. API keys can be generated in Settings > API. Rate limit: 1,000 requests/hour on standard plans.

## Security & Privacy

### Data Encryption
All data is encrypted at rest (AES-256) and in transit (TLS 1.3).

### Access Controls
- Role-based access control (RBAC) with Admin, Agent, and Customer roles.
- Admins can configure which data each role can access.

### Data Retention
- Ticket data: Retained for 7 years (configurable)
- Chat logs: Retained for 2 years
- AI training data: Retained until you delete the document

### GDPR Compliance
We are fully GDPR compliant. You can request data export or deletion by contacting privacy@resolveai.com.`
  },
  {
    title: 'Shipping & Delivery Information',
    filename: 'shipping-delivery.txt',
    mimeType: 'text/plain',
    category: 'Policies',
    content: `# Shipping & Delivery Information

## Domestic Shipping Options

| Service               | Delivery Time     | Cost                |
|-----------------------|-------------------|---------------------|
| Standard Shipping     | 5-7 business days | Free on orders $50+ |
| Expedited Shipping    | 2-3 business days | $12.99              |
| Overnight Shipping    | Next business day | $29.99              |
| Same-Day Delivery     | Same day (select cities) | $19.99        |

## Order Processing Time
- Orders placed before **2 PM EST Monday-Friday** ship the same day.
- Orders placed after 2 PM, or on weekends/holidays, ship the next business day.
- Custom or personalized items require 3-5 business days before shipping.

## International Shipping

We ship to 50+ countries. International shipping rates and times:

| Region              | Estimated Delivery | Starting Cost |
|---------------------|--------------------|---------------|
| Canada              | 7-10 business days | $15.99        |
| United Kingdom      | 10-14 business days | $22.99       |
| Europe              | 10-14 business days | $24.99       |
| Asia-Pacific        | 14-21 business days | $29.99       |
| Rest of World       | 21-30 business days | $34.99       |

International orders may be subject to additional import duties and taxes imposed by the destination country. These fees are the responsibility of the recipient.

## Tracking Your Order
1. Once your order ships, you'll receive a shipping confirmation email with a tracking number.
2. Click the link in the email to track your package in real time.
3. You can also track your order at any time by logging in and visiting "My Orders."

## Delivery Issues

### Package Marked as Delivered but Not Received
1. Wait 24 hours — carriers sometimes mark packages delivered early.
2. Check with household members, neighbors, and building security.
3. Look for an "attempted delivery" notice or door tag.
4. Contact the carrier directly with your tracking number.
5. If unresolved after 48 hours, contact our support team. We will investigate and file a claim.

### Damaged Package on Arrival
- Take photos immediately before opening the package.
- Document all damage with clear photos.
- Contact support within 48 hours with photos and your order number.
- We will reship or refund based on your preference.

### Address Changes
- Address changes can only be made **before the order ships**.
- Once shipped, address changes must be made directly with the carrier.
- We are not responsible for deliveries to incorrectly entered addresses.

## Signature Requirements
Orders over $200 may require a signature upon delivery. If you're unavailable, the carrier will leave a notice with redelivery instructions.`
  },
];

// ─────────────────────────────────────────────────────
// Helper: Generate Embedding
// ─────────────────────────────────────────────────────
const generateEmbedding = async (text) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

// ─────────────────────────────────────────────────────
// Helper: Chunk text
// ─────────────────────────────────────────────────────
const chunkText = (text, maxChars = 2500) => {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let current = '';
  for (const para of paragraphs) {
    if ((current.length + para.length) > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += '\n\n' + para;
    }
  }
  if (current.trim().length > 0) chunks.push(current.trim());
  return chunks;
};

// ─────────────────────────────────────────────────────
// Main Seed Function
// ─────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.\n');

  // 1. Find admin user and their org
  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  if (!admin) {
    console.error('❌ No admin user found. Please register an admin account first.');
    process.exit(1);
  }
  console.log(`👤 Found admin: ${admin.name} (${admin.email})`);
  console.log(`🏢 Org ID: ${admin.organizationId}\n`);

  const orgId = admin.organizationId;

  // 2. Create or find a Knowledge Base
  let kb = await KnowledgeBase.findOne({ organizationId: orgId, name: 'Support Knowledge Base' });
  if (!kb) {
    kb = await KnowledgeBase.create({
      organizationId: orgId,
      name: 'Support Knowledge Base',
      description: 'Company policies, FAQs, product docs, and support guides',
      createdBy: admin._id,
    });
    console.log(`📚 Created Knowledge Base: "${kb.name}" (${kb._id})`);
  } else {
    console.log(`📚 Using existing Knowledge Base: "${kb.name}" (${kb._id})`);
  }

  // 3. Process each document
  let totalChunks = 0;
  for (const docDef of DOCUMENTS) {
    console.log(`\n📄 Processing: ${docDef.title}`);

    // Check if already exists
    const existing = await Document.findOne({ organizationId: orgId, title: docDef.title });
    if (existing) {
      console.log(`   ⚠️  Already exists (status: ${existing.status}). Skipping.`);
      continue;
    }

    // Create the document record
    const doc = await Document.create({
      organizationId: orgId,
      knowledgeBaseId: kb._id,
      title: docDef.title,
      filename: docDef.filename,
      mimeType: docDef.mimeType,
      category: docDef.category,
      status: 'Processing',
      storagePath: `seeded/${docDef.filename}`,
      uploadedBy: admin._id,
    });

    // Chunk the text
    const chunks = chunkText(docDef.content);
    console.log(`   ✂️  Split into ${chunks.length} chunk(s)`);

    // Generate embeddings for each chunk
    const chunkDocs = [];
    for (let i = 0; i < chunks.length; i++) {
      process.stdout.write(`   🤖 Generating embedding ${i + 1}/${chunks.length}...`);
      const embedding = await generateEmbedding(chunks[i]);
      chunkDocs.push({
        organizationId: orgId,
        documentId: doc._id,
        knowledgeBaseId: kb._id,
        content: chunks[i],
        embedding,
        chunkIndex: i,
      });
      console.log(' ✅');
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    await DocumentChunk.insertMany(chunkDocs);
    totalChunks += chunkDocs.length;

    // Mark document as Ready
    doc.status = 'Ready';
    await doc.save();
    console.log(`   🟢 "${docDef.title}" is now Ready.`);
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`✅ Seeding complete!`);
  console.log(`   📄 Documents processed: ${DOCUMENTS.length}`);
  console.log(`   🔢 Total chunks created: ${totalChunks}`);
  console.log(`   🧠 AI can now answer questions using these data sources!`);
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seeding failed:', err.message);
  process.exit(1);
});

/**
 * seed-kb-articles.js
 * Run: node seed-kb-articles.js
 *
 * Seeds rich Knowledge Base articles for all support categories.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User    = require('./src/models/User');
const Article = require('./src/models/Article');

const ARTICLES = [
  // ─── Returns & Exchanges ───────────────────────────────────────
  {
    title: 'How to Return an Item',
    category: 'Returns & Exchanges',
    content: `## How to Return an Item

We want you to love what you ordered. If something isn't right, returning an item is quick and easy.

### Eligibility
- Items must be returned within **30 days** of delivery.
- Items must be unused, unwashed, and in original packaging with all tags attached.
- Final Sale items, digital products, and gift cards cannot be returned.

### Step-by-Step Return Process

1. **Log in** to your account and go to **My Orders**.
2. Select the order containing the item you wish to return.
3. Click **"Return Item"** and choose a reason from the dropdown.
4. A **pre-paid return shipping label** will be emailed to you instantly.
5. Pack the item securely in its original box if possible.
6. Attach the label and **drop it off** at any authorized carrier location.
7. You'll receive an email confirmation once we receive and inspect the item.

### What Happens Next?
- Inspection takes **3–5 business days** after we receive the package.
- Approved refunds are issued within **5–10 business days** to your original payment method.

### Tips for a Smooth Return
- Keep the original packaging until you're sure you want to keep the item.
- Take a photo of the packaged return before dropping it off — just in case!
- If you're returning multiple items from different orders, use separate packages and labels.`,
  },
  {
    title: 'How to Exchange an Item for a Different Size or Color',
    category: 'Returns & Exchanges',
    content: `## How to Exchange an Item

Need a different size or color? We offer free exchanges within 30 days of delivery — no hassle.

### What Can Be Exchanged?
- Any eligible item (not Final Sale) within 30 days.
- Exchange for the same item in a different size, color, or variant.
- One free exchange per order. Additional exchanges incur a $5 processing fee.

### How to Start an Exchange

1. Go to **My Orders** and select the relevant order.
2. Click **"Exchange Item"** next to the product.
3. Choose the new size or color you'd like.
4. Print the pre-paid exchange label and ship the original item back.
5. Your replacement ships within **2–3 business days** of us receiving the return.

### Exchange FAQs

**What if my requested exchange item is out of stock?**
We'll notify you by email and offer either:
- A full store credit, or
- A complete refund — your choice.

**Can I exchange for a completely different product?**
Cross-product exchanges aren't currently supported. You'll need to return the original item for a refund and place a new order.

**Will I be charged for shipping?**
Exchanges within the US are fully free (both ways). International customers cover outbound shipping costs.`,
  },
  {
    title: 'I Received a Damaged or Wrong Item — What Do I Do?',
    category: 'Returns & Exchanges',
    content: `## Received a Damaged or Wrong Item?

We're sorry about this! We'll make it right immediately.

### If Your Item Arrived Damaged

1. **Take photos** of the damage before opening fully — include the outer packaging.
2. Report the damage **within 48 hours** of delivery by opening a support ticket.
3. Include your **order number** and attach the photos.
4. We'll ship a replacement at no cost or issue a full refund — your choice.

> **Important:** Damage claims reported after 48 hours may not be eligible for a free replacement. Please inspect your items promptly upon arrival.

### If You Received the Wrong Item

1. Photograph the item you received (showing the product and any labels).
2. Open a support ticket with your order number and photo.
3. We'll arrange a **free return** and ship the correct item immediately.
4. You won't need to wait for us to receive the wrong item before we ship the replacement.

### Common Causes of Wrong Items
- Multiple items in an order got separated at the warehouse.
- A size/variant was substituted due to stock issues (we'll always notify you in this case).

If you were not notified about a substitution and received the wrong item, you are entitled to a full refund or replacement at no extra cost.`,
  },

  // ─── Refunds ───────────────────────────────────────────────────
  {
    title: 'How Long Does a Refund Take?',
    category: 'Refunds',
    content: `## Refund Timeline Guide

Once your return is received and approved, here's when to expect your refund:

| Payment Method         | Expected Time After Approval |
|------------------------|------------------------------|
| Credit / Debit Card    | 5–10 business days           |
| PayPal                 | 3–5 business days            |
| Bank Transfer / ACH    | 7–14 business days           |
| Store Credit           | Immediate                    |
| Gift Card              | Credited back to your card   |

### Why Does It Take This Long?
Refunds involve two steps:
1. **Our system** processes and approves the refund (usually within 3–5 business days of receiving your return).
2. **Your bank** then applies the credit to your account. This step is controlled by your bank and varies.

### My Refund Is Overdue — What Should I Do?
1. Confirm you received our approval email confirming the refund was issued.
2. Check all your cards/accounts — refunds go to the original payment method only.
3. Contact your bank and quote the refund reference number from our email.
4. If the bank confirms no pending refund after 15 business days, open a support ticket and we'll investigate.

### Partial Refunds
A partial refund may apply if:
- The item was returned after 30 days (up to 50% restocked value).
- The item shows signs of use or is missing original packaging.`,
  },
  {
    title: 'Can I Get a Refund on a Cancelled Subscription?',
    category: 'Refunds',
    content: `## Subscription Cancellation & Refund Policy

### Monthly Subscriptions
- Cancelling a monthly subscription **stops future charges** immediately.
- The current billing period is **not refunded** — you retain access until it ends.
- No partial month refunds are issued.

### Annual Subscriptions
- Annual subscriptions cancelled **within the first 30 days** are eligible for a full prorated refund.
- After 30 days, no refund is issued, but service continues until the year ends.

### How to Cancel
1. Go to **Account → Subscriptions**.
2. Click **"Manage"** next to your plan.
3. Select **"Cancel Subscription"** and confirm.
4. You'll receive a cancellation confirmation email.

### Free Trial Cancellations
If you cancel during a free trial, you will not be charged. No action is required beyond cancelling before the trial ends.

### What Happens to My Data After Cancellation?
Your data is retained for **90 days** after cancellation. You can reactivate your account any time during this window and everything will be exactly as you left it. After 90 days, data is permanently deleted.`,
  },

  // ─── Payments ──────────────────────────────────────────────────
  {
    title: 'What Payment Methods Do You Accept?',
    category: 'Payments',
    content: `## Accepted Payment Methods

We accept a wide range of payment methods to make checkout easy for everyone.

### Cards
- Visa, MasterCard, American Express, Discover
- Visa Debit, MasterCard Debit

### Digital Wallets
- **PayPal** — Pay with your PayPal balance or linked card.
- **Apple Pay** — Available on Safari and iOS devices.
- **Google Pay** — Available on Chrome and Android devices.
- **Shop Pay** — Save your details for faster future checkouts.

### Buy Now, Pay Later
- **Klarna** — Split into 4 interest-free payments.
- **Afterpay** — Available for orders $35–$2,000 (select regions).

### Other Methods
- **Gift Cards** — Redeemable at checkout. Can be combined with one other payment method.
- **Store Credit** — Applied automatically at checkout if you have a balance.
- **Bank Transfer / ACH** — Available for orders over $500. Contact us to arrange.

### Is My Payment Secure?
Yes. All transactions use **SSL encryption** and are PCI-DSS compliant. We use Stripe for payment processing and never store your full card number on our servers.`,
  },
  {
    title: 'My Payment Was Declined — How Do I Fix It?',
    category: 'Payments',
    content: `## Payment Declined? Here's How to Fix It

A declined payment is frustrating, but it's usually easy to resolve. Here are the most common causes and fixes.

### Common Reasons for Declined Payments

| Reason | What To Do |
|--------|------------|
| Incorrect card details | Re-enter your card number, expiry, and CVV carefully |
| Insufficient funds | Check your account balance or try a different card |
| Billing address mismatch | Ensure your address matches what's on file with your bank exactly |
| Bank fraud prevention | Call your bank to authorize the transaction and try again |
| Expired card | Update your card details in Account → Payment Methods |
| International block | Ask your bank to allow international online transactions |
| VPN / Proxy interference | Disable your VPN and try again |

### Step-by-Step Fix
1. Double-check all card details — even one wrong digit will cause a decline.
2. Make sure your billing address (including ZIP/postal code) matches your bank's records exactly.
3. Try a different browser or disable ad-blockers/extensions.
4. If still failing, try a different card or payment method (e.g., PayPal).
5. Contact your bank — they can often immediately authorize the transaction.

### Still Having Trouble?
Open a support ticket with your order number and we'll look into it. Never share your full card number in a support chat or ticket.`,
  },

  // ─── Troubleshooting ───────────────────────────────────────────
  {
    title: 'I Cannot Log In to My Account',
    category: 'Troubleshooting',
    content: `## Can't Log In? Here's How to Regain Access

### Quick Checklist
- [ ] Are you using the correct email address?
- [ ] Is CAPS LOCK turned off?
- [ ] Have you tried copying/pasting your password to avoid typos?
- [ ] Have you tried a different browser (Chrome, Firefox, Safari)?

### Step 1 — Reset Your Password
This fixes 90% of login issues:
1. Click **"Forgot Password"** on the login page.
2. Enter your email address and click **"Send Reset Link."**
3. Check your inbox **and your spam/junk folder**.
4. The link expires after **1 hour** — request a new one if needed.
5. Create a new password (minimum 8 characters, at least one number).

### Step 2 — Clear Browser Cache
Old cached data can cause login failures:
1. Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac).
2. Select "Cached images and files" and "Cookies."
3. Clear data and try logging in again.

### Step 3 — Try Incognito / Private Mode
Open an incognito window and try logging in. If this works, the issue is a browser extension (often a password manager or ad-blocker).

### Account Locked?
After 5 failed attempts, accounts are locked for **15 minutes**. Either wait, or use "Forgot Password" to unlock immediately.

### SSO (Google/Apple Sign-In) Issues
Make sure your Google or Apple account is active and not suspended. If you linked a different email to SSO than your account email, you may need to log in with password instead.`,
  },
  {
    title: 'The Website or App Is Not Loading',
    category: 'Troubleshooting',
    content: `## Website or App Not Loading?

Follow these steps to diagnose and fix loading issues.

### Basic Fixes (Try These First)
1. **Hard refresh** the page: Press **Ctrl+F5** (Windows) or **Cmd+Shift+R** (Mac).
2. **Check your internet connection** — try opening another website.
3. **Try a different browser** — Chrome, Firefox, Safari, or Edge.
4. **Try incognito mode** — rules out browser extension conflicts.

### Clear Your Browser Cache
Outdated cached files often cause pages to load incorrectly:
1. Chrome: **Settings → Privacy and Security → Clear Browsing Data**
2. Safari: **Develop → Empty Caches** (enable Develop menu in Preferences → Advanced)
3. Firefox: **Settings → Privacy & Security → Clear Data**

### Check System Status
If our servers are experiencing an outage, it's not your device's fault:
- Visit our **Status Page** at status.resolveai.com.
- Follow us on Twitter/X **@ResolveAIStatus** for real-time updates.

### Checkout Not Working?
- Disable any **ad-blockers** or **VPN** — these can block payment scripts.
- Make sure **JavaScript is enabled** in your browser settings.
- Check that your browser allows **third-party cookies** (required for some payment providers).

### Still Broken?
Open a support ticket and include:
- Your browser name and version (e.g., Chrome 125)
- Your operating system (e.g., Windows 11, macOS 14)
- A screenshot or description of the error
- The exact URL where the issue occurs`,
  },

  // ─── Shipping ──────────────────────────────────────────────────
  {
    title: 'How Long Does Shipping Take?',
    category: 'Shipping',
    content: `## Shipping Times & Options

### Domestic Shipping (United States)

| Service           | Delivery Time         | Cost                 |
|-------------------|-----------------------|----------------------|
| Standard Shipping | 5–7 business days     | Free on orders $50+  |
| Expedited         | 2–3 business days     | $12.99               |
| Overnight         | Next business day     | $29.99               |
| Same-Day          | Same day (select cities) | $19.99            |

### Order Processing Time
- Orders placed before **2 PM EST** on weekdays ship the **same day**.
- Orders after 2 PM or on weekends ship the **next business day**.
- Custom/personalized items: allow **3–5 extra business days** for production.

### International Shipping

| Region         | Estimated Delivery      | Starting Cost |
|----------------|-------------------------|---------------|
| Canada         | 7–10 business days      | $15.99        |
| UK             | 10–14 business days     | $22.99        |
| Europe         | 10–14 business days     | $24.99        |
| Asia-Pacific   | 14–21 business days     | $29.99        |
| Rest of World  | 21–30 business days     | $34.99        |

> International orders may be subject to customs duties and import taxes, which are the recipient's responsibility.

### How to Track Your Order
Once shipped, you'll receive a tracking number by email. You can also view tracking in **My Orders → Order Details** at any time.`,
  },
  {
    title: 'My Package Was Marked Delivered But I Did Not Receive It',
    category: 'Shipping',
    content: `## Package Marked Delivered But Not Received?

Carriers sometimes mark packages as delivered before they physically arrive, or leave them in unexpected locations. Here's what to do.

### Immediate Steps
1. **Wait 24 hours.** Carriers occasionally mark packages delivered early. Most arrive by end of the next business day.
2. **Check around your property** — by your door, garage, side entrance, or mailbox.
3. **Ask neighbors** — the package may have been left with them by mistake.
4. **Check with your building** — security desk, mailroom, or parcel lockers.
5. **Look for a carrier notice** — a door tag or email with redelivery instructions.

### Contact the Carrier
If the package still hasn't appeared after 24 hours:
- **USPS**: Call 1-800-275-8777 or file a missing mail search at usps.com.
- **UPS**: Call 1-800-742-5877 or start a claim at ups.com.
- **FedEx**: Call 1-800-463-3339 or file a claim at fedex.com.
- Have your tracking number ready.

### Contact Us
If the carrier cannot locate your package and it's been more than **48 hours** past the delivery date:
1. Open a support ticket.
2. Include your **order number** and **tracking number**.
3. We'll file a carrier claim on your behalf.
4. We'll reship your order or issue a full refund — your choice.

> **Note:** For orders over $200, we may need to wait for the carrier investigation to complete (typically 5–7 business days) before reshipping.`,
  },

  // ─── Product / General ─────────────────────────────────────────
  {
    title: 'How to Use the Customer Support Chat',
    category: 'Product',
    content: `## Using the AI Customer Support Chat

Our AI-powered chat is available 24/7 to answer your questions instantly.

### How It Works
1. Click the **chat icon** on any page of our website or app.
2. Type your question in plain English — no special commands needed.
3. The AI searches our knowledge base and support documents to find the best answer.
4. If the AI can't help, it will escalate to a human agent during business hours.

### What the AI Can Help With
- ✅ Order status and tracking
- ✅ Return and exchange policies
- ✅ Refund timelines
- ✅ Payment questions
- ✅ Troubleshooting account and login issues
- ✅ Shipping information

### Tips for Better Answers
- Be specific: *"My order #12345 hasn't arrived"* works better than *"where's my stuff?"*
- Include your order number when asking about a specific order.
- If the first answer doesn't help, rephrase your question.

### Requesting a Refund Through Chat
If you need a refund or cancellation:
1. Tell the AI: *"I'd like a refund for my order."*
2. The AI will initiate a refund request and ask for your approval.
3. A human agent will review and process it within 1 business day.

### Human Support Hours
Our human agents are available:
- **Monday–Friday**: 9 AM – 8 PM EST
- **Saturday**: 10 AM – 6 PM EST
- **Sunday**: Closed (AI chat still available)`,
  },
  {
    title: 'Account Settings & Profile Management',
    category: 'Product',
    content: `## Managing Your Account Settings

### Updating Your Profile
1. Click your **avatar** or name in the top right corner.
2. Select **"Account Settings."**
3. Update your name, email, phone number, or profile photo.
4. Click **"Save Changes."**

> If you change your email address, a verification link will be sent to the new email. Your login email won't change until you verify.

### Changing Your Password
1. Go to **Account Settings → Security**.
2. Click **"Change Password."**
3. Enter your current password, then your new password twice.
4. Minimum requirements: 8 characters, 1 uppercase, 1 number.

### Managing Notifications
Control what emails and notifications you receive:
1. Go to **Account Settings → Notifications**.
2. Toggle on/off:
   - Order confirmation emails
   - Shipping & delivery updates
   - Promotional offers
   - Support ticket replies

### Managing Saved Addresses
1. Go to **Account Settings → Addresses**.
2. Add, edit, or delete shipping addresses.
3. Set a default address for faster checkout.

### Managing Payment Methods
1. Go to **Account Settings → Payment Methods**.
2. Add new cards, remove old ones, or set a default payment method.
3. Card details are stored securely by our payment processor (Stripe) — we never see your full card number.

### Deleting Your Account
To permanently delete your account:
1. Go to **Account Settings → Privacy**.
2. Click **"Delete Account."**
3. Confirm via the email we send you.

> **Note:** Account deletion is permanent and cannot be undone. All orders, history, and data will be erased after a 14-day grace period.`,
  },
];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.\n');

  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  if (!admin) {
    console.error('❌ No admin user found. Please create an admin account first.');
    process.exit(1);
  }

  const orgId = admin.organizationId;
  console.log(`👤 Admin: ${admin.name} | Org: ${orgId}\n`);

  let created = 0;
  let skipped = 0;

  for (const art of ARTICLES) {
    const exists = await Article.findOne({ organizationId: orgId, title: art.title });
    if (exists) {
      console.log(`⚠️  Skipping (already exists): ${art.title}`);
      skipped++;
      continue;
    }

    await Article.create({
      ...art,
      organizationId: orgId,
      authorId: admin._id,
      views: Math.floor(Math.random() * 300) + 10, // realistic view counts
    });

    console.log(`✅ Created [${art.category}]: ${art.title}`);
    created++;
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`✅ Done! ${created} articles created, ${skipped} skipped.`);
  console.log(`─────────────────────────────────────────\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});

import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Allow domain to be passed as command line argument, or use default
// Default: revops.it.com (main domain - recommended)
// Alternative: notifications.revops.it.com (subdomain - already added)
const DOMAIN = process.argv[2] || process.env.RESEND_DOMAIN || 'revops.it.com';
const API_KEY = process.env.RESEND_API_KEY;

if (!API_KEY) {
  console.error('❌ RESEND_API_KEY not found in .env file');
  process.exit(1);
}

const resend = new Resend(API_KEY);

async function setupDomain() {
  try {
    console.log(`🚀 Setting up domain: ${DOMAIN}\n`);

    // Check if domain already exists
    console.log('📋 Checking existing domains...');
    const { data: existingDomains } = await resend.domains.list();
    const existingDomain = existingDomains?.data?.find(d => d.name === DOMAIN);

    if (existingDomain) {
      console.log(`✅ Domain already exists with status: ${existingDomain.status}\n`);
      
      // Get domain details with DNS records
      const { data: domainDetails } = await resend.domains.get(existingDomain.id);
      
      if (domainDetails) {
        displayDNSRecords(domainDetails);
      }
      
      return;
    }

    // Create new domain
    console.log('🔧 Creating new domain...');
    const { data: domain, error } = await resend.domains.create({
      name: DOMAIN,
      region: 'eu-west-1', // Ireland - closest to Europe users
    });

    if (error) {
      console.error('❌ Error creating domain:', error);
      process.exit(1);
    }

    console.log(`✅ Domain created successfully!\n`);
    
    if (domain) {
      displayDNSRecords(domain);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function displayDNSRecords(domain: any) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 DNS RECORDS TO ADD IN CLOUDFLARE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (domain.records && domain.records.length > 0) {
    domain.records.forEach((record: any, index: number) => {
      console.log(`Record #${index + 1}:`);
      console.log(`  Type:     ${record.type}`);
      console.log(`  Name:     ${record.name || '@'}`);
      console.log(`  Value:    ${record.value}`);
      console.log(`  Priority: ${record.priority || 'N/A'}`);
      console.log('');
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 INSTRUCTIONS FOR CLOUDFLARE:');
  console.log('');
  console.log('1. Go to: https://dash.cloudflare.com/');
  console.log('2. Select your domain: revops.it.com');
  console.log('3. Go to DNS > Records');
  console.log('4. Click "Add record" for each DNS record above');
  console.log('5. Important settings:');
  console.log('   - Proxy status: DNS only (gray cloud icon)');
  console.log('   - TTL: Auto');
  console.log('');
  console.log('⚠️  IMPORTANT:');
  console.log('   - TXT records: Copy the entire value exactly as shown');
  console.log('   - MX records: Make sure to set the priority');
  console.log('   - Turn OFF the orange cloud (proxy) for email records!');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('⏳ After adding DNS records:');
  console.log('   - DNS propagation can take 5-60 minutes');
  console.log('   - Run: npm run resend:verify');
  console.log('   - Or check status at: https://resend.com/domains\n');
}

setupDomain();

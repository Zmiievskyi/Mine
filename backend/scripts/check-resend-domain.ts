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

async function checkDomainStatus() {
  try {
    console.log(`🔍 Checking domain status: ${DOMAIN}\n`);

    // List all domains
    const { data: domains, error: listError } = await resend.domains.list();

    if (listError) {
      console.error('❌ Error listing domains:', listError);
      process.exit(1);
    }

    // Show all available domains for debugging
    if (domains?.data && domains.data.length > 0) {
      console.log('📋 Available domains in Resend:');
      domains.data.forEach((d: any) => {
        console.log(`   - ${d.name} (status: ${d.status}, region: ${d.region || 'N/A'})`);
      });
      console.log('');
    } else {
      console.log('📋 No domains found in Resend account\n');
    }

    const domain = domains?.data?.find(d => d.name === DOMAIN);

    if (!domain) {
      console.error(`❌ Domain ${DOMAIN} not found in Resend`);
      console.log('\n💡 Options:');
      console.log('   1. Run: npm run resend:setup to create the domain');
      console.log('   2. Check if domain was added with a different name (see list above)');
      console.log('   3. If domain exists but with different name, update DOMAIN constant in script');
      process.exit(1);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DOMAIN STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Domain:     ${domain.name}`);
    console.log(`Status:     ${domain.status}`);
    console.log(`Region:     ${domain.region || 'N/A'}`);
    console.log(`Created:    ${domain.created_at ? new Date(domain.created_at).toLocaleString() : 'N/A'}\n`);

    // Get detailed domain info with DNS records
    const { data: domainDetails, error: getError } = await resend.domains.get(domain.id);

    if (getError) {
      console.error('❌ Error getting domain details:', getError);
      process.exit(1);
    }

    if (domainDetails && domainDetails.records) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 DNS RECORDS STATUS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const recordsByType: Record<string, any[]> = {
        TXT: [],
        MX: [],
      };

      // Group all records by type
      domainDetails.records.forEach((record: any) => {
        if (record.type === 'TXT' || record.type === 'MX') {
          recordsByType[record.type].push(record);
        }
      });

      // Display TXT records
      if (recordsByType.TXT.length > 0) {
        console.log('📧 TXT Records (DKIM, SPF, DMARC):');
        recordsByType.TXT.forEach((record, index) => {
          const status = record.status || 'unknown';
          const statusIcon = status === 'verified' ? '✅' : status === 'pending' ? '⏳' : '❌';
          console.log(`\n${statusIcon} Record #${index + 1}:`);
          console.log(`   Type:     ${record.type}`);
          console.log(`   Name:     ${record.name || '@'}`);
          console.log(`   Value:    ${record.value.substring(0, 60)}${record.value.length > 60 ? '...' : ''}`);
          console.log(`   Status:   ${status}`);
        });
        console.log('');
      }

      // Display MX records
      if (recordsByType.MX.length > 0) {
        console.log('📬 MX Records:');
        recordsByType.MX.forEach((record, index) => {
          const status = record.status || 'unknown';
          const statusIcon = status === 'verified' ? '✅' : status === 'pending' ? '⏳' : '❌';
          console.log(`\n${statusIcon} Record #${index + 1}:`);
          console.log(`   Type:     ${record.type}`);
          console.log(`   Name:     ${record.name || '@'}`);
          console.log(`   Value:    ${record.value}`);
          console.log(`   Priority: ${record.priority || 'N/A'}`);
          console.log(`   Status:   ${status}`);
        });
        console.log('');
      }

      // Check overall status
      const allVerified = domainDetails.records.every((r: any) => r.status === 'verified');
      const somePending = domainDetails.records.some((r: any) => r.status === 'pending');

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      if (allVerified) {
        console.log('✅ All DNS records are verified! Domain is ready to use.');
      } else if (somePending) {
        console.log('⏳ Some DNS records are still pending verification.');
        console.log('   Please wait a few minutes for DNS propagation.');
        console.log('   Run this script again to check status.');
      } else {
        console.log('❌ Some DNS records are not verified.');
        console.log('   Please check your Cloudflare DNS settings.');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Display full DNS records for manual setup
      console.log('\n📋 FULL DNS RECORDS (for manual setup in Cloudflare):\n');
      domainDetails.records.forEach((record: any, index: number) => {
        console.log(`Record #${index + 1}:`);
        console.log(`  Type:     ${record.type}`);
        console.log(`  Name:     ${record.name || '@'}`);
        console.log(`  Value:    ${record.value}`);
        console.log(`  Priority: ${record.priority || 'N/A'}`);
        console.log(`  TTL:      Auto`);
        console.log(`  Proxy:    DNS only (gray cloud)`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDomainStatus();

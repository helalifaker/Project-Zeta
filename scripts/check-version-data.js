const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const envVars = envFile.split('\n').filter(line => line && !line.startsWith('#'));
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
}

async function checkVersion() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Fetching version "test"...\n');
    
    const version = await prisma.version.findFirst({
      where: { name: 'test' },
      include: {
        curriculumPlans: true,
        rentPlan: true,
      },
    });
    
    if (!version) {
      console.log('❌ Version "test" not found!');
      return;
    }
    
    console.log('✅ Version found:', version.name);
    console.log('\n📊 Curriculum Plans:', version.curriculumPlans.length);
    version.curriculumPlans.forEach((cp) => {
      console.log(`  - ${cp.curriculumType}: capacity=${cp.capacity}, tuition=${cp.tuitionBase}`);
      console.log(`    studentsProjection type: ${typeof cp.studentsProjection}`);
      console.log(`    studentsProjection isArray: ${Array.isArray(cp.studentsProjection)}`);
      if (Array.isArray(cp.studentsProjection)) {
        console.log(`    studentsProjection length: ${cp.studentsProjection.length}`);
        console.log(`    First entry:`, cp.studentsProjection[0]);
      } else {
        console.log(`    studentsProjection value:`, cp.studentsProjection);
      }
    });
    
    console.log('\n🏢 Rent Plan:', version.rentPlan ? 'EXISTS' : 'MISSING');
    if (version.rentPlan) {
      console.log(`  - Model: ${version.rentPlan.rentModel}`);
      console.log(`  - Parameters type: ${typeof version.rentPlan.parameters}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkVersion();

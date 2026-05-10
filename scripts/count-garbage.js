const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const IGNORED_KEYS = [
    'category', 'product status', 'product  status', 'lifecycle status', 
    'rohs status', 'eu rohs status', 'reach status', 'us eccn', 
    'china rohs status', 'hts us', 'msl rating', 
    'moisture sensitivity level (msl)', 'manufacturer'
];

const IGNORED_VALUES = [
    '-', '', 'vendor is not defined', 'provided as per user requirements', 'null', 'n/a'
];

async function main() {
    console.log('Starting garbage detection...');
    let garbageIds = [];
    let totalChecked = 0;
    
    // Process in batches of 50000 to avoid memory issues
    const batchSize = 50000;
    let skip = 0;
    let hasMore = true;
    
    while (hasMore) {
        const products = await prisma.product.findMany({
            skip,
            take: batchSize,
            select: { id: true, partNumber: true, specs: true }
        });
        
        if (products.length === 0) {
            hasMore = false;
            break;
        }
        
        for (const p of products) {
            totalChecked++;
            if (!p.specs) {
                garbageIds.push(p.id);
                continue;
            }
            
            try {
                const specsObj = JSON.parse(p.specs);
                let meaningfulParams = 0;
                
                for (const [k, v] of Object.entries(specsObj)) {
                    const keyLower = k.toLowerCase().trim();
                    if (IGNORED_KEYS.includes(keyLower)) {
                        continue;
                    }
                    
                    if (v === null || v === undefined) continue;
                    
                    const valLower = String(v).toLowerCase().trim();
                    if (IGNORED_VALUES.includes(valLower)) {
                        continue;
                    }
                    
                    meaningfulParams++;
                }
                
                if (meaningfulParams === 0) {
                    garbageIds.push(p.id);
                    // Just print the first 5 for debugging
                    if (garbageIds.length <= 5) {
                        console.log(`Example garbage: ${p.partNumber} ->`, p.specs);
                    }
                }
            } catch (e) {
                // If it can't be parsed, it's garbage
                garbageIds.push(p.id);
            }
        }
        
        skip += batchSize;
        console.log(`Checked ${totalChecked} products... Found ${garbageIds.length} garbage so far.`);
    }
    
    console.log(`\nFinished checking all products.`);
    console.log(`Total garbage products found: ${garbageIds.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

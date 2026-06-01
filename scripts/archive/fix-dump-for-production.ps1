# Fix fpgacenter_dump.sql for production schema compatibility
# The dump was exported from a DB with extra columns not in the Prisma schema:
#   Category: description, productCount, createdAt, updatedAt
#   Manufacturer: createdAt, updatedAt
# This script creates a cleaned version that matches the production schema.

Write-Host "🔧 Fixing fpgacenter_dump.sql for production schema..." -ForegroundColor Cyan

$inputFile = "d:\脚本案例\electronic-components-site\fpgacenter_dump.sql"
$outputFile = "d:\脚本案例\electronic-components-site\fpgacenter_dump_fixed.sql"

# Use StreamReader/StreamWriter for 550MB file
$reader = [System.IO.StreamReader]::new($inputFile)
$writer = [System.IO.StreamWriter]::new($outputFile, $false, [System.Text.Encoding]::UTF8, 1MB)

$lineNum = 0
$fixedCat = 0
$fixedMfr = 0
$productLines = 0

while ($null -ne ($line = $reader.ReadLine())) {
    $lineNum++
    
    if ($line -match '^INSERT INTO "Category"') {
        # Rewrite Category INSERT to only include columns that exist in Prisma schema:
        # id, name, slug, parentId, icon, seoTitle, seoDesc, sortOrder
        # Original has: id, name, slug, parentId, description, seoTitle, seoDesc, productCount, createdAt, updatedAt
        # We need to extract values and rebuild
        
        if ($line -match 'VALUES \((\d+),\s*''([^'']*)'',\s*''([^'']*)'',\s*(NULL|\d+),\s*(NULL|''[^'']*''),\s*(NULL|''[^'']*''),\s*(NULL|''[^'']*''),\s*(\d+),') {
            $id = $matches[1]
            $name = $matches[2]
            $slug = $matches[3]
            $parentId = $matches[4]
            $seoTitle = $matches[6]
            $seoDesc = $matches[7]
            $sortOrder = 0
            
            $conflictClause = "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, `"parentId`"=EXCLUDED.`"parentId`", `"seoTitle`"=EXCLUDED.`"seoTitle`", `"seoDesc`"=EXCLUDED.`"seoDesc`""
            
            $newLine = "INSERT INTO `"Category`" (id, name, slug, `"parentId`", `"seoTitle`", `"seoDesc`", `"sortOrder`") VALUES ($id, '$name', '$slug', $parentId, $seoTitle, $seoDesc, $sortOrder) $conflictClause;"
            $writer.WriteLine($newLine)
            $fixedCat++
        } else {
            # If regex didn't match, write original (will probably fail, but better than losing data)
            $writer.WriteLine($line)
        }
    }
    elseif ($line -match '^INSERT INTO "Manufacturer"') {
        # Rewrite Manufacturer INSERT to remove createdAt, updatedAt
        # Original: id, name, slug, website, createdAt, updatedAt
        # Schema has: id, name, slug, logo, website, country
        
        if ($line -match 'VALUES \((\d+),\s*(''(?:[^'']*(?:'''')*)*''),\s*''([^'']*)'',\s*(NULL|''[^'']*''),') {
            $id = $matches[1]
            $nameVal = $matches[2]
            $slug = $matches[3]
            $website = $matches[4]
            
            $conflictClause = "ON CONFLICT (id) DO NOTHING"
            
            $newLine = "INSERT INTO `"Manufacturer`" (id, name, slug, website) VALUES ($id, $nameVal, '$slug', $website) $conflictClause;"
            $writer.WriteLine($newLine)
            $fixedMfr++
        } else {
            $writer.WriteLine($line)
        }
    }
    elseif ($line -match '^INSERT INTO "Product"') {
        # Product schema matches, write as-is
        $writer.WriteLine($line)
        $productLines++
    }
    else {
        # Comments, DELETE, etc - write as-is
        $writer.WriteLine($line)
    }
    
    if ($lineNum % 50000 -eq 0) {
        Write-Host "  Processed $lineNum lines..." -ForegroundColor Gray
    }
}

$reader.Close()
$writer.Close()

Write-Host ""
Write-Host "✅ Done! Fixed dump saved to: fpgacenter_dump_fixed.sql" -ForegroundColor Green
Write-Host "   Categories fixed: $fixedCat" -ForegroundColor Yellow
Write-Host "   Manufacturers fixed: $fixedMfr" -ForegroundColor Yellow
Write-Host "   Products (unchanged): $productLines" -ForegroundColor Yellow
Write-Host "   Total lines: $lineNum" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Upload fpgacenter_dump_fixed.sql to your VPS" -ForegroundColor White
Write-Host "   2. On VPS, run: psql `$DATABASE_URL < fpgacenter_dump_fixed.sql" -ForegroundColor White

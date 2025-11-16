#!/usr/bin/env node

/**
 * MDX Build Script for Jekyll
 * 
 * This script processes .mdx files and converts them to markdown files
 * that Jekyll can process. It maintains front matter and performs basic
 * JSX-to-HTML attribute transformations.
 * 
 * Design Decision:
 * Rather than using a full MDX compiler and JSX runtime, this script
 * performs simple text transformations and outputs markdown files.
 * This allows Jekyll's native markdown processor to handle the content
 * while supporting basic HTML/JSX within markdown files.
 * 
 * Limitations:
 * - No support for complex JSX expressions or dynamic content
 * - No custom React component rendering
 * - Best suited for static HTML elements with Tailwind CSS classes
 * 
 * Usage: node scripts/build-mdx.js
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const matter = require('gray-matter');

// Configuration
const MDX_SOURCES = [
  'pages/**/*.mdx',
  '_posts/**/*.mdx',
  '*.mdx'
];

const OUTPUT_DIR = '_mdx-generated';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Process a single MDX file
 * 
 * Strategy: Convert MDX to markdown that Jekyll can process
 * - Parse front matter
 * - Convert className to class for HTML compatibility
 * - Keep markdown syntax for Jekyll to process
 * - Wrap in a div for styling
 */
async function processMDXFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    
    // Read the MDX file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse front matter
    const { data: frontMatter, content: mdxContent } = matter(content);
    
    // Convert JSX attributes to HTML attributes for Jekyll compatibility
    // Note: This is a simple transformation for basic MDX usage
    // Complex JSX expressions are not supported in this implementation
    let processedContent = mdxContent
      .replace(/className=/g, 'class=')
      .replace(/htmlFor=/g, 'for=')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ''); // Remove JSX comments
    
    // Determine output path (keep as .md for Jekyll to process)
    const relativePath = path.relative(process.cwd(), filePath);
    const outputPath = path.join(
      OUTPUT_DIR,
      relativePath.replace('.mdx', '.md')
    );
    
    // Ensure output directory exists
    const outputDirPath = path.dirname(outputPath);
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }
    
    // Reconstruct front matter
    let output = '---\n';
    output += Object.entries({ ...frontMatter, layout: frontMatter.layout || 'default' })
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: "${value}"`;
        } else if (Array.isArray(value)) {
          return `${key}:\n  - ${value.join('\n  - ')}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join('\n');
    output += '\n---\n\n';
    
    // Add processed content with wrapper div
    output += `<!-- Generated from ${relativePath} -->\n`;
    output += `<div class="mdx-content tw-mdx-content" markdown="1">\n\n`;
    output += processedContent;
    output += '\n\n</div>\n';
    
    // Write output file
    fs.writeFileSync(outputPath, output);
    console.log(`✓ Generated: ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main build process
 */
async function buildMDX() {
  console.log('🚀 Building MDX files...\n');
  
  // Find all MDX files
  const mdxFiles = await glob(MDX_SOURCES, {
    ignore: ['node_modules/**', '_site/**', OUTPUT_DIR + '/**']
  });
  
  if (mdxFiles.length === 0) {
    console.log('ℹ No MDX files found.');
    return;
  }
  
  console.log(`Found ${mdxFiles.length} MDX file(s)\n`);
  
  // Process each file
  const results = await Promise.all(
    mdxFiles.map(file => processMDXFile(file))
  );
  
  const successful = results.filter(r => r).length;
  const failed = results.length - successful;
  
  console.log('\n✅ MDX build complete!');
  console.log(`   Processed: ${successful} file(s)`);
  if (failed > 0) {
    console.log(`   Failed: ${failed} file(s)`);
    process.exit(1);
  }
}

// Run the build
buildMDX().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});

#!/usr/bin/env python3
"""
Preview URL Validator - Validates all preview image URLs in Jekyll content frontmatter.

This script checks:
1. URL format validity (must start with /, be absolute path)
2. File extension validity (.png, .jpg, .jpeg, .gif, .webp, .svg)
3. File existence (actual image file exists on disk)
4. Detects empty, null, or malformed preview values

Usage:
    python3 validate_preview_urls.py
    python3 validate_preview_urls.py --verbose
    python3 validate_preview_urls.py --fix-suggestions

Exit codes:
    0 - All previews valid
    1 - Validation errors found
"""

import argparse
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import yaml

# Terminal colors
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    PURPLE = '\033[0;35m'
    BOLD = '\033[1m'
    NC = '\033[0m'  # No Color


@dataclass
class ValidationError:
    """Represents a validation error for a preview URL."""
    file_path: str
    preview_value: str
    error_type: str
    message: str
    suggestion: Optional[str] = None


@dataclass
class ValidationResult:
    """Result of validating a single file."""
    file_path: str
    title: str
    preview_value: Optional[str]
    is_valid: bool
    errors: List[ValidationError] = field(default_factory=list)


@dataclass
class ValidationSummary:
    """Summary of all validation results."""
    total_files: int = 0
    files_with_preview: int = 0
    files_without_preview: int = 0
    files_with_null_preview: int = 0
    valid_previews: int = 0
    invalid_previews: int = 0
    missing_files: int = 0
    format_errors: int = 0
    results: List[ValidationResult] = field(default_factory=list)


class PreviewURLValidator:
    """Validates preview image URLs in Jekyll content frontmatter."""
    
    # Valid image extensions
    VALID_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}
    
    # Content directories to scan
    CONTENT_DIRS = [
        'pages/_posts',
        'pages/_docs', 
        'pages/_quickstart',
        'pages/_about',
        'pages/_quests',
    ]
    
    def __init__(self, project_root: Path, verbose: bool = False):
        self.project_root = project_root
        self.verbose = verbose
        self.summary = ValidationSummary()
        
    def log(self, msg: str, level: str = "info"):
        """Print formatted log message."""
        colors = {
            "info": Colors.BLUE,
            "success": Colors.GREEN,
            "warning": Colors.YELLOW,
            "error": Colors.RED,
            "debug": Colors.PURPLE,
        }
        color = colors.get(level, Colors.NC)
        prefix = f"[{level.upper()}]"
        print(f"{color}{prefix}{Colors.NC} {msg}")
    
    def debug(self, msg: str):
        """Print debug message if verbose mode enabled."""
        if self.verbose:
            self.log(msg, "debug")
    
    def parse_front_matter(self, file_path: Path) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Parse front matter from a markdown file.
        
        Returns:
            Tuple of (front_matter_dict, raw_preview_value)
        """
        try:
            content = file_path.read_text(encoding='utf-8')
        except Exception as e:
            self.log(f"Failed to read {file_path}: {e}", "error")
            return None, None
        
        # Extract front matter
        fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
        if not fm_match:
            return None, None
        
        fm_raw = fm_match.group(1)
        
        # Extract raw preview value for better error messages
        preview_match = re.search(r'^preview:\s*(.*)$', fm_raw, re.MULTILINE)
        raw_preview = preview_match.group(1).strip() if preview_match else None
        
        try:
            front_matter = yaml.safe_load(fm_raw)
            return front_matter, raw_preview
        except yaml.YAMLError as e:
            self.log(f"YAML parse error in {file_path}: {e}", "error")
            return None, raw_preview
    
    def validate_url_format(self, preview: str, file_path: str) -> List[ValidationError]:
        """Validate the format of a preview URL."""
        errors = []
        
        # Check if empty or whitespace only
        if not preview or not preview.strip():
            errors.append(ValidationError(
                file_path=file_path,
                preview_value=repr(preview),
                error_type="EMPTY_VALUE",
                message="Preview value is empty or whitespace only",
                suggestion="Set a valid image path or remove the preview field"
            ))
            return errors
        
        preview = preview.strip()
        
        # Check for 'null' string (should be YAML null, not string)
        if preview.lower() == 'null':
            errors.append(ValidationError(
                file_path=file_path,
                preview_value=preview,
                error_type="STRING_NULL",
                message="Preview is string 'null' instead of YAML null",
                suggestion="Use 'preview: null' (without quotes) or 'preview: ~'"
            ))
            return errors
        
        # Check if starts with /
        if not preview.startswith('/'):
            errors.append(ValidationError(
                file_path=file_path,
                preview_value=preview,
                error_type="RELATIVE_PATH",
                message="Preview URL should start with /",
                suggestion=f"Use '/{preview}' for absolute path"
            ))
        
        # Check for valid extension
        ext = Path(preview).suffix.lower()
        if ext not in self.VALID_EXTENSIONS:
            if ext:
                errors.append(ValidationError(
                    file_path=file_path,
                    preview_value=preview,
                    error_type="INVALID_EXTENSION",
                    message=f"Invalid image extension: {ext}",
                    suggestion=f"Valid extensions: {', '.join(sorted(self.VALID_EXTENSIONS))}"
                ))
            else:
                errors.append(ValidationError(
                    file_path=file_path,
                    preview_value=preview,
                    error_type="NO_EXTENSION",
                    message="Preview URL has no file extension",
                    suggestion="Add an image extension like .png, .jpg, .webp"
                ))
        
        # Check for suspicious patterns
        if '  ' in preview:
            errors.append(ValidationError(
                file_path=file_path,
                preview_value=preview,
                error_type="DOUBLE_SPACE",
                message="Preview URL contains double spaces",
                suggestion="Remove extra spaces from path"
            ))
        
        if '\n' in preview or '\t' in preview:
            errors.append(ValidationError(
                file_path=file_path,
                preview_value=repr(preview),
                error_type="WHITESPACE_CHARS",
                message="Preview URL contains newline or tab characters",
                suggestion="Use a clean single-line path"
            ))
        
        # Check for URL encoding issues
        if '%' in preview and not re.match(r'%[0-9A-Fa-f]{2}', preview):
            errors.append(ValidationError(
                file_path=file_path,
                preview_value=preview,
                error_type="ENCODING_ISSUE",
                message="Preview URL may have encoding issues",
                suggestion="Use properly URL-encoded characters or plain ASCII"
            ))
        
        return errors
    
    def validate_file_exists(self, preview: str, file_path: str) -> List[ValidationError]:
        """Check if the preview image file exists on disk."""
        errors = []
        
        if not preview or not preview.strip():
            return errors
        
        preview = preview.strip()
        
        # Skip validation for null/empty
        if preview.lower() == 'null':
            return errors
        
        # Remove leading slash for path checking
        clean_path = preview.lstrip('/')
        
        # Check direct path from project root
        full_path = self.project_root / clean_path
        
        if not full_path.exists():
            # Try common variations
            variations = [
                self.project_root / clean_path,
                self.project_root / 'assets' / clean_path,
                self.project_root / clean_path.replace('/assets/', ''),
            ]
            
            found = False
            for var_path in variations:
                if var_path.exists():
                    found = True
                    break
            
            if not found:
                # Look for similar files to suggest
                parent_dir = full_path.parent
                similar_files = []
                if parent_dir.exists():
                    target_name = full_path.stem.lower()
                    for f in parent_dir.iterdir():
                        if f.is_file() and f.suffix.lower() in self.VALID_EXTENSIONS:
                            if target_name[:10] in f.stem.lower() or f.stem.lower()[:10] in target_name:
                                similar_files.append(f'/{f.relative_to(self.project_root)}')
                
                suggestion = "Verify the file path and ensure the image exists"
                if similar_files:
                    suggestion = f"Did you mean: {similar_files[0]}"
                
                errors.append(ValidationError(
                    file_path=file_path,
                    preview_value=preview,
                    error_type="FILE_NOT_FOUND",
                    message=f"Preview image file not found: {clean_path}",
                    suggestion=suggestion
                ))
        
        return errors
    
    def validate_file(self, file_path: Path) -> ValidationResult:
        """Validate a single content file."""
        self.summary.total_files += 1
        
        rel_path = str(file_path.relative_to(self.project_root))
        self.debug(f"Checking: {rel_path}")
        
        front_matter, raw_preview = self.parse_front_matter(file_path)
        
        if front_matter is None:
            return ValidationResult(
                file_path=rel_path,
                title="(parse error)",
                preview_value=raw_preview,
                is_valid=False,
                errors=[ValidationError(
                    file_path=rel_path,
                    preview_value=raw_preview or "(none)",
                    error_type="PARSE_ERROR",
                    message="Could not parse front matter"
                )]
            )
        
        title = front_matter.get('title', '(no title)')
        preview = front_matter.get('preview')
        
        # Handle various null representations
        if preview is None:
            self.summary.files_without_preview += 1
            self.summary.files_with_null_preview += 1
            return ValidationResult(
                file_path=rel_path,
                title=title,
                preview_value=None,
                is_valid=True,  # null is valid
                errors=[]
            )
        
        self.summary.files_with_preview += 1
        
        # Convert to string for validation
        preview_str = str(preview).strip()
        
        errors = []
        
        # Validate format
        format_errors = self.validate_url_format(preview_str, rel_path)
        errors.extend(format_errors)
        
        # Validate file exists (only if format is valid enough)
        if not any(e.error_type in ('EMPTY_VALUE', 'STRING_NULL') for e in format_errors):
            existence_errors = self.validate_file_exists(preview_str, rel_path)
            errors.extend(existence_errors)
        
        is_valid = len(errors) == 0
        
        if is_valid:
            self.summary.valid_previews += 1
        else:
            self.summary.invalid_previews += 1
            # Count error types
            for e in errors:
                if e.error_type == 'FILE_NOT_FOUND':
                    self.summary.missing_files += 1
                elif e.error_type in ('RELATIVE_PATH', 'INVALID_EXTENSION', 'NO_EXTENSION', 'EMPTY_VALUE'):
                    self.summary.format_errors += 1
        
        return ValidationResult(
            file_path=rel_path,
            title=title,
            preview_value=preview_str,
            is_valid=is_valid,
            errors=errors
        )
    
    def scan_directory(self, directory: Path) -> List[ValidationResult]:
        """Scan a directory for markdown files and validate them."""
        results = []
        
        if not directory.exists():
            self.debug(f"Directory not found: {directory}")
            return results
        
        for md_file in directory.rglob("*.md"):
            result = self.validate_file(md_file)
            results.append(result)
            self.summary.results.append(result)
        
        return results
    
    def run(self) -> ValidationSummary:
        """Run validation on all content directories."""
        print(f"\n{Colors.CYAN}{'=' * 60}{Colors.NC}")
        print(f"{Colors.CYAN}🔍 Preview URL Validator{Colors.NC}")
        print(f"{Colors.CYAN}{'=' * 60}{Colors.NC}\n")
        
        for content_dir in self.CONTENT_DIRS:
            dir_path = self.project_root / content_dir
            if dir_path.exists():
                self.log(f"Scanning: {content_dir}", "info")
                self.scan_directory(dir_path)
        
        return self.summary
    
    def print_results(self, show_suggestions: bool = False):
        """Print validation results."""
        # Print errors
        error_results = [r for r in self.summary.results if not r.is_valid]
        
        if error_results:
            print(f"\n{Colors.RED}{'=' * 60}{Colors.NC}")
            print(f"{Colors.RED}❌ Validation Errors Found{Colors.NC}")
            print(f"{Colors.RED}{'=' * 60}{Colors.NC}\n")
            
            for result in error_results:
                print(f"{Colors.BOLD}{result.file_path}{Colors.NC}")
                print(f"  Title: {result.title}")
                print(f"  Preview: {result.preview_value}")
                for error in result.errors:
                    print(f"  {Colors.RED}✗ [{error.error_type}]{Colors.NC} {error.message}")
                    if show_suggestions and error.suggestion:
                        print(f"    {Colors.YELLOW}→ {error.suggestion}{Colors.NC}")
                print()
        
        # Print summary
        print(f"\n{Colors.CYAN}{'=' * 60}{Colors.NC}")
        print(f"{Colors.CYAN}📊 Validation Summary{Colors.NC}")
        print(f"{Colors.CYAN}{'=' * 60}{Colors.NC}\n")
        
        print(f"  Total files scanned:     {self.summary.total_files}")
        print(f"  Files with preview:      {self.summary.files_with_preview}")
        print(f"  Files without preview:   {self.summary.files_without_preview}")
        print(f"  Files with null preview: {self.summary.files_with_null_preview}")
        print()
        print(f"  {Colors.GREEN}✓ Valid previews:        {self.summary.valid_previews}{Colors.NC}")
        print(f"  {Colors.RED}✗ Invalid previews:      {self.summary.invalid_previews}{Colors.NC}")
        print(f"    - Missing files:       {self.summary.missing_files}")
        print(f"    - Format errors:       {self.summary.format_errors}")
        print()
        
        if self.summary.invalid_previews == 0:
            print(f"{Colors.GREEN}✅ All preview URLs are valid!{Colors.NC}\n")
            return 0
        else:
            print(f"{Colors.RED}❌ Found {self.summary.invalid_previews} invalid preview URL(s){Colors.NC}\n")
            return 1


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Validate preview image URLs in Jekyll content frontmatter"
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help="Enable verbose output"
    )
    parser.add_argument(
        '-s', '--suggestions', '--fix-suggestions',
        action='store_true',
        help="Show fix suggestions for errors"
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help="Output results as JSON"
    )
    
    args = parser.parse_args()
    
    # Determine project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    
    validator = PreviewURLValidator(project_root, verbose=args.verbose)
    summary = validator.run()
    
    if args.json:
        import json
        output = {
            'total_files': summary.total_files,
            'files_with_preview': summary.files_with_preview,
            'valid_previews': summary.valid_previews,
            'invalid_previews': summary.invalid_previews,
            'errors': [
                {
                    'file': r.file_path,
                    'title': r.title,
                    'preview': r.preview_value,
                    'errors': [
                        {
                            'type': e.error_type,
                            'message': e.message,
                            'suggestion': e.suggestion
                        }
                        for e in r.errors
                    ]
                }
                for r in summary.results if not r.is_valid
            ]
        }
        print(json.dumps(output, indent=2))
        return 1 if summary.invalid_previews > 0 else 0
    else:
        return validator.print_results(show_suggestions=args.suggestions)


if __name__ == "__main__":
    sys.exit(main())

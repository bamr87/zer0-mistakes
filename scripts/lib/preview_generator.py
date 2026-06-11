#!/usr/bin/env python3
"""
Preview Image Generator - AI-powered preview image generation for Jekyll content.

This module provides a Python-based interface for generating preview images
using various AI providers (OpenAI DALL-E, Stability AI, etc.).

Usage:
    python3 preview_generator.py --file path/to/post.md
    python3 preview_generator.py --collection posts --dry-run
    python3 preview_generator.py --list-missing

Dependencies:
    pip install openai pyyaml requests pillow

Environment Variables:
    OPENAI_API_KEY - Required for OpenAI provider
    STABILITY_API_KEY - Required for Stability AI provider
"""

import argparse
import json
import os
import re
import sys
import signal
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any, TextIO, Tuple
import yaml

# Optional imports with fallback
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


def _load_dotenv():
    """Load environment variables from .env file if present."""
    # Search for .env in cwd and parent directories
    search_dir = Path.cwd()
    for _ in range(5):  # limit search depth
        env_file = search_dir / '.env'
        if env_file.is_file():
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    if '=' in line:
                        key, _, value = line.partition('=')
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        if key and key not in os.environ:
                            os.environ[key] = value
            return
        parent = search_dir.parent
        if parent == search_dir:
            break
        search_dir = parent

_load_dotenv()


# Global state for interrupt handling
_interrupted = False
_log_file: Optional[TextIO] = None


def _signal_handler(signum, frame):
    """Handle interrupt signals gracefully."""
    global _interrupted
    _interrupted = True
    print(f"\n{Colors.YELLOW}⚠️  Interrupt received. Finishing current tasks...{Colors.NC}")


class RateLimiter:
    """Token bucket rate limiter for API calls."""
    
    def __init__(self, requests_per_minute: int = 5):
        self.requests_per_minute = requests_per_minute
        self.min_interval = 60.0 / requests_per_minute
        self.lock = threading.Lock()
        self.last_request_time = 0.0
        self.request_count = 0
        self.window_start = time.time()
    
    def acquire(self) -> float:
        """Acquire permission to make a request. Returns time waited."""
        with self.lock:
            now = time.time()
            if now - self.window_start >= 60.0:
                self.window_start = now
                self.request_count = 0
            if self.request_count >= self.requests_per_minute:
                wait_time = 60.0 - (now - self.window_start)
                if wait_time > 0:
                    time.sleep(wait_time)
                    self.window_start = time.time()
                    self.request_count = 0
                    return wait_time
            elapsed = now - self.last_request_time
            if elapsed < self.min_interval:
                wait_time = self.min_interval - elapsed
                time.sleep(wait_time)
            else:
                wait_time = 0
            self.last_request_time = time.time()
            self.request_count += 1
            return wait_time


@dataclass
class ContentFile:
    """Represents a Jekyll content file with its metadata."""
    path: Path
    title: str
    description: str
    categories: List[str]
    tags: List[str]
    preview: Optional[str]
    content: str
    front_matter: Dict[str, Any]


@dataclass
class GenerationResult:
    """Result of an image generation attempt."""
    success: bool
    image_path: Optional[str]
    preview_url: Optional[str]
    error: Optional[str]
    prompt_used: Optional[str]
    duration: float = 0.0
    file_path: Optional[Path] = None


class ThreadSafeStats:
    """Thread-safe progress statistics."""
    
    def __init__(self):
        self.lock = threading.Lock()
        self._total_files: int = 0
        self._current_index: int = 0
        self._processed: int = 0
        self._generated: int = 0
        self._skipped: int = 0
        self._errors: int = 0
        self._start_time: float = time.time()
        self._generation_times: List[float] = []
        self._active_workers: int = 0
        self._pending_files: List[str] = []
    
    @property
    def total_files(self) -> int:
        with self.lock:
            return self._total_files
    
    @total_files.setter
    def total_files(self, value: int):
        with self.lock:
            self._total_files = value
    
    @property
    def current_index(self) -> int:
        with self.lock:
            return self._current_index
    
    @current_index.setter
    def current_index(self, value: int):
        with self.lock:
            self._current_index = value
    
    @property
    def processed(self) -> int:
        with self.lock:
            return self._processed
    
    @property
    def generated(self) -> int:
        with self.lock:
            return self._generated
    
    @property
    def skipped(self) -> int:
        with self.lock:
            return self._skipped
    
    @property
    def errors(self) -> int:
        with self.lock:
            return self._errors
    
    @property
    def active_workers(self) -> int:
        with self.lock:
            return self._active_workers
    
    def increment_processed(self):
        with self.lock:
            self._processed += 1
            self._current_index += 1
    
    def increment_generated(self):
        with self.lock:
            self._generated += 1
    
    def increment_skipped(self):
        with self.lock:
            self._skipped += 1
    
    def increment_errors(self):
        with self.lock:
            self._errors += 1
    
    def add_generation_time(self, duration: float):
        with self.lock:
            self._generation_times.append(duration)
    
    def set_active_workers(self, count: int):
        with self.lock:
            self._active_workers = count
    
    def add_pending_file(self, filename: str):
        with self.lock:
            self._pending_files.append(filename)
    
    def remove_pending_file(self, filename: str):
        with self.lock:
            if filename in self._pending_files:
                self._pending_files.remove(filename)
    
    def get_pending_files(self) -> List[str]:
        with self.lock:
            return self._pending_files.copy()
    
    @property
    def elapsed(self) -> float:
        return time.time() - self._start_time
    
    @property
    def elapsed_str(self) -> str:
        return str(timedelta(seconds=int(self.elapsed)))
    
    @property
    def avg_generation_time(self) -> float:
        with self.lock:
            if not self._generation_times:
                return 25.0
            return sum(self._generation_times) / len(self._generation_times)
    
    @property
    def generation_times(self) -> List[float]:
        with self.lock:
            return self._generation_times.copy()
    
    @property
    def estimated_remaining(self) -> float:
        with self.lock:
            remaining = self._total_files - self._current_index
            return remaining * self.avg_generation_time
    
    @property
    def eta_str(self) -> str:
        with self.lock:
            if self._total_files == 0:
                return "unknown"
            return str(timedelta(seconds=int(self.estimated_remaining)))
    
    @property
    def percentage(self) -> float:
        with self.lock:
            if self._total_files == 0:
                return 0.0
            return (self._current_index / self._total_files) * 100


@dataclass
class ProgressStats:
    """Track progress statistics (legacy, non-thread-safe)."""
    total_files: int = 0
    current_index: int = 0
    processed: int = 0
    generated: int = 0
    skipped: int = 0
    errors: int = 0
    start_time: float = field(default_factory=time.time)
    generation_times: List[float] = field(default_factory=list)
    
    @property
    def elapsed(self) -> float:
        return time.time() - self.start_time
    
    @property
    def elapsed_str(self) -> str:
        return str(timedelta(seconds=int(self.elapsed)))
    
    @property
    def avg_generation_time(self) -> float:
        if not self.generation_times:
            return 25.0
        return sum(self.generation_times) / len(self.generation_times)
    
    @property
    def estimated_remaining(self) -> float:
        remaining = self.total_files - self.current_index
        return remaining * self.avg_generation_time
    
    @property
    def eta_str(self) -> str:
        if self.total_files == 0:
            return "unknown"
        return str(timedelta(seconds=int(self.estimated_remaining)))
    
    @property
    def percentage(self) -> float:
        if self.total_files == 0:
            return 0.0
        return (self.current_index / self.total_files) * 100


class Colors:
    """Terminal colors for output."""
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    PURPLE = '\033[0;35m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    NC = '\033[0m'  # No Color


class Spinner:
    """Simple spinner for showing activity during long operations."""
    
    FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    
    def __init__(self, message: str = ""):
        self.message = message
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.frame_idx = 0
        self.start_time = 0.0
    
    def _spin(self):
        while self.running:
            elapsed = int(time.time() - self.start_time)
            frame = self.FRAMES[self.frame_idx % len(self.FRAMES)]
            sys.stdout.write(f"\r{Colors.CYAN}{frame}{Colors.NC} {self.message} ({elapsed}s)...")
            sys.stdout.flush()
            self.frame_idx += 1
            time.sleep(0.1)
    
    def start(self, message: str = None):
        if message:
            self.message = message
        self.running = True
        self.start_time = time.time()
        self.thread = threading.Thread(target=self._spin, daemon=True)
        self.thread.start()
    
    def stop(self, success: bool = True):
        self.running = False
        if self.thread:
            self.thread.join(timeout=0.2)
        elapsed = time.time() - self.start_time
        sys.stdout.write('\r' + ' ' * 80 + '\r')
        sys.stdout.flush()
        return elapsed


def log(msg: str, level: str = "info", to_file: bool = True):
    """Print formatted log message."""
    global _log_file
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    colors = {
        "info": Colors.BLUE,
        "success": Colors.GREEN,
        "warning": Colors.YELLOW,
        "error": Colors.RED,
        "debug": Colors.PURPLE,
        "step": Colors.CYAN,
        "progress": Colors.BOLD,
    }
    color = colors.get(level, Colors.NC)
    prefix = f"[{level.upper()}]"
    print(f"{color}{prefix}{Colors.NC} {msg}")
    
    if to_file and _log_file:
        _log_file.write(f"{timestamp} {prefix} {msg}\n")
        _log_file.flush()


def log_progress(current: int, total: int, title: str, stats):
    """Print progress bar and statistics."""
    bar_width = 30
    filled = int(bar_width * current / total) if total > 0 else 0
    bar = '█' * filled + '░' * (bar_width - filled)
    
    max_title_len = 40
    display_title = title[:max_title_len-3] + "..." if len(title) > max_title_len else title
    
    print(f"\n{Colors.CYAN}{'─' * 70}{Colors.NC}")
    print(f"{Colors.BOLD}📊 Progress: [{bar}] {current}/{total} ({stats.percentage:.1f}%){Colors.NC}")
    print(f"   {Colors.DIM}Elapsed: {stats.elapsed_str} | ETA: {stats.eta_str} | Avg: {stats.avg_generation_time:.1f}s/image{Colors.NC}")
    print(f"   ✅ Generated: {stats.generated} | ⏭️  Skipped: {stats.skipped} | ❌ Errors: {stats.errors}")
    print(f"{Colors.CYAN}{'─' * 70}{Colors.NC}")
    print(f"📁 Processing: {display_title}")


class PreviewGenerator:
    """AI-powered preview image generator for Jekyll content."""
    
    def __init__(
        self,
        project_root: Path,
        provider: str = "openai",
        output_dir: str = "assets/images/previews",
        image_style: str = "digital art, professional blog illustration",
        image_size: str = "1024x1024",
        assets_prefix: str = "/assets",
        auto_prefix: bool = True,
        dry_run: bool = False,
        verbose: bool = False,
        force: bool = False,
        batch_limit: int = 0,
        workers: int = 1,
        rate_limit: int = 5,
    ):
        self.project_root = project_root
        self.provider = provider
        self.output_dir = project_root / output_dir
        self.image_style = image_style
        self.image_size = image_size
        self.assets_prefix = assets_prefix
        self.auto_prefix = auto_prefix
        self.dry_run = dry_run
        self.verbose = verbose
        self.force = force
        self.batch_limit = batch_limit
        self.workers = workers
        self.rate_limit = rate_limit
        
        # Progress tracking - use thread-safe stats for parallel processing
        if workers > 1:
            self.stats = ThreadSafeStats()
        else:
            self.stats = ProgressStats()
        self.spinner = Spinner()
        
        # Rate limiter for API calls
        self.rate_limiter = RateLimiter(requests_per_minute=rate_limit)
        
        # Ensure output directory exists
        if not dry_run:
            self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def debug(self, msg: str):
        """Print debug message if verbose mode is enabled."""
        if self.verbose:
            log(msg, "debug")
    
    def normalize_preview_path(self, preview_path: Optional[str]) -> Optional[str]:
        """Normalize a preview path by adding assets_prefix if needed.
        
        This allows users to omit the /assets/ prefix in frontmatter:
        - /images/previews/my-image.png -> /assets/images/previews/my-image.png
        - /assets/images/previews/my-image.png -> unchanged
        - https://example.com/image.png -> unchanged (external URL)
        """
        if not preview_path:
            return preview_path
        
        # External URLs pass through unchanged
        if preview_path.startswith('http://') or preview_path.startswith('https://'):
            return preview_path
        
        # If auto_prefix is enabled and path doesn't contain assets_prefix
        if self.auto_prefix and self.assets_prefix not in preview_path:
            return f"{self.assets_prefix}{preview_path}"
        
        return preview_path
    
    def parse_front_matter(self, file_path: Path) -> Optional[ContentFile]:
        """Parse front matter and content from a markdown file."""
        try:
            content = file_path.read_text(encoding='utf-8')
        except Exception as e:
            log(f"Failed to read {file_path}: {e}", "error")
            return None
        
        # Extract front matter
        fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
        if not fm_match:
            self.debug(f"No front matter found in: {file_path}")
            return None
        
        try:
            front_matter = yaml.safe_load(fm_match.group(1))
            post_content = fm_match.group(2)
        except yaml.YAMLError as e:
            log(f"Failed to parse YAML in {file_path}: {e}", "error")
            return None
        
        if not front_matter:
            return None
        
        # Extract fields with defaults
        categories = front_matter.get('categories', [])
        if isinstance(categories, str):
            categories = [categories]
        
        tags = front_matter.get('tags', [])
        if isinstance(tags, str):
            tags = [tags]
        
        return ContentFile(
            path=file_path,
            title=front_matter.get('title', ''),
            description=front_matter.get('description', ''),
            categories=categories,
            tags=tags,
            preview=front_matter.get('preview'),
            content=post_content,
            front_matter=front_matter,
        )
    
    def check_preview_exists(self, preview_path: Optional[str]) -> bool:
        """Check if the preview image file exists."""
        if not preview_path:
            return False
        
        # Normalize the path first (adds assets_prefix if needed)
        normalized_path = self.normalize_preview_path(preview_path)
        if not normalized_path:
            return False
        
        # Handle absolute and relative paths
        clean_path = normalized_path.lstrip('/')
        
        # Check direct path
        full_path = self.project_root / clean_path
        if full_path.exists():
            return True
        
        return False
    
    def generate_prompt(self, content: ContentFile) -> str:
        """Generate an AI prompt from content metadata."""
        prompt_parts = [
            f"Create a professional blog preview image for an article titled '{content.title}'."
        ]
        
        if content.description:
            prompt_parts.append(f"The article is about: {content.description}.")
        
        if content.categories:
            prompt_parts.append(f"Categories: {', '.join(content.categories)}.")
        
        if content.tags:
            prompt_parts.append(f"Tags: {', '.join(content.tags[:5])}.")  # Limit tags
        
        # Add content excerpt (first 500 chars)
        content_excerpt = content.content[:500].strip()
        if content_excerpt:
            # Remove markdown formatting
            clean_content = re.sub(r'[#*`\[\]()]', '', content_excerpt)
            clean_content = re.sub(r'\n+', ' ', clean_content)
            prompt_parts.append(f"Key themes: {clean_content}")
        
        # Add style instructions
        prompt_parts.extend([
            f"Style: {self.image_style}.",
            "The image should be suitable as a blog header/preview image.",
            "Clean composition, professional look, visually appealing.",
            "No text or letters in the image.",
        ])
        
        return ' '.join(prompt_parts)
    
    def generate_filename(self, title: str) -> str:
        """Generate a safe filename from title."""
        # Convert to lowercase and replace special chars
        safe_name = re.sub(r'[^a-z0-9]+', '-', title.lower())
        safe_name = re.sub(r'-+', '-', safe_name).strip('-')
        return safe_name[:50]  # Limit length
    
    def generate_image_openai(self, prompt: str, output_path: Path) -> GenerationResult:
        """Generate image using OpenAI DALL-E via HTTP API (no SDK required)."""
        if not HAS_REQUESTS:
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error="requests package not installed. Run: pip install requests",
                prompt_used=prompt,
            )
        
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error="OPENAI_API_KEY environment variable not set",
                prompt_used=prompt,
            )
        
        try:
            self.debug(f"Generating with prompt: {prompt[:200]}...")
            
            # Parse size
            size_map = {
                "1024x1024": "1024x1024",
                "1792x1024": "1792x1024",
                "1024x1792": "1024x1792",
            }
            size = size_map.get(self.image_size, "1024x1024")
            
            # Use HTTP API directly instead of SDK
            response = requests.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "size": size,
                    "quality": "standard",
                    "n": 1,
                },
                timeout=120,  # 2 minute timeout for image generation
            )
            response.raise_for_status()
            
            data = response.json()
            image_url = data['data'][0]['url']
            
            # Download image
            img_response = requests.get(image_url, timeout=60)
            img_response.raise_for_status()
            
            output_path.write_bytes(img_response.content)
            
            return GenerationResult(
                success=True,
                image_path=str(output_path),
                preview_url=str(output_path.relative_to(self.project_root)),
                error=None,
                prompt_used=prompt,
            )
            
        except requests.exceptions.HTTPError as e:
            error_msg = str(e)
            try:
                error_data = e.response.json()
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', str(e))
            except:
                pass
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error=error_msg,
                prompt_used=prompt,
            )
        except Exception as e:
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error=str(e),
                prompt_used=prompt,
            )
    
    def generate_image_stability(self, prompt: str, output_path: Path) -> GenerationResult:
        """Generate image using Stability AI."""
        if not HAS_REQUESTS:
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error="requests package not installed",
                prompt_used=prompt,
            )
        
        api_key = os.environ.get('STABILITY_API_KEY')
        if not api_key:
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error="STABILITY_API_KEY environment variable not set",
                prompt_used=prompt,
            )
        
        try:
            response = requests.post(
                "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "text_prompts": [{"text": prompt}],
                    "cfg_scale": 7,
                    "height": 1024,
                    "width": 1024,
                    "samples": 1,
                    "steps": 30,
                },
            )
            response.raise_for_status()
            
            data = response.json()
            
            if 'artifacts' not in data or not data['artifacts']:
                return GenerationResult(
                    success=False,
                    image_path=None,
                    preview_url=None,
                    error="No image data in response",
                    prompt_used=prompt,
                )
            
            import base64
            image_data = base64.b64decode(data['artifacts'][0]['base64'])
            output_path.write_bytes(image_data)
            
            return GenerationResult(
                success=True,
                image_path=str(output_path),
                preview_url=str(output_path.relative_to(self.project_root)),
                error=None,
                prompt_used=prompt,
            )
            
        except Exception as e:
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error=str(e),
                prompt_used=prompt,
            )
    
    def generate_image_xai(self, prompt: str, output_path: Path) -> GenerationResult:
        """Generate image using xAI Grok API."""
        if not HAS_REQUESTS:
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error="requests package not installed. Run: pip install requests",
                prompt_used=prompt,
            )
        
        api_key = os.environ.get('XAI_API_KEY')
        if not api_key:
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error="XAI_API_KEY environment variable not set",
                prompt_used=prompt,
            )
        
        try:
            # xAI has a max prompt length of 1024 characters
            truncated_prompt = prompt[:1000] if len(prompt) > 1000 else prompt
            self.debug(f"Generating with xAI Grok, prompt: {truncated_prompt[:200]}...")
            
            # xAI uses OpenAI-compatible API format
            response = requests.post(
                "https://api.x.ai/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "grok-2-image",
                    "prompt": truncated_prompt,
                    "n": 1,
                },
                timeout=120,  # 2 minute timeout for image generation
            )
            response.raise_for_status()
            
            data = response.json()
            
            # xAI returns base64-encoded images
            if 'data' not in data or not data['data']:
                return GenerationResult(
                    success=False,
                    image_path=None,
                    preview_url=None,
                    error="No image data in response",
                    prompt_used=prompt,
                )
            
            image_data = data['data'][0]
            
            # Check if it's a URL or base64
            if 'url' in image_data:
                # Download from URL
                img_response = requests.get(image_data['url'], timeout=60)
                img_response.raise_for_status()
                output_path.write_bytes(img_response.content)
            elif 'b64_json' in image_data:
                # Decode base64
                import base64
                image_bytes = base64.b64decode(image_data['b64_json'])
                output_path.write_bytes(image_bytes)
            else:
                return GenerationResult(
                    success=False,
                    image_path=None,
                    preview_url=None,
                    error="Unexpected response format from xAI",
                    prompt_used=prompt,
                )
            
            return GenerationResult(
                success=True,
                image_path=str(output_path),
                preview_url=str(output_path.relative_to(self.project_root)),
                error=None,
                prompt_used=prompt,
            )
            
        except requests.exceptions.HTTPError as e:
            error_msg = str(e)
            try:
                error_data = e.response.json()
                self.debug(f"xAI error response: {error_data}")
                if 'error' in error_data:
                    error_msg = error_data['error'].get('message', str(error_data['error']))
                elif 'detail' in error_data:
                    error_msg = str(error_data['detail'])
                else:
                    error_msg = str(error_data)
            except:
                # Try to get raw text
                try:
                    error_msg = e.response.text[:500]
                except:
                    pass
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error=f"xAI API error: {error_msg}",
                prompt_used=prompt,
            )
        except Exception as e:
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error=str(e),
                prompt_used=prompt,
            )
    
    def generate_image(self, prompt: str, output_path: Path) -> GenerationResult:
        """Generate image using configured provider."""
        if self.provider == "openai":
            return self.generate_image_openai(prompt, output_path)
        elif self.provider == "stability":
            return self.generate_image_stability(prompt, output_path)
        elif self.provider == "xai":
            return self.generate_image_xai(prompt, output_path)
        else:
            return GenerationResult(
                success=False,
                image_path=None,
                preview_url=None,
                error=f"Unknown provider: {self.provider}",
                prompt_used=prompt,
            )
    
    def update_front_matter(self, file_path: Path, preview_path: str) -> bool:
        """Update the front matter with new preview path."""
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # Check if preview field exists
            if re.search(r'^preview:', content, re.MULTILINE):
                # Update existing preview
                new_content = re.sub(
                    r'^preview:.*$',
                    f'preview: {preview_path}',
                    content,
                    flags=re.MULTILINE,
                )
            else:
                # Add preview after description or title
                if 'description:' in content:
                    new_content = re.sub(
                        r'(^description:.*$)',
                        f'\\1\npreview: {preview_path}',
                        content,
                        flags=re.MULTILINE,
                    )
                else:
                    new_content = re.sub(
                        r'(^title:.*$)',
                        f'\\1\npreview: {preview_path}',
                        content,
                        flags=re.MULTILINE,
                    )
            
            file_path.write_text(new_content, encoding='utf-8')
            return True
            
        except Exception as e:
            log(f"Failed to update front matter: {e}", "error")
            return False
    
    def _increment_stat(self, stat_name: str):
        """Increment a stat on either ThreadSafeStats or ProgressStats."""
        if isinstance(self.stats, ThreadSafeStats):
            method = getattr(self.stats, f"increment_{stat_name}", None)
            if method:
                method()
        else:
            setattr(self.stats, stat_name, getattr(self.stats, stat_name) + 1)

    def process_file(self, file_path: Path, list_only: bool = False) -> bool:
        """Process a single content file."""
        global _interrupted
        if _interrupted:
            return False
        
        self._increment_stat("processed")
        
        content = self.parse_front_matter(file_path)
        if not content:
            self._increment_stat("skipped")
            return False
        
        self.debug(f"Processing: {content.title}")
        
        # Check if preview exists
        if content.preview and self.check_preview_exists(content.preview):
            if not self.force:
                self.debug(f"Preview exists: {content.preview}")
                self._increment_stat("skipped")
                return True
            else:
                log(f"Force mode: regenerating preview for {content.title}", "info")
        
        # List only mode
        if list_only:
            print(f"{Colors.YELLOW}Missing preview:{Colors.NC} {file_path}")
            print(f"  Title: {content.title}")
            if content.preview:
                print(f"  Current preview (not found): {content.preview}")
            print()
            return True
        
        log(f"Generating preview for: {content.title}", "info")
        
        # Generate filename and paths
        safe_filename = self.generate_filename(content.title)
        output_file = self.output_dir / f"{safe_filename}.png"
        preview_url = f"/{self.output_dir.relative_to(self.project_root)}/{safe_filename}.png"
        
        # Generate prompt
        prompt = self.generate_prompt(content)
        self.debug(f"Prompt: {prompt[:300]}...")
        
        # Dry run mode
        if self.dry_run:
            log(f"[DRY RUN] Would generate image:", "info")
            print(f"  Output: {output_file}")
            print(f"  Preview URL: {preview_url}")
            print(f"  Prompt: {prompt[:200]}...")
            print()
            self._increment_stat("generated")
            return True
        
        # Rate limiting
        self.rate_limiter.acquire()
        
        start_time = time.time()
        
        # Generate image
        self.spinner.start(f"Generating: {content.title[:50]}...")
        result = self.generate_image(prompt, output_file)
        self.spinner.stop()
        
        duration = time.time() - start_time
        result.duration = duration
        result.file_path = file_path
        
        if result.success:
            # Update front matter
            self.spinner.start("Updating front matter...")
            updated = self.update_front_matter(file_path, preview_url)
            self.spinner.stop()
            
            if updated:
                log(f"Updated front matter with: {preview_url} ({duration:.1f}s)", "success")
                self._increment_stat("generated")
                if isinstance(self.stats, ThreadSafeStats):
                    self.stats.add_generation_time(duration)
                return True
            else:
                self._increment_stat("errors")
                return False
        else:
            log(f"Failed to generate image: {result.error}", "warning")
            self._increment_stat("errors")
            return False
    
    def process_file_parallel(self, file_path: Path) -> Tuple[Path, GenerationResult]:
        """Thread-safe version of process_file for parallel processing."""
        global _interrupted
        if _interrupted:
            return file_path, GenerationResult(success=False, error="Interrupted")
        
        content = self.parse_front_matter(file_path)
        if not content:
            self.stats.increment_skipped()
            return file_path, GenerationResult(success=False, error="No front matter")
        
        # Check if preview exists
        if content.preview and self.check_preview_exists(content.preview):
            if not self.force:
                self.stats.increment_skipped()
                return file_path, GenerationResult(success=True, file_path=file_path)
        
        # Generate filename and paths
        safe_filename = self.generate_filename(content.title)
        output_file = self.output_dir / f"{safe_filename}.png"
        preview_url = f"/{self.output_dir.relative_to(self.project_root)}/{safe_filename}.png"
        
        # Generate prompt
        prompt = self.generate_prompt(content)
        
        # Rate limiting
        self.rate_limiter.acquire()
        
        start_time = time.time()
        result = self.generate_image(prompt, output_file)
        duration = time.time() - start_time
        result.duration = duration
        result.file_path = file_path
        
        if result.success:
            if self.update_front_matter(file_path, preview_url):
                self.stats.increment_generated()
                self.stats.add_generation_time(duration)
                return file_path, result
            else:
                self.stats.increment_errors()
                result.success = False
                result.error = "Failed to update front matter"
                return file_path, result
        else:
            self.stats.increment_errors()
            return file_path, result
    
    def process_collection(self, collection_path: Path, list_only: bool = False):
        """Process all markdown files in a collection."""
        if not collection_path.exists():
            log(f"Collection not found: {collection_path}", "warning")
            return
        
        files = sorted(collection_path.rglob("*.md"))
        
        # Apply batch limit
        if self.batch_limit > 0:
            files = files[:self.batch_limit]
            log(f"Batch limit: processing {len(files)} files", "info")
        
        if not files:
            log(f"No markdown files found in {collection_path}", "info")
            return
        
        if self.workers > 1 and not list_only and not self.dry_run:
            self._process_collection_parallel(files)
        else:
            self._process_collection_sequential(files, list_only)

    def _process_collection_sequential(self, files: List[Path], list_only: bool = False):
        """Process files sequentially with progress tracking."""
        global _interrupted
        total = len(files)
        
        for i, md_file in enumerate(files):
            if _interrupted:
                log("Interrupted! Stopping...", "warning")
                break
            
            if isinstance(self.stats, ProgressStats):
                log_progress(i + 1, total, "Processing", self.stats)
            
            self.process_file(md_file, list_only)
            self.stats.processed = i + 1

    def _process_collection_parallel(self, files: List[Path]):
        """Process files in parallel using ThreadPoolExecutor."""
        global _interrupted
        total = len(files)
        
        log(f"Processing {total} files with {self.workers} workers", "info")
        
        if isinstance(self.stats, ThreadSafeStats):
            self.stats.set_active_workers(self.workers)
            for f in files:
                self.stats.add_pending_file(str(f))
        
        completed = 0
        
        with ThreadPoolExecutor(max_workers=self.workers) as executor:
            futures = {
                executor.submit(self.process_file_parallel, f): f
                for f in files
            }
            
            for future in as_completed(futures):
                if _interrupted:
                    log("Interrupted! Cancelling remaining tasks...", "warning")
                    for f in futures:
                        f.cancel()
                    break
                
                file_path, result = future.result()
                completed += 1
                
                if isinstance(self.stats, ThreadSafeStats):
                    self.stats.increment_processed()
                    self.stats.remove_pending_file(str(file_path))
                
                self._show_parallel_progress(completed, total, file_path, result)

    def _show_parallel_progress(self, completed: int, total: int, file_path: Path, result: GenerationResult):
        """Show progress for parallel processing."""
        pct = (completed / total) * 100
        bar_len = 30
        filled = int(bar_len * completed / total)
        bar = "█" * filled + "░" * (bar_len - filled)
        
        status = f"{Colors.GREEN}✓{Colors.NC}" if result.success else f"{Colors.RED}✗{Colors.NC}"
        name = file_path.name[:30]
        duration = f" ({result.duration:.1f}s)" if result.duration > 0 else ""
        
        workers_info = ""
        if isinstance(self.stats, ThreadSafeStats):
            workers_info = f" [{self.stats.active_workers}w]"
        
        print(f"\r  {bar} {pct:5.1f}% ({completed}/{total}){workers_info} {status} {name}{duration}    ", end="", flush=True)
        
        if completed == total:
            print()
    
    def print_summary(self):
        """Print processing summary."""
        stats = self.stats
        
        print()
        print(f"{Colors.CYAN}{'=' * 50}{Colors.NC}")
        print(f"{Colors.CYAN}📊 Generation Summary{Colors.NC}")
        print(f"{Colors.CYAN}{'=' * 50}{Colors.NC}")
        
        if isinstance(stats, ThreadSafeStats):
            print(f"  📁 Files processed:  {stats.processed}")
            print(f"  🎨 Images generated: {stats.generated}")
            print(f"  ⏭️  Files skipped:    {stats.skipped}")
            print(f"  ❌ Errors:           {stats.errors}")
            
            if stats.elapsed > 0:
                print(f"\n  ⏱️  Total time:      {stats.elapsed_str}")
            if stats.avg_generation_time > 0:
                print(f"  📈 Avg time/image:   {stats.avg_generation_time:.1f}s")
            if self.workers > 1:
                print(f"  👷 Workers used:     {self.workers}")
        else:
            print(f"  📁 Files processed:  {stats.processed}")
            print(f"  🎨 Images generated: {stats.generated}")
            print(f"  ⏭️  Files skipped:    {stats.skipped}")
            print(f"  ❌ Errors:           {stats.errors}")
        
        print()
        
        if _interrupted:
            log("Processing was interrupted by user.", "warning")
        
        if self.dry_run:
            log("This was a dry run. No actual changes were made.", "info")
        
        errors = stats.errors if isinstance(stats, ThreadSafeStats) else stats.errors
        if errors > 0:
            log("Some files had errors. Check the output above.", "warning")


def main():
    """Main entry point."""
    global _log_file
    
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)
    
    parser = argparse.ArgumentParser(
        description="AI-powered preview image generator for Jekyll content"
    )
    parser.add_argument(
        '-f', '--file',
        help="Process a specific file only"
    )
    parser.add_argument(
        '-c', '--collection',
        choices=['posts', 'quickstart', 'docs', 'all'],
        help="Process specific collection"
    )
    parser.add_argument(
        '-p', '--provider',
        choices=['openai', 'stability', 'xai'],
        default='openai',
        help="AI provider for image generation (openai, stability, xai)"
    )
    parser.add_argument(
        '-d', '--dry-run',
        action='store_true',
        help="Preview without making changes"
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help="Enable verbose output"
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help="Regenerate images even if preview exists"
    )
    parser.add_argument(
        '--list-missing',
        action='store_true',
        help="Only list files with missing previews"
    )
    parser.add_argument(
        '--output-dir',
        default='assets/images/previews',
        help="Output directory for generated images"
    )
    parser.add_argument(
        '--style',
        default='digital art, professional blog illustration, clean design',
        help="Image style prompt"
    )
    parser.add_argument(
        '--assets-prefix',
        default='/assets',
        help="Prefix to prepend to relative preview paths (default: /assets)"
    )
    parser.add_argument(
        '--no-auto-prefix',
        action='store_true',
        help="Disable automatic assets prefix prepending"
    )
    parser.add_argument(
        '--batch',
        type=int,
        default=0,
        help="Limit number of files to process (0 = no limit)"
    )
    parser.add_argument(
        '--log-file',
        help="Write log output to file"
    )
    parser.add_argument(
        '-w', '--workers',
        type=int,
        default=1,
        help="Number of parallel workers (default: 1 = sequential)"
    )
    parser.add_argument(
        '--rate-limit',
        type=int,
        default=5,
        help="Max API requests per minute (default: 5)"
    )
    
    args = parser.parse_args()
    
    # Set up log file
    if args.log_file:
        try:
            _log_file = open(args.log_file, 'w')
            log(f"Logging to: {args.log_file}", "info")
        except IOError as e:
            log(f"Cannot open log file: {e}", "warning")
    
    # Determine project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    
    # Initialize generator
    generator = PreviewGenerator(
        project_root=project_root,
        provider=args.provider,
        output_dir=args.output_dir,
        image_style=args.style,
        assets_prefix=args.assets_prefix,
        auto_prefix=not args.no_auto_prefix,
        dry_run=args.dry_run,
        verbose=args.verbose,
        force=args.force,
        batch_limit=args.batch,
        workers=args.workers,
        rate_limit=args.rate_limit,
    )
    
    print(f"{Colors.BLUE}{'=' * 50}{Colors.NC}")
    print(f"{Colors.BLUE}🎨 Preview Image Generator{Colors.NC}")
    print(f"{Colors.BLUE}{'=' * 50}{Colors.NC}")
    print()
    
    log(f"Provider:    {args.provider}", "info")
    log(f"Output Dir:  {args.output_dir}", "info")
    log(f"Workers:     {args.workers}", "info")
    log(f"Rate Limit:  {args.rate_limit} req/min", "info")
    log(f"Dry Run:     {args.dry_run}", "info")
    if args.batch > 0:
        log(f"Batch Limit: {args.batch}", "info")
    print()
    
    # Process files
    if args.file:
        file_path = Path(args.file)
        if not file_path.is_absolute():
            file_path = project_root / file_path
        generator.process_file(file_path, args.list_missing)
    elif args.collection:
        collections = {
            'posts': project_root / 'pages' / '_posts',
            'quickstart': project_root / 'pages' / '_quickstart',
            'docs': project_root / 'pages' / '_docs',
        }
        
        if args.collection == 'all':
            for name, path in collections.items():
                log(f"Processing {name}...", "step")
                generator.process_collection(path, args.list_missing)
        else:
            log(f"Processing {args.collection}...", "step")
            generator.process_collection(collections[args.collection], args.list_missing)
    else:
        # Default: process all
        collections = [
            project_root / 'pages' / '_posts',
            project_root / 'pages' / '_quickstart',
            project_root / 'pages' / '_docs',
        ]
        for collection in collections:
            log(f"Processing {collection.name}...", "step")
            generator.process_collection(collection, args.list_missing)
    
    generator.print_summary()
    
    # Close log file
    if _log_file:
        _log_file.close()
    
    errors = generator.stats.errors if isinstance(generator.stats, ThreadSafeStats) else generator.stats.errors
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

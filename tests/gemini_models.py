#!/usr/bin/env python3
"""
Script to list Google Gemini AI models suitable for massive text processing.
Shows model names, context windows, and capabilities.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import from root
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import google.generativeai as genai
    from dotenv import load_dotenv
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install google-generativeai python-dotenv")
    sys.exit(1)


def load_api_key():
    """Load Gemini API key from .env.local file."""
    env_path = Path(__file__).parent.parent / '.env.local'
    
    if not env_path.exists():
        print(f"Error: .env.local file not found at {env_path}")
        sys.exit(1)
    
    load_dotenv(env_path)
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("Error: GEMINI_API_KEY not found in .env.local")
        sys.exit(1)
    
    return api_key


def format_number(num):
    """Format large numbers with commas for readability."""
    if num is None:
        return "N/A"
    if num >= 1_000_000:
        return f"{num:,} ({num / 1_000_000:.1f}M)"
    return f"{num:,}"


def list_gemini_models():
    """List all available Gemini models with their capabilities."""
    api_key = load_api_key()
    genai.configure(api_key=api_key)
    
    print("=" * 100)
    print("GOOGLE GEMINI AI MODELS - TEXT PROCESSING CAPABILITIES")
    print("=" * 100)
    print()
    
    try:
        models = genai.list_models()
        
        # Filter for text generation models
        text_models = []
        for model in models:
            # Check if model supports generateContent method
            if 'generateContent' in model.supported_generation_methods:
                text_models.append(model)
        
        if not text_models:
            print("No text generation models found.")
            return
        
        # Sort by input token limit (descending) to show most capable models first
        text_models.sort(
            key=lambda m: m.input_token_limit if m.input_token_limit else 0,
            reverse=True
        )
        
        print(f"Found {len(text_models)} text generation model(s):\n")
        
        for i, model in enumerate(text_models, 1):
            print(f"{i}. Model: {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Description: {model.description}")
            print(f"   Input Token Limit: {format_number(model.input_token_limit)}")
            print(f"   Output Token Limit: {format_number(model.output_token_limit)}")
            print(f"   Supported Methods: {', '.join(model.supported_generation_methods)}")
            
            # Highlight models good for massive text processing
            if model.input_token_limit and model.input_token_limit >= 1_000_000:
                print(f"   ⭐ EXCELLENT for massive text processing (1M+ tokens)")
            elif model.input_token_limit and model.input_token_limit >= 100_000:
                print(f"   ✓ GOOD for large text processing (100K+ tokens)")
            
            print()
        
        print("=" * 100)
        print("\nRECOMMENDATIONS FOR TEXT PROCESSING:")
        print("-" * 100)
        
        # Find best models for different use cases
        large_context = [m for m in text_models if m.input_token_limit and m.input_token_limit >= 1_000_000]
        medium_context = [m for m in text_models if m.input_token_limit and 100_000 <= m.input_token_limit < 1_000_000]
        
        if large_context:
            print("\n🎯 MASSIVE TEXT PROCESSING (1M+ tokens):")
            for model in large_context[:3]:
                print(f"   • {model.name.split('/')[-1]}")
                print(f"     - Context: {format_number(model.input_token_limit)} input tokens")
                print(f"     - Use for: Resume parsing, large documents, multiple job descriptions")
        
        if medium_context:
            print("\n📄 LARGE TEXT PROCESSING (100K-1M tokens):")
            for model in medium_context[:3]:
                print(f"   • {model.name.split('/')[-1]}")
                print(f"     - Context: {format_number(model.input_token_limit)} input tokens")
                print(f"     - Use for: Job descriptions, cover letters, supporting statements")
        
        # Flash models are generally faster and cheaper
        flash_models = [m for m in text_models if 'flash' in m.name.lower()]
        if flash_models:
            print("\n⚡ FAST & EFFICIENT (Flash models):")
            for model in flash_models[:3]:
                print(f"   • {model.name.split('/')[-1]}")
                print(f"     - Best for: Real-time document generation, quick refinements")
        
        print("\n" + "=" * 100)
        
    except Exception as e:
        print(f"Error listing models: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()


def test_model_access(model_name="gemini-2.0-flash"):
    """Test access to a specific model."""
    api_key = load_api_key()
    genai.configure(api_key=api_key)
    
    print(f"\nTesting access to model: {model_name}")
    print("-" * 50)
    
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello! Respond with 'API access confirmed.'")
        print(f"✓ Success! Response: {response.text}")
        return True
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


if __name__ == "__main__":
    print("\n🤖 Gemini Models Explorer\n")
    
    # List all models
    list_gemini_models()
    
    # Test access to a common model
    print("\n" + "=" * 100)
    print("API ACCESS TEST")
    print("=" * 100)
    test_model_access("gemini-2.0-flash")
    
    print("\n✨ Done!\n")

/**
 * Technical Spike: Visual Audit with GPT-4o Vision
 * Tests if the Vision model can accurately assess design principles on MENA websites.
 *
 * Usage: pnpm spike:visual <image_url_or_local_path>
 */
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

async function runSpike(imageSource: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY. Set it in your environment or .env before running this spike.');
    process.exit(1);
  }
  const openai = new OpenAI({ apiKey });

  console.log(`\nStarting Visual Audit Spike for: ${imageSource}\n`);

  let imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart;

  // If it's a local file, convert to base64 data URI
  if (!imageSource.startsWith('http')) {
    const imageBuffer = fs.readFileSync(path.resolve(imageSource));
    const base64Image = imageBuffer.toString('base64');
    const rawExt = path.extname(imageSource).substring(1).toLowerCase() || 'jpeg';
    const mimeSubtype = rawExt === 'jpg' ? 'jpeg' : rawExt;
    imageContent = {
      type: 'image_url',
      image_url: {
        url: `data:image/${mimeSubtype};base64,${base64Image}`,
        detail: 'high',
      },
    };
  } else {
    imageContent = {
      type: 'image_url',
      image_url: { url: imageSource, detail: 'high' },
    };
  }

  const prompt = `You are a Senior UI/UX Designer and Brand Strategist with 20 years of experience evaluating MENA region websites.

Analyze this website screenshot. Focus ONLY on these three design principles:

1. **Color Harmony** — Are the colors cohesive? Do they fit the brand's likely industry? Is there a clear primary/secondary/accent palette?
2. **Visual Hierarchy** — Is it clear where the user should look first, second, third? Are CTAs prominent? Is the typography hierarchy logical?
3. **Whitespace & Clutter** — Is the design breathable or overwhelming? Is information density appropriate?

Note: The text may be in Arabic (RTL layout). You do not need to read the text perfectly — evaluate the VISUAL layout, spacing, and design quality.

For each principle:
- Score out of 10
- Give 2-3 specific observations (reference exact areas of the screenshot)
- Suggest one concrete improvement

End with an overall "Design Health Score" out of 30 and a one-paragraph summary.

Respond in Egyptian Arabic (مصري).`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          imageContent,
        ],
      },
    ],
    max_tokens: 1500,
  });

  console.log('=== SPIKE RESULTS ===\n');
  console.log(response.choices[0]?.message?.content);
  console.log('\n=====================');
  console.log(`\nTokens used: ${response.usage?.total_tokens}`);
  console.log(`Cost estimate: ~$${((response.usage?.total_tokens || 0) * 0.000005).toFixed(4)}`);
}

const targetImage = process.argv[2];
if (!targetImage) {
  console.error('Usage: pnpm spike:visual <image_url_or_local_path>');
  console.error('Example: pnpm spike:visual https://example.com/screenshot.jpg');
  console.error('Example: pnpm spike:visual ./screenshots/site1.png');
  process.exit(1);
}

void runSpike(targetImage).catch(console.error);
